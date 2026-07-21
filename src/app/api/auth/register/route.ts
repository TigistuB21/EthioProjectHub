import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signJWT } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, departmentId, universityId } = await request.json();

    if (!email || !password || !fullName || !departmentId || !universityId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Verify university exists
    const university = await prisma.university.findUnique({
      where: { id: universityId },
    });

    if (!university) {
      return NextResponse.json({ error: 'Selected university does not exist' }, { status: 400 });
    }

    // Validate email domain against university domains
    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }
    const userDomain = emailParts[1].toLowerCase();
    const allowedDomains = university.domains
      .split(',')
      .map((d: string) => d.trim().toLowerCase());

    if (!allowedDomains.includes(userDomain)) {
      return NextResponse.json({
        error: `Only official university emails ending in @${university.domains} are allowed for registration.`
      }, { status: 400 });
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return NextResponse.json({ error: 'Selected department does not exist' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user (default to STUDENT)
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role: 'STUDENT',
        departmentId,
        universityId,
      },
    });

    // Sign session
    const token = await signJWT({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      departmentId: user.departmentId,
      universityId: user.universityId,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        departmentId: user.departmentId,
        universityId: user.universityId,
      },
    });

    // Set auth cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

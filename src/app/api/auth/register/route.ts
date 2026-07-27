import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signJWT } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const {
      email,
      password,
      fullName,
      departmentId,
      universityId,
      customUniversity,
      customDepartment,
      accountType,
    } = await request.json();

    if (!email || !password || !fullName || !universityId || !departmentId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (universityId === 'OTHER' && (!customUniversity || !customUniversity.trim())) {
      return NextResponse.json({ error: 'Please enter your university name' }, { status: 400 });
    }

    if ((departmentId === 'OTHER' || universityId === 'OTHER') && (!customDepartment || !customDepartment.trim())) {
      return NextResponse.json({ error: 'Please enter your department name' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Extract user email domain
    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }
    const userDomain = emailParts[1].toLowerCase();

    let resolvedUniversityId = universityId;

    // Handle Custom University
    if (universityId === 'OTHER') {
      const universityName = customUniversity.trim();
      let existingUniv = await prisma.university.findFirst({
        where: { name: { equals: universityName } },
      });

      if (!existingUniv) {
        const baseCode = universityName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'UNIV';
        const uniqueCode = `${baseCode}_${Math.floor(1000 + Math.random() * 9000)}`;

        existingUniv = await prisma.university.create({
          data: {
            name: universityName,
            code: uniqueCode,
            domains: userDomain,
          },
        });
      }
      resolvedUniversityId = existingUniv.id;
    } else {
      // Verify existing university
      const university = await prisma.university.findUnique({
        where: { id: universityId },
      });

      if (!university) {
        return NextResponse.json({ error: 'Selected university does not exist' }, { status: 400 });
      }
    }

    let resolvedDepartmentId = departmentId;

    // Handle Custom Department
    if (departmentId === 'OTHER') {
      const deptName = customDepartment.trim();
      let existingDept = await prisma.department.findFirst({
        where: {
          name: { equals: deptName },
          universityId: resolvedUniversityId,
        },
      });

      if (!existingDept) {
        const baseCode = deptName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'DEPT';
        const uniqueCode = `${baseCode}_${Math.floor(1000 + Math.random() * 9000)}`;

        existingDept = await prisma.department.create({
          data: {
            name: deptName,
            code: uniqueCode,
            universityId: resolvedUniversityId,
          },
        });
      }
      resolvedDepartmentId = existingDept.id;
    } else {
      // Verify department exists
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        return NextResponse.json({ error: 'Selected department does not exist' }, { status: 400 });
      }

      // If department is from a different university, ensure department exists for resolvedUniversityId
      if (department.universityId !== resolvedUniversityId) {
        let deptForUniv = await prisma.department.findFirst({
          where: {
            name: department.name,
            universityId: resolvedUniversityId,
          },
        });

        if (!deptForUniv) {
          const uniqueCode = `${department.code}_${Math.floor(1000 + Math.random() * 9000)}`;
          deptForUniv = await prisma.department.create({
            data: {
              name: department.name,
              code: uniqueCode,
              universityId: resolvedUniversityId,
            },
          });
        }
        resolvedDepartmentId = deptForUniv.id;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const isAdvisorRequest = accountType === 'ADVISOR';
    let userStatus = 'ACTIVE';

    if (isAdvisorRequest) {
      userStatus = 'PENDING_VERIFICATION';
      // Auto-verify if email domain matches the target university domain
      if (resolvedUniversityId) {
        const targetUniv = await prisma.university.findUnique({
          where: { id: resolvedUniversityId },
        });

        if (targetUniv && targetUniv.domains) {
          const emailDomain = email.split('@')[1]?.toLowerCase();
          const allowedDomains = targetUniv.domains.toLowerCase().split(',').map((d) => d.trim());
          if (emailDomain && allowedDomains.includes(emailDomain)) {
            userStatus = 'ACTIVE';
          }
        }
      }
    }

    const userRole = isAdvisorRequest ? 'ADVISOR' : 'STUDENT';

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role: userRole,
        status: userStatus,
        requestedRole: isAdvisorRequest ? 'ADVISOR' : 'STUDENT',
        departmentId: resolvedDepartmentId,
        universityId: resolvedUniversityId,
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

import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth and Admin Check
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent self-modification of admin role to avoid lockouts
    if (id === session.id) {
      return NextResponse.json({ error: 'You cannot modify your own administrative role.' }, { status: 400 });
    }

    // 2. Parse and Validate Request Body
    const body = await request.json().catch(() => ({}));
    const { role, departmentId } = body;

    if (!role || (role !== 'STUDENT' && role !== 'ADVISOR' && role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Invalid or missing role parameter.' }, { status: 400 });
    }

    // Validate department scope if provided
    if (departmentId) {
      const departmentExists = await prisma.department.findUnique({
        where: { id: departmentId }
      });
      if (!departmentExists) {
        return NextResponse.json({ error: 'Department not found.' }, { status: 400 });
      }
    }

    // 3. Perform Update
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role,
        departmentId: departmentId || null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        departmentId: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.fullName} updated to ${role} role.`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

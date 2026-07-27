import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('universityId');

    let departments;
    if (universityId && universityId !== 'OTHER') {
      departments = await prisma.department.findMany({
        where: { universityId },
        orderBy: { name: 'asc' },
      });

      if (departments.length === 0) {
        departments = await prisma.department.findMany({
          distinct: ['name'],
          orderBy: { name: 'asc' },
        });
      }
    } else {
      // If OTHER or no universityId specified, return distinct common departments across universities
      departments = await prisma.department.findMany({
        distinct: ['name'],
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json({ departments });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Auth and Admin Check
    const session = await getUserSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
    }

    // 2. Parse and Validate
    const { name, code } = await request.json().catch(() => ({}));
    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required.' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedCode = code.trim();

    // Check unique constraints
    const existing = await prisma.department.findFirst({
      where: {
        OR: [
          { name: trimmedName },
          { code: trimmedCode }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'A department with this name or code already exists.' }, { status: 400 });
    }

    // 3. Create Department
    const newDept = await prisma.department.create({
      data: {
        name: trimmedName,
        code: trimmedCode
      }
    });

    return NextResponse.json({
      success: true,
      department: newDept
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


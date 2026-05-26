import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication & Role Check
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (session.role !== 'ADVISOR' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Only advisors and administrators can review projects.' }, { status: 403 });
    }

    const { id } = await params;

    // 2. Parse and Validate Request Body
    const body = await request.json().catch(() => ({}));
    const { status, feedback } = body;

    if (!status || (status !== 'APPROVED' && status !== 'REJECTED')) {
      return NextResponse.json({ error: 'Status must be either APPROVED or REJECTED.' }, { status: 400 });
    }

    // 3. Find the Project
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    // If advisor, they should only review projects in their own department (if specified)
    if (session.role === 'ADVISOR' && session.departmentId && project.departmentId !== session.departmentId) {
      return NextResponse.json({ error: 'Unauthorized. Advisors can only review projects in their own department.' }, { status: 403 });
    }

    // 4. Update status and log approval history in a transaction
    const [updatedProject, approvalRecord] = await prisma.$transaction([
      prisma.project.update({
        where: { id },
        data: { status }
      }),
      prisma.projectApproval.create({
        data: {
          projectId: id,
          reviewerId: session.id,
          status,
          feedback: feedback ? feedback.trim() : null
        },
        include: {
          reviewer: {
            select: {
              id: true,
              fullName: true,
              role: true
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: `Project status successfully updated to ${status}.`,
      project: updatedProject,
      approval: approvalRecord
    });

  } catch (error) {
    console.error('Error reviewing project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

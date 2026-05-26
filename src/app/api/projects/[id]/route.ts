import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true
          }
        },
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        },
        approvals: {
          include: {
            reviewer: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Access authorization check for non-approved projects
    if (project.status !== 'APPROVED') {
      const session = await getUserSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized to view unapproved projects' }, { status: 401 });
      }

      const isUploader = project.uploaderId === session.id;
      const isReviewer = session.role === 'ADVISOR' || session.role === 'ADMIN';

      if (!isUploader && !isReviewer) {
        return NextResponse.json({ error: 'Unauthorized to view this project' }, { status: 403 });
      }
    }

    return NextResponse.json({ project });

  } catch (error) {
    console.error('Error fetching project details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUnivId = searchParams.get('universityId') || session.universityId;
    const targetDeptId = searchParams.get('departmentId') || session.departmentId;

    const whereFilter: any = {};
    if (session.role === 'ADVISOR' && session.departmentId) {
      whereFilter.departmentId = session.departmentId;
    } else if (session.role === 'UNIVERSITY_ADMIN' && targetUnivId) {
      whereFilter.department = { universityId: targetUnivId };
    } else if (targetDeptId) {
      whereFilter.departmentId = targetDeptId;
    }

    // 1. Status Counts
    const [total, approved, pending, revision, rejected] = await Promise.all([
      prisma.project.count({ where: whereFilter }),
      prisma.project.count({ where: { ...whereFilter, status: 'APPROVED' } }),
      prisma.project.count({ where: { ...whereFilter, status: 'PENDING' } }),
      prisma.project.count({ where: { ...whereFilter, status: 'REVISION_REQUESTED' } }),
      prisma.project.count({ where: { ...whereFilter, status: 'REJECTED' } }),
    ]);

    // 2. Submissions by Year
    const yearGroups = await prisma.project.groupBy({
      by: ['year'],
      where: whereFilter,
      _count: { id: true },
      orderBy: { year: 'asc' },
    });

    // 3. Top Popular Tags
    const popularTags = await prisma.tag.findMany({
      take: 8,
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: {
        projects: {
          _count: 'desc',
        },
      },
    });

    return NextResponse.json({
      analytics: {
        overview: {
          total,
          approved,
          pending,
          revision,
          rejected,
          approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
        },
        yearDistribution: yearGroups.map((g) => ({
          year: g.year,
          count: g._count.id,
        })),
        topTags: popularTags.map((t) => ({
          name: t.name,
          count: t._count.projects,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to compute analytics:', error);
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}

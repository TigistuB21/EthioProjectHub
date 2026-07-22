import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { projects: true }
        }
      },
      orderBy: {
        projects: {
          _count: 'desc'
        }
      },
      take: 20
    });

    const formattedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      count: tag._count.projects
    }));

    return NextResponse.json({ tags: formattedTags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

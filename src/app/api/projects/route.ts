import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const departmentId = searchParams.get('departmentId');
    const yearStr = searchParams.get('year');
    const statusParam = searchParams.get('status');
    const uploaderId = searchParams.get('uploaderId');
    
    // Pagination parameters
    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');
    
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 9;
    
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: 'Invalid page parameter' }, { status: 400 });
    }
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
    }

    const session = await getUserSession();

    // Determine target status filter and enforce authorization
    let statusFilter = 'APPROVED';
    if (statusParam) {
      statusFilter = statusParam.toUpperCase();
    }

    // Authorization checks
    if (statusFilter !== 'APPROVED' || uploaderId) {
      // Must be authenticated to view non-approved projects or filter by user
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized to view non-approved or user-specific projects' }, { status: 401 });
      }

      // If user is STUDENT, they can only view their own projects
      if (session.role === 'STUDENT') {
        if (uploaderId && uploaderId !== session.id) {
          return NextResponse.json({ error: 'Unauthorized to view another student\'s projects' }, { status: 403 });
        }
        // Force the query to filter by their own ID if they search non-approved projects
        if (statusFilter !== 'APPROVED') {
          // A student can only see their own pending/rejected projects
          if (uploaderId && uploaderId !== session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
          }
        }
      }
    }

    // Build the query conditions
    const andConditions: any[] = [];

    // Filter by query (title, abstract, tags, teamMembers)
    if (q && q.trim() !== '') {
      const searchTerm = q.trim();
      andConditions.push({
        OR: [
          { title: { contains: searchTerm } },
          { abstract: { contains: searchTerm } },
          { teamMembers: { contains: searchTerm } },
          { tags: { some: { name: { contains: searchTerm } } } }
        ]
      });
    }

    // Filter by department
    if (departmentId && departmentId !== 'all') {
      andConditions.push({ departmentId });
    }

    // Filter by year
    if (yearStr && yearStr !== 'all') {
      const year = parseInt(yearStr, 10);
      if (!isNaN(year)) {
        andConditions.push({ year });
      }
    }

    // Filter by uploader
    if (uploaderId) {
      andConditions.push({ uploaderId });
    }

    // Filter by status (with auth already validated)
    andConditions.push({ status: statusFilter });

    // Special behavior: If advisor queries for PENDING projects, they should ideally see projects
    // from their own department. We can enforce this or keep it open.
    // Let's filter pending/rejected projects for ADVISORs to their own department, unless they specify "all"
    if (session && session.role === 'ADVISOR' && statusFilter === 'PENDING' && !departmentId) {
      if (session.departmentId) {
        andConditions.push({ departmentId: session.departmentId });
      }
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    // Get total count for pagination
    const total = await prisma.project.count({ where });

    // Get paginated projects
    const projects = await prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
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
        }
      }
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      projects,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

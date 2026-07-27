import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { savePdf, deletePdf } from '@/lib/storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.uploaderId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Only the project uploader can resubmit.' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string | null;
    const abstract = formData.get('abstract') as string | null;
    const pdfFile = formData.get('pdfFile') as File | null;

    let newPdfUrl = project.pdfUrl;

    if (pdfFile && pdfFile.size > 0) {
      if (pdfFile.type !== 'application/pdf' && !pdfFile.name.endsWith('.pdf')) {
        return NextResponse.json({ error: 'Uploaded file must be a PDF.' }, { status: 400 });
      }

      // Save new file and delete old local file if present
      newPdfUrl = await savePdf(pdfFile);
      if (project.pdfUrl && project.pdfUrl !== newPdfUrl) {
        await deletePdf(project.pdfUrl);
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title: title ? title.trim() : project.title,
        abstract: abstract ? abstract.trim() : project.abstract,
        pdfUrl: newPdfUrl,
        status: 'PENDING', // Reset status to PENDING for advisor re-review
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Project resubmitted successfully for advisor review.',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Project resubmission error:', error);
    return NextResponse.json({ error: 'Failed to resubmit project' }, { status: 500 });
  }
}

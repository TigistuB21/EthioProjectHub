import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { savePdf, deletePdf } from '@/lib/storage';
import { extractProjectMetadata, verifyProjectDocument } from '@/lib/gemini';
import pdf from 'pdf-parse';

export async function POST(request: Request) {
  let savedFilePath: string | null = null;

  try {
    // 1. Authentication & Role Check
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (session.role !== 'STUDENT' && session.role !== 'ADVISOR') {
      return NextResponse.json({ error: 'Unauthorized. Only students and advisors can upload projects.' }, { status: 403 });
    }

    // 2. Parse Form Data
    const formData = await request.formData();
    const title = formData.get('title') as string | null;
    const abstract = formData.get('abstract') as string | null;
    const departmentId = formData.get('departmentId') as string | null;
    const yearStr = formData.get('year') as string | null;
    const teamMembers = formData.get('teamMembers') as string | null;
    const pdfFile = formData.get('pdfFile') as File | null;

    // 3. Validation
    if (!title || !abstract || !departmentId || !yearStr || !teamMembers || !pdfFile) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      return NextResponse.json({ error: 'Invalid academic year.' }, { status: 400 });
    }

    if (pdfFile.type !== 'application/pdf' && !pdfFile.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Uploaded file must be a PDF.' }, { status: 400 });
    }

    // Check file size (e.g., max 15MB)
    if (pdfFile.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'PDF file size must be less than 15MB.' }, { status: 400 });
    }

    // Validate Department Exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    });
    if (!department) {
      return NextResponse.json({ error: 'Selected department does not exist.' }, { status: 400 });
    }

    // 3b. Read and parse PDF for AI verification
    let pdfTextSample = '';
    try {
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      const pdfData = await pdf(buffer);
      pdfTextSample = pdfData.text.slice(0, 8000);
    } catch (parseError) {
      console.error('Error parsing PDF content:', parseError);
      return NextResponse.json({ error: 'Uploaded PDF file could not be parsed or is corrupted.' }, { status: 400 });
    }

    // 3c. Run Gemini AI Verification
    try {
      const verification = await verifyProjectDocument(
        title,
        session.fullName,
        department.name,
        pdfTextSample
      );

      if (!verification.valid) {
        return NextResponse.json({
          error: `Document verification failed: ${verification.reason}`
        }, { status: 400 });
      }
    } catch (verifyError) {
      console.error('Error during AI verification check:', verifyError);
      // Fallback: don't block the upload if Gemini is offline/rate limited, but log it
    }

    // 4. Save PDF to public storage
    try {
      savedFilePath = await savePdf(pdfFile);
    } catch (saveError) {
      console.error('Error saving PDF file:', saveError);
      return NextResponse.json({ error: 'Failed to save PDF file on the server.' }, { status: 500 });
    }

    // 5. Run Gemini AI Enrichment (Extract summary and tags)
    let aiSummary = '';
    let aiTags: string[] = [];
    try {
      const enrichment = await extractProjectMetadata(title, abstract);
      aiSummary = enrichment.summary;
      aiTags = enrichment.tags;
    } catch (aiError) {
      console.error('AI Enrichment failed:', aiError);
      // Fallback: Use simple abstract slice and generic tags
      aiSummary = abstract.slice(0, 150) + (abstract.length > 150 ? '...' : '');
      aiTags = ['Academic', 'Research'];
    }

    // 6. DB Insertion (using prisma)
    // Connect or create tags
    const tagConnectOrCreate = aiTags.map(tagName => {
      // Normalize tag: clean whitespace, lowercase, capitalize words
      const cleaned = tagName
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
      return {
        where: { name: cleaned },
        create: { name: cleaned }
      };
    });

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        abstract: abstract.trim(),
        summary: aiSummary.trim(),
        year,
        pdfUrl: savedFilePath,
        teamMembers: teamMembers.trim(),
        status: 'PENDING',
        departmentId,
        uploaderId: session.id,
        tags: {
          connectOrCreate: tagConnectOrCreate
        }
      },
      include: {
        department: true,
        tags: true,
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

    return NextResponse.json({
      success: true,
      message: 'Project uploaded successfully and sent for approval.',
      project
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in project upload API:', error);
    // Cleanup saved file if database insertion failed
    if (savedFilePath) {
      await deletePdf(savedFilePath);
    }
    return NextResponse.json({ error: 'An unexpected internal error occurred.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const question = body.question as string | undefined;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        department: true,
        tags: true,
        uploader: { select: { fullName: true } }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
You are an AI research assistant for Ethiopian Universities.
You are helping a researcher or student understand the following graduation/final-year thesis project.

Project Title: ${project.title}
Department: ${project.department.name} (${project.department.code})
Academic Year: ${project.year}
Authors/Team: ${project.teamMembers}
Tags: ${project.tags.map(t => t.name).join(', ')}

Project Abstract:
"""
${project.abstract}
"""

${project.summary ? `Project AI Summary:\n"${project.summary}"\n` : ''}

User Question: "${question.trim()}"

Please answer the user's question concisely, professionally, and accurately based on the project information provided above. If the details are not explicitly mentioned in the project abstract, give an educated academic response based on standard engineering/research practices in this domain while noting that details may vary in the full PDF. Keep the response friendly, clear, and structured (under 250 words).
`;

        const result = await model.generateContent(prompt);
        const answer = result.response.text();

        return NextResponse.json({ answer });
      } catch (geminiErr) {
        console.error('Gemini API chat error:', geminiErr);
        // Fallback to intelligent rule-based response
      }
    }

    // Smart Fallback answer when GEMINI_API_KEY is not defined or hits quota
    const qLower = question.toLowerCase();
    let fallbackAnswer = '';

    if (qLower.includes('objective') || qLower.includes('goal') || qLower.includes('purpose') || qLower.includes('what is')) {
      fallbackAnswer = `The primary objective of "${project.title}" is to address key challenges in ${project.department.name} (${project.year}). Key highlights from the abstract: ${project.summary || project.abstract.slice(0, 200)}...`;
    } else if (qLower.includes('author') || qLower.includes('who') || qLower.includes('team') || qLower.includes('student')) {
      fallbackAnswer = `This project was conducted by ${project.teamMembers} under the ${project.department.name} department for the ${project.year} academic class.`;
    } else if (qLower.includes('tech') || qLower.includes('tool') || qLower.includes('tag') || qLower.includes('language')) {
      fallbackAnswer = `The technical keywords associated with this thesis include: ${project.tags.map(t => t.name).join(', ')}.`;
    } else {
      fallbackAnswer = `Regarding "${question}": Based on the project overview, "${project.title}" was completed in ${project.year} by ${project.teamMembers} (${project.department.code}). Summary: ${project.summary || project.abstract.slice(0, 180)}... Download the full PDF for full experimental methodology and data.`;
    }

    return NextResponse.json({ answer: fallbackAnswer });

  } catch (error) {
    console.error('Error in project chat API:', error);
    return NextResponse.json({ error: 'Failed to process question' }, { status: 500 });
  }
}

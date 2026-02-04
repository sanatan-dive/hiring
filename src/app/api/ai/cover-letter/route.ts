import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Check Subscription
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        subscription: true,
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            parsedExperiences: true,
            parsedSkills: true,
          },
        },
      },
    });

    const isPro = user?.subscription?.plan === 'PRO' && user?.subscription?.status === 'active';
    if (!isPro) {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
    }

    const { jobDescription, jobTitle, companyName } = await req.json();

    if (!genAI) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    // 2. Prepare Context
    const resume = user.resumes[0];
    if (!resume) {
      return NextResponse.json({ error: 'No resume found' }, { status: 400 });
    }

    const experienceText = resume.parsedExperiences
      .map((e) => `${e.role} at ${e.company}: ${e.description}`)
      .join('\n');

    const skillsText = resume.parsedSkills.map((s) => s.skill).join(', ');

    // 3. Generate Cover Letter
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Write a professional and compelling cover letter for the position of "${jobTitle}" at "${companyName}".
      
      Job Description:
      ${jobDescription.substring(0, 1000)}... (truncated)

      My Experience:
      ${experienceText}

      My Skills:
      ${skillsText}

      Tone: Professional, enthusiastic, and confident.
      Format: Markdown.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ coverLetter: text });
  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 });
  }
}

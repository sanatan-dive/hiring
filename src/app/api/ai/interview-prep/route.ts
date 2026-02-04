import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
      include: { subscription: true },
    });

    const isPro = user?.subscription?.plan === 'PRO' && user?.subscription?.status === 'active';
    if (!isPro) {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
    }

    const { jobDescription, jobTitle, companyName } = await req.json();

    if (!genAI) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    // 2. Generate Interview Prep
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      I am interviewing for the role of "${jobTitle}" at "${companyName}".
      
      Job Description:
      ${jobDescription.substring(0, 1000)}...

      Please provide:
      1. 5 likely interview questions specific to this role and company.
      2. Key topics I should study.
      3. A short "Elevator Pitch" for myself based on the role.

      Format: JSON structure like { questions: [], topics: [], pitch: "" }.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean markdown code blocks if present
    const cleanText = text.replace(/```json\n|\n```/g, '');

    return NextResponse.json({ prep: JSON.parse(cleanText) });
  } catch (error) {
    console.error('Interview prep generation error:', error);
    return NextResponse.json({ error: 'Failed to generate interview prep' }, { status: 500 });
  }
}

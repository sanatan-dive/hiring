import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET - Retrieve user's resume and parsed data
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        resumes: {
          include: {
            parsedSkills: true,
            parsedExperiences: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1, // Get the most recent resume
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resume = user.resumes[0] || null;

    return NextResponse.json({
      resume: resume
        ? {
            id: resume.id,
            fileName: resume.fileName,
            fileUrl: resume.fileUrl,
            skills: resume.parsedSkills.map((s) => s.skill),
            experiences: resume.parsedExperiences.map((e) => ({
              company: e.company,
              role: e.role,
              duration: e.duration,
              description: e.description,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create/update resume record
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, fileUrl, rawText } = body;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Create user if not exists (fallback)
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: '', // Will be updated by webhook
        },
      });
    }

    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: fileName || 'resume.pdf',
        fileUrl,
        rawText,
      },
    });

    return NextResponse.json({ resume });
  } catch (error) {
    console.error('Error creating resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

interface ExperienceInput {
  company?: string;
  role?: string;
  duration?: string;
  description?: string;
}

// GET - Get user's experiences
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        resumes: {
          include: { parsedExperiences: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user || !user.resumes[0]) {
      return NextResponse.json({ experiences: [] });
    }

    return NextResponse.json({
      experiences: user.resumes[0].parsedExperiences.map((exp) => ({
        id: exp.id,
        company: exp.company,
        role: exp.role,
        duration: exp.duration,
        description: exp.description,
      })),
    });
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save/update experiences
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { experiences } = body;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { resumes: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure user has a resume
    let resumeId = user.resumes[0]?.id;
    if (!resumeId) {
      const newResume = await prisma.resume.create({
        data: {
          userId: user.id,
          fileName: 'manual_entry',
          fileUrl: null,
          rawText: null,
        },
      });
      resumeId = newResume.id;
    }

    // Delete existing experiences
    await prisma.parsedExperience.deleteMany({
      where: { resumeId },
    });

    // Create new experiences
    if (experiences && Array.isArray(experiences)) {
      const validExperiences = experiences.filter((e: ExperienceInput) => e.role || e.company);

      if (validExperiences.length > 0) {
        await prisma.parsedExperience.createMany({
          data: validExperiences.map((exp: ExperienceInput) => ({
            resumeId,
            company: exp.company || null,
            role: exp.role || null,
            duration: exp.duration || null,
            description: exp.description || null,
          })),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving experiences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// POST - Save parsed resume data (skills, experiences, etc.)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { resumeId, skills, experiences, name } = body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { resumes: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetResumeId = resumeId || user.resumes[0]?.id;

    if (!targetResumeId) {
      return NextResponse.json(
        { error: 'No resume found. Upload a resume first.' },
        { status: 400 }
      );
    }

    // Save skills
    if (skills && Array.isArray(skills)) {
      // Delete existing skills for this resume
      await prisma.parsedSkill.deleteMany({
        where: { resumeId: targetResumeId },
      });

      // Insert new skills
      await prisma.parsedSkill.createMany({
        data: skills.map((skill: string) => ({
          resumeId: targetResumeId,
          skill,
        })),
      });
    }

    // Save experiences
    if (experiences && Array.isArray(experiences)) {
      // Delete existing experiences
      await prisma.parsedExperience.deleteMany({
        where: { resumeId: targetResumeId },
      });

      // Insert new experiences
      await prisma.parsedExperience.createMany({
        data: experiences.map(
          (exp: { company?: string; role?: string; duration?: string; description?: string }) => ({
            resumeId: targetResumeId,
            company: exp.company,
            role: exp.role,
            duration: exp.duration,
            description: exp.description,
          })
        ),
      });
    }

    // Update user name if provided from resume parsing
    if (name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Parsed resume data saved successfully',
    });
  } catch (error) {
    console.error('Error saving parsed resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

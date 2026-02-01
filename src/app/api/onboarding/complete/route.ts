import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// POST - Save complete onboarding data (resume + preferences + skills)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      // Resume data
      resumeFileName,
      skills, // Now saved directly on user
      experiences,
      // Preferences
      desiredRoles,
      experienceLevel,
      workLocation,
      locations,
      salaryRange,
      jobType,
    } = body;

    // First, ensure user exists in DB
    const clerkUser = await currentUser();
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress || '',
          name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || null,
          imageUrl: clerkUser?.imageUrl,
          skills: skills || [],
        },
      });
    } else {
      // Update user with skills
      user = await prisma.user.update({
        where: { id: user.id },
        data: { skills: skills || [] },
      });
    }

    // Create or update resume with parsed data
    if (resumeFileName || experiences?.length) {
      // Delete existing resume data
      await prisma.resume.deleteMany({
        where: { userId: user.id },
      });

      // Create new resume
      const resume = await prisma.resume.create({
        data: {
          userId: user.id,
          fileName: resumeFileName || 'resume.pdf',
        },
      });

      // Add skills to parsedSkills (for reference)
      if (skills?.length) {
        await prisma.parsedSkill.createMany({
          data: skills.map((skill: string) => ({
            resumeId: resume.id,
            skill,
          })),
        });
      }

      // Add experiences
      if (experiences?.length) {
        await prisma.parsedExperience.createMany({
          data: experiences.map(
            (exp: {
              company?: string;
              role?: string;
              duration?: string;
              description?: string;
            }) => ({
              resumeId: resume.id,
              company: exp.company,
              role: exp.role,
              duration: exp.duration,
              description: exp.description,
            })
          ),
        });
      }
    }

    // Upsert job preferences (without preferredTechStack)
    await prisma.jobPreferences.upsert({
      where: { userId: user.id },
      update: {
        desiredRoles: desiredRoles || [],
        experienceLevel,
        workLocation,
        locations: locations || [],
        salaryMin: salaryRange?.min,
        salaryMax: salaryRange?.max,
        salaryCurrency: salaryRange?.currency || 'USD',
        jobType,
      },
      create: {
        userId: user.id,
        desiredRoles: desiredRoles || [],
        experienceLevel,
        workLocation,
        locations: locations || [],
        salaryMin: salaryRange?.min,
        salaryMax: salaryRange?.max,
        salaryCurrency: salaryRange?.currency || 'USD',
        jobType,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding data saved successfully',
    });
  } catch (error) {
    console.error('Error saving onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

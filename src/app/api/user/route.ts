import { log } from '@/lib/log';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET - Get complete user profile from database
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
          include: {
            parsedSkills: true,
            parsedExperiences: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        jobPreferences: true,
        socialLinks: true,
        projects: { orderBy: { createdAt: 'desc' } },
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const resume = user.resumes[0];

    return NextResponse.json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
        skills: user.skills,
        emailDigestEnabled: user.emailDigestEnabled,
        hiddenCompanies: user.hiddenCompanies,
        subscription: user.subscription
          ? {
              plan: user.subscription.plan,
              status: user.subscription.status,
              currentPeriodEnd: user.subscription.currentPeriodEnd,
              cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
            }
          : { plan: 'FREE', status: 'inactive', currentPeriodEnd: null, cancelAtPeriodEnd: false },
        resumes: user.resumes.map((r) => ({
          id: r.id,
          fileName: r.fileName,
          createdAt: r.createdAt,
          parsedSkillsCount: r.parsedSkills.length,
          parsedExperiencesCount: r.parsedExperiences.length,
        })),
        resume: resume
          ? {
              id: resume.id,
              fileName: resume.fileName,
              parsedSkills: resume.parsedSkills.map((s) => s.skill),
              experiences: resume.parsedExperiences.map((e) => ({
                company: e.company,
                role: e.role,
                duration: e.duration,
                description: e.description,
              })),
            }
          : null,
        preferences: user.jobPreferences
          ? {
              desiredRoles: user.jobPreferences.desiredRoles,
              experienceLevel: user.jobPreferences.experienceLevel,
              workLocation: user.jobPreferences.workLocation,
              locations: user.jobPreferences.locations,
              salaryRange: {
                min: user.jobPreferences.salaryMin || 70000,
                max: user.jobPreferences.salaryMax || 120000,
                currency: user.jobPreferences.salaryCurrency || 'USD',
              },
              jobType: user.jobPreferences.jobType,
            }
          : null,
        socialLinks: user.socialLinks.map((link) => ({
          platform: link.platform,
          url: link.url,
        })),
        projects: user.projects.map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          url: project.url,
          techUsed: project.techUsed,
        })),
      },
    });
  } catch (error) {
    log.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

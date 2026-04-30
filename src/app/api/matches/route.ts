import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import { findSimilarJobs } from '@/services/matching.service';
import { generateEmbedding } from '@/lib/ai/google';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '20');

    let embedding: number[] | null = null;

    if (query) {
      // If query provided, generate embedding for it
      embedding = await generateEmbedding(query);
    } else {
      // Build a rich profile embedding from user's skills + preferences + resume
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
          resumes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              parsedSkills: true,
              parsedExperiences: true,
            },
          },
          jobPreferences: true,
        },
      });

      if (user) {
        const parts: string[] = [];

        // User skills (stored directly on user from onboarding)
        if (user.skills?.length) {
          parts.push(user.skills.join(', '));
        }

        // Resume parsed skills
        const resume = user.resumes[0];
        if (resume?.parsedSkills?.length) {
          parts.push(resume.parsedSkills.map((s) => s.skill).join(', '));
        }

        // Resume experiences (role + company + description snippets)
        if (resume?.parsedExperiences?.length) {
          const expText = resume.parsedExperiences
            .map(
              (e) =>
                `${e.role || ''} at ${e.company || ''} ${(e.description || '').substring(0, 200)}`
            )
            .join('. ');
          parts.push(expText);
        }

        // Job preferences
        const prefs = user.jobPreferences;
        if (prefs?.desiredRoles?.length) {
          parts.push(prefs.desiredRoles.join(', '));
        }
        if (prefs?.experienceLevel) parts.push(prefs.experienceLevel);
        if (prefs?.workLocation) parts.push(prefs.workLocation);
        if (prefs?.locations?.length) parts.push(prefs.locations.join(', '));

        if (parts.length > 0) {
          const text = parts.join(' | ').substring(0, 8000);
          embedding = await generateEmbedding(text);
        }
      }
    }

    if (!embedding) {
      // Fallback: just return recent jobs if no context
      const jobs = await prisma.job.findMany({
        take: limit,
        orderBy: { scrapedAt: 'desc' },
      });
      return NextResponse.json({ jobs });
    }

    // Perform vector search
    // We ensured embedding is not null above
    const jobs = await findSimilarJobs(embedding, limit);
    return NextResponse.json({ jobs });
  } catch (error) {
    log.error('Matches API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

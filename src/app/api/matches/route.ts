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
      // Otherwise, try to use user's resume embedding
      // First get the user's latest resume
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { resumes: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });

      if (user) {
        // Use Preferences first if no query
        const prefs = await prisma.jobPreferences.findUnique({ where: { userId: user.id } });
        // Use optional chaining and null check
        if (prefs && prefs.desiredRoles && prefs.desiredRoles.length > 0) {
          const text = `${prefs.desiredRoles.join(' ')} ${prefs.experienceLevel || ''} ${prefs.workLocation || ''}`;
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
    console.error('Matches API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

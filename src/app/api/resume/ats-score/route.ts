import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import { computeAtsScore } from '@/lib/jobs/ats-score';

/**
 * POST /api/resume/ats-score
 * Body: { jobId: string }
 *
 * Returns the ATS-style score of the user's most recent resume against
 * the given job's description. Available on free tier (it's our acquisition
 * hook) but rate-limited.
 */
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId } = await req.json();
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        resumes: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const resume = user.resumes[0];
    if (!resume?.rawText) {
      return NextResponse.json(
        { error: 'No resume uploaded yet. Upload one to get ATS scores.' },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { title: true, company: true, description: true },
    });
    if (!job?.description) {
      return NextResponse.json({ error: 'Job has no description to score against' }, { status: 400 });
    }

    const result = computeAtsScore({
      resumeText: resume.rawText,
      jobDescription: `${job.title} at ${job.company}\n\n${job.description}`,
    });

    return NextResponse.json(result);
  } catch (err) {
    log.error('ats-score failed', err);
    return NextResponse.json({ error: 'Failed to compute score' }, { status: 500 });
  }
}

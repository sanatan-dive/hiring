import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';

/**
 * POST /api/matches/hide
 * Body: { jobId: string }
 *
 * Marks a JobMatch as hidden for the user. The match still exists in the DB
 * but won't appear in /api/matches results. User-scoped — does not affect
 * other users.
 */
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId } = await req.json();
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await prisma.jobMatch.upsert({
      where: { userId_jobId: { userId: user.id, jobId } },
      create: { userId: user.id, jobId, status: 'hidden' },
      update: { status: 'hidden' },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('hide match failed', err);
    return NextResponse.json({ error: 'Failed to hide match' }, { status: 500 });
  }
}

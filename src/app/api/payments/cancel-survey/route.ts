import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { log } from '@/lib/log';

const VALID_REASONS = ['expensive', 'found-job', 'not-useful', 'other'] as const;
type Reason = (typeof VALID_REASONS)[number];

function isReason(v: unknown): v is Reason {
  return typeof v === 'string' && (VALID_REASONS as readonly string[]).includes(v);
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const reason = (body as { reason?: unknown })?.reason;
    const commentRaw = (body as { comment?: unknown })?.comment;

    if (!isReason(reason)) {
      return NextResponse.json(
        { error: 'reason must be one of: expensive, found-job, not-useful, other' },
        { status: 400 }
      );
    }

    let comment: string | undefined;
    if (commentRaw !== undefined && commentRaw !== null) {
      if (typeof commentRaw !== 'string') {
        return NextResponse.json({ error: 'comment must be a string' }, { status: 400 });
      }
      const trimmed = commentRaw.trim().slice(0, 2000);
      if (trimmed.length > 0) comment = trimmed;
    }

    log.info('[cancel-survey] response received', {
      clerkId,
      reason,
      hasComment: Boolean(comment),
      comment,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('[cancel-survey] failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 }
    );
  }
}

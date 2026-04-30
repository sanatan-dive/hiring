import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';

/**
 * POST /api/user/email-prefs
 * Body: { emailDigestEnabled: boolean }
 */
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const enabled = Boolean(body?.emailDigestEnabled);

    const updated = await prisma.user.update({
      where: { clerkId },
      data: { emailDigestEnabled: enabled },
      select: { emailDigestEnabled: true },
    });

    return NextResponse.json({ ok: true, emailDigestEnabled: updated.emailDigestEnabled });
  } catch (err) {
    log.error('email-prefs update failed', err);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}

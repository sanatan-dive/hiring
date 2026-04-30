import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import { getOrCreateReferralCode, getReferralStats } from '@/services/referral.service';

/**
 * GET /api/referrals → { code, link, totalSignups, upgrades, upgradesNeededFor6mo, ... }
 *
 * Lazily generates the user's referral code on first call.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const code = await getOrCreateReferralCode(user.id);
    const stats = await getReferralStats(user.id);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return NextResponse.json({
      ...stats,
      code,
      link: `${appUrl}/?ref=${code}`,
    });
  } catch (err) {
    log.error('referrals get failed', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

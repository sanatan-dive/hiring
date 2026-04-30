import crypto from 'node:crypto';
import { log } from '@/lib/log';
import prisma from '@/lib/db/prisma';

/**
 * Reward thresholds for referral milestones.
 * 3 friends who upgrade → free Pro for 6 months
 * 10 friends who upgrade → free Pro for life
 */
export const REFERRAL_REWARDS = {
  PRO_6_MONTHS: 3,
  PRO_LIFETIME: 10,
} as const;

const ADJECTIVES = ['swift', 'sharp', 'bold', 'bright', 'clear', 'keen', 'wise'];
const NOUNS = ['hire', 'match', 'role', 'apply', 'land', 'climb', 'grow'];

function generateReferralCode(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = crypto.randomBytes(2).toString('hex');
  return `${adj}-${noun}-${suffix}`;
}

/**
 * Get or create the user's referral code (lazy, on first share).
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (user?.referralCode) return user.referralCode;

  // Try a few times in case of unique-collision (very rare)
  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode();
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      return updated.referralCode!;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== 'P2002') throw err;
      log.warn('referral code collision, retrying');
    }
  }
  throw new Error('Could not generate unique referral code');
}

/**
 * Called from middleware/sign-up callback when a new user signs up via
 * a referral link.
 */
export async function attributeReferral(args: {
  refereeUserId: string;
  refereeEmail: string;
  referralCode: string;
}): Promise<void> {
  const { refereeUserId, refereeEmail, referralCode } = args;
  const referrer = await prisma.user.findUnique({
    where: { referralCode },
    select: { id: true },
  });
  if (!referrer) {
    log.warn('referral code not found', { referralCode });
    return;
  }
  if (referrer.id === refereeUserId) {
    log.warn('user tried to refer themselves', { userId: refereeUserId });
    return;
  }

  try {
    await prisma.referral.create({
      data: {
        referrerUserId: referrer.id,
        refereeUserId,
        refereeEmail,
        status: 'signed_up',
        signedUpAt: new Date(),
      },
    });
    await prisma.user.update({
      where: { id: refereeUserId },
      data: { referredByUserId: referrer.id },
    });
  } catch (err) {
    // P2002 = unique constraint on referee_user_id (already attributed)
    const code = (err as { code?: string }).code;
    if (code !== 'P2002') {
      log.error('attribute referral failed', err, { refereeUserId });
    }
  }
}

/**
 * Called from the Dodo webhook when a referee upgrades to Pro.
 * Updates the referral row and checks if the referrer hit a reward
 * milestone.
 */
export async function markReferralUpgraded(refereeUserId: string): Promise<{
  referrerId: string | null;
  rewardEarned: 'PRO_6_MONTHS' | 'PRO_LIFETIME' | null;
}> {
  const r = await prisma.referral.findUnique({
    where: { refereeUserId },
  });
  if (!r) return { referrerId: null, rewardEarned: null };

  await prisma.referral.update({
    where: { id: r.id },
    data: { status: 'upgraded', upgradedAt: new Date() },
  });

  const upgradedCount = await prisma.referral.count({
    where: {
      referrerUserId: r.referrerUserId,
      status: 'upgraded',
      rewardGranted: false,
    },
  });

  let rewardEarned: 'PRO_6_MONTHS' | 'PRO_LIFETIME' | null = null;
  if (upgradedCount >= REFERRAL_REWARDS.PRO_LIFETIME) {
    rewardEarned = 'PRO_LIFETIME';
  } else if (upgradedCount >= REFERRAL_REWARDS.PRO_6_MONTHS) {
    rewardEarned = 'PRO_6_MONTHS';
  }

  if (rewardEarned) {
    // Mark all unredeemed upgraded referrals so we don't double-count
    await prisma.referral.updateMany({
      where: {
        referrerUserId: r.referrerUserId,
        status: 'upgraded',
        rewardGranted: false,
      },
      data: { rewardGranted: true },
    });
    // The actual subscription extension is granted by a separate process
    // (admin or webhook follow-up) — we just signal here.
    log.info('referral reward earned', { referrerId: r.referrerUserId, rewardEarned });
  }

  return { referrerId: r.referrerUserId, rewardEarned };
}

/**
 * Stats for the referrer-facing UI.
 */
export async function getReferralStats(userId: string) {
  const [signedUp, upgraded, code] = await Promise.all([
    prisma.referral.count({ where: { referrerUserId: userId, status: { in: ['signed_up', 'upgraded'] } } }),
    prisma.referral.count({ where: { referrerUserId: userId, status: 'upgraded' } }),
    prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } }),
  ]);

  const upgradesNeededFor6mo = Math.max(0, REFERRAL_REWARDS.PRO_6_MONTHS - upgraded);
  const upgradesNeededForLife = Math.max(0, REFERRAL_REWARDS.PRO_LIFETIME - upgraded);

  return {
    code: code?.referralCode ?? null,
    totalSignups: signedUp,
    upgrades: upgraded,
    upgradesNeededFor6mo,
    upgradesNeededForLife,
  };
}

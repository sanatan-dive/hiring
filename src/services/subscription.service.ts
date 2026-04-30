import prisma from '@/lib/db/prisma';
import { dodo } from '@/lib/payments/dodo';
import { log } from '@/lib/log';

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    currency: 'USD',
    features: ['Weekly Digest', '3 Scrapes/Week', '1 Resume'],
  },
  PRO: {
    name: 'Pro',
    price: 9, // $9/mo (price actually set on the Dodo Product, this is for display)
    currency: 'USD',
    features: [
      'Daily Digest',
      'Unlimited Scrapes',
      '3 Resumes',
      'AI Cover Letter',
      'AI Interview Prep',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/**
 * Create a Dodo Payments hosted checkout session for the Pro subscription.
 * Returns a URL to redirect the user to.
 */
export async function createProCheckoutSession(params: {
  userId: string;
  email: string;
  name?: string | null;
  returnUrl: string;
}) {
  if (!dodo) throw new Error('Dodo Payments not initialized');
  if (!process.env.DODO_PRO_PRODUCT_ID) {
    throw new Error('DODO_PRO_PRODUCT_ID is not set');
  }

  const session = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: process.env.DODO_PRO_PRODUCT_ID, quantity: 1 }],
    customer: {
      email: params.email,
      name: params.name ?? params.email.split('@')[0],
    },
    return_url: params.returnUrl,
    metadata: {
      user_id: params.userId,
      plan: 'PRO',
    },
  });

  return {
    sessionId: session.session_id,
    checkoutUrl: session.checkout_url,
  };
}

/**
 * Cancel a Dodo subscription at the end of the current billing period.
 */
export async function cancelSubscription(userId: string, reason?: string) {
  if (!dodo) throw new Error('Dodo Payments not initialized');

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.dodoSubscriptionId) {
    throw new Error('No active subscription to cancel');
  }

  await dodo.subscriptions.update(sub.dodoSubscriptionId, {
    cancel_at_next_billing_date: true,
    ...(reason ? { metadata: { cancellation_reason: reason } } : {}),
  });

  // The webhook will fire `subscription.cancelled` and update the DB.
  // We optimistically reflect the user-facing flag here.
  return prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  });
}

/**
 * Resume a previously-cancelled subscription that hasn't yet expired.
 */
export async function resumeSubscription(userId: string) {
  if (!dodo) throw new Error('Dodo Payments not initialized');

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.dodoSubscriptionId) {
    throw new Error('No subscription found');
  }

  await dodo.subscriptions.update(sub.dodoSubscriptionId, {
    cancel_at_next_billing_date: false,
  });

  return prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: false },
  });
}

export type ProGateResult =
  | { ok: true }
  | { ok: false; reason: 'free' | 'expired' | 'cancelled' | 'not_found' };

/**
 * Centralized Pro feature gate. Use in API routes:
 *
 *   const gate = await requirePro(userId);
 *   if (!gate.ok) return NextResponse.json({ error: 'Upgrade to Pro' }, { status: 403 });
 *
 * Accepts either the Clerk ID (as returned by `auth()`) or the internal
 * `User.id`. Resolves the user, inspects their subscription, and returns
 * `{ ok: true }` only when plan === 'PRO' and status is 'active' or 'trialing'.
 *
 * Never throws — on missing user returns `{ ok: false, reason: 'not_found' }`.
 * Logs `pro_gate_blocked` on every denial so we can surface upgrade-interest
 * signal later (who tried what).
 */
export async function requirePro(userId: string): Promise<ProGateResult> {
  const user = await prisma.user.findFirst({
    where: { OR: [{ clerkId: userId }, { id: userId }] },
    include: { subscription: true },
  });

  if (!user) {
    log.info('pro_gate_blocked', { userId, reason: 'not_found' });
    return { ok: false, reason: 'not_found' };
  }

  const sub = user.subscription;
  const plan = sub?.plan;
  const status = sub?.status;

  if (plan === 'PRO' && (status === 'active' || status === 'trialing')) {
    return { ok: true };
  }

  let reason: 'free' | 'expired' | 'cancelled';
  if (plan !== 'PRO') {
    reason = 'free';
  } else if (status === 'cancelled') {
    reason = 'cancelled';
  } else {
    // PRO plan but not active/trialing/cancelled → expired, on_hold, inactive, pending
    reason = 'expired';
  }

  log.info('pro_gate_blocked', { userId, reason });
  return { ok: false, reason };
}

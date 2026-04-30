import prisma from '@/lib/db/prisma';
import { dodo } from '@/lib/payments/dodo';

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

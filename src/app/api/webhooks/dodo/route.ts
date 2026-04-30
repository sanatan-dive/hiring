import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';

/**
 * Dodo Payments webhook handler.
 *
 * Dodo signs webhooks using the Standard Webhooks spec (the same scheme as
 * Svix). The signing key is provided via DODO_PAYMENTS_WEBHOOK_KEY.
 *
 * Headers we expect:
 *   webhook-id        — unique event id (for idempotency)
 *   webhook-signature — HMAC-SHA256 signature
 *   webhook-timestamp — unix timestamp
 */

const SUBSCRIPTION_EVENTS = [
  'subscription.active',
  'subscription.on_hold',
  'subscription.cancelled',
  'subscription.expired',
  'subscription.failed',
  'subscription.renewed',
  'subscription.plan_changed',
] as const;

const PAYMENT_EVENTS = ['payment.succeeded', 'payment.failed'] as const;

export async function POST(req: NextRequest) {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!secret) {
    console.error('[dodo-webhook] DODO_PAYMENTS_WEBHOOK_KEY not set');
    return new NextResponse('webhook not configured', { status: 500 });
  }

  const rawBody = await req.text();
  const headers = {
    'webhook-id': req.headers.get('webhook-id') ?? '',
    'webhook-signature': req.headers.get('webhook-signature') ?? '',
    'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
  };

  // Verify signature
  type DodoWebhookPayload = {
    type?: string;
    event_type?: string;
    data?: Record<string, unknown>;
  } & Record<string, unknown>;

  let payload: DodoWebhookPayload;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(rawBody, headers) as DodoWebhookPayload;
  } catch (err) {
    console.error('[dodo-webhook] signature verification failed', err);
    return new NextResponse('invalid signature', { status: 400 });
  }

  const webhookId = headers['webhook-id'];
  const eventType: string = payload?.type ?? payload?.event_type ?? 'unknown';
  const data = (payload?.data ?? payload) as DodoSubscriptionEntity & Record<string, unknown>;

  // Idempotency: skip if already processed
  const existing = await prisma.subscriptionEvent.findUnique({
    where: { webhookId },
  });
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Resolve userId from metadata
  const metadata = (data?.metadata as Record<string, string> | undefined) ?? {};
  const userId: string | undefined = metadata.user_id;

  await prisma.subscriptionEvent.create({
    data: {
      webhookId,
      userId,
      eventType,
      payload: payload as unknown as Prisma.InputJsonValue,
    },
  });

  if (!userId) {
    return NextResponse.json({ ok: true, ignored: 'no user_id in metadata' });
  }

  try {
    await applyEvent({ eventType, data, userId });
  } catch (err) {
    console.error('[dodo-webhook] processing error', err);
    return new NextResponse('processing error', { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

type DodoSubscriptionEntity = {
  subscription_id?: string;
  id?: string;
  customer?: { customer_id?: string };
  customer_id?: string;
  product_id?: string;
  product_cart?: Array<{ product_id?: string }>;
  next_billing_date?: string;
  current_period_end?: string;
};

async function applyEvent(args: {
  eventType: string;
  data: DodoSubscriptionEntity & Record<string, unknown>;
  userId: string;
}) {
  const { eventType, data, userId } = args;

  // Subscription events carry a subscription object
  if (SUBSCRIPTION_EVENTS.includes(eventType as (typeof SUBSCRIPTION_EVENTS)[number])) {
    const subscriptionId = (data.subscription_id ?? data.id) as string;
    const customerId = data.customer?.customer_id ?? data.customer_id;
    const productId = data.product_id ?? data.product_cart?.[0]?.product_id;
    const nextBillingDate = data.next_billing_date ?? data.current_period_end;

    const baseUpdate = {
      dodoSubscriptionId: subscriptionId,
      dodoCustomerId: customerId,
      dodoProductId: productId,
      currentPeriodEnd: nextBillingDate ? new Date(nextBillingDate) : undefined,
    };

    switch (eventType) {
      case 'subscription.active':
      case 'subscription.renewed':
        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan: 'PRO',
            status: 'active',
            cancelAtPeriodEnd: false,
            ...baseUpdate,
          },
          update: {
            plan: 'PRO',
            status: 'active',
            cancelAtPeriodEnd: false,
            ...baseUpdate,
          },
        });
        break;

      case 'subscription.cancelled':
        await prisma.subscription.update({
          where: { userId },
          data: {
            status: 'cancelled',
            cancelAtPeriodEnd: true,
            ...baseUpdate,
          },
        });
        break;

      case 'subscription.on_hold':
        await prisma.subscription.update({
          where: { userId },
          data: { status: 'on_hold', ...baseUpdate },
        });
        break;

      case 'subscription.expired':
      case 'subscription.failed':
        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: 'FREE',
            status: eventType === 'subscription.failed' ? 'inactive' : 'expired',
            cancelAtPeriodEnd: false,
          },
        });
        break;

      case 'subscription.plan_changed':
        await prisma.subscription.update({
          where: { userId },
          data: { ...baseUpdate },
        });
        break;
    }
    return;
  }

  // Payment events — only used for logging right now.
  if (PAYMENT_EVENTS.includes(eventType as (typeof PAYMENT_EVENTS)[number])) {
    if (eventType === 'payment.failed') {
      // TODO: send "payment failed, update card" email; do NOT downgrade yet
    }
  }
}

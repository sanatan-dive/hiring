# Payment Integration — Razorpay (Subscriptions, Not Orders)

---

## Why Razorpay

| Factor                   | Razorpay             | Lemon Squeezy | Paddle     | Dodo Payments | Stripe                 |
| ------------------------ | -------------------- | ------------- | ---------- | ------------- | ---------------------- |
| Works in India (founder) | ✅                   | ⚠️            | ⚠️         | ✅            | ❌ (need US/EU entity) |
| International payments   | ✅ (100+ currencies) | ✅            | ✅         | ✅            | ✅                     |
| Domestic fee             | 2% + GST             | N/A           | N/A        | N/A           | N/A                    |
| International fee        | 3% + GST             | 5-7%          | 5% + $0.50 | 4% + $0.40    | 2.9% + $0.30           |
| Native subscription API  | ✅                   | ✅            | ✅         | ✅            | ✅                     |
| MoR (handles tax)        | ❌ (you handle)      | ✅            | ✅         | ✅            | ❌                     |
| Time to integrate        | 2-3 days             | 1-2 days      | 3-5 days   | 1-2 days      | 1-2 days               |

**Decision:** Stick with Razorpay (already in code). Migrate from one-shot orders to **Subscriptions API**.

**Backup option:** If you ever hit ₹20L+ revenue and tax compliance becomes painful, migrate to Dodo Payments or Lemon Squeezy as MoR.

---

## CRITICAL: You Are Currently Using Orders, Not Subscriptions

**The problem:** `src/app/api/payments/create-order/route.ts` calls Razorpay's `/v1/orders/` endpoint. This is a **one-shot payment**. The user pays once, gets PRO marked active until `expiresAt`, and is never charged again.

**You need:** `/v1/subscriptions/`. This creates a recurring authorization that auto-charges on a schedule.

---

## Setup Steps

### 1. Razorpay Dashboard

1. Sign up → complete KYC (1-2 business days)
2. Settings → Subscriptions → Enable
3. Settings → Webhooks → register `https://hirin.app/api/webhooks/razorpay` with secret
4. Settings → International Payments → Enable

### 2. Create Subscription Plans (via Dashboard or API)

```bash
# Pro Monthly INR
curl -X POST https://api.razorpay.com/v1/plans \
  -u $RAZORPAY_KEY_ID:$RAZORPAY_KEY_SECRET \
  -H "Content-Type: application/json" \
  -d '{
    "period": "monthly",
    "interval": 1,
    "item": {
      "name": "Hirin Pro (Monthly)",
      "amount": 69900,
      "currency": "INR",
      "description": "Daily job digest, AI cover letter, unlimited tracking"
    }
  }'

# Pro Monthly USD
curl -X POST https://api.razorpay.com/v1/plans \
  -u $RAZORPAY_KEY_ID:$RAZORPAY_KEY_SECRET \
  -H "Content-Type: application/json" \
  -d '{
    "period": "monthly",
    "interval": 1,
    "item": {
      "name": "Hirin Pro (Monthly)",
      "amount": 900,
      "currency": "USD",
      "description": "Daily job digest, AI cover letter, unlimited tracking"
    }
  }'

# Pro Annual (20% discount)
# INR: 86400 paise/month * 12 = 1036800; total = 671040
# USD: 720 cents/month * 12 = 8640
```

Save the returned `plan_id` values to env vars: `RAZORPAY_PRO_PLAN_INR`, `RAZORPAY_PRO_PLAN_USD`, etc.

**Note:** Razorpay amounts are in the smallest currency unit. ₹699 = 69900 paise. $9 = 900 cents.

---

### 3. Database Schema

Update `prisma/schema.prisma` (replaces existing Subscription):

```prisma
enum Plan {
  FREE
  PRO
  PRO_PLUS
}

enum SubscriptionStatus {
  inactive
  authenticated
  active
  pending
  halted
  cancelled
  completed
  expired
}

model Subscription {
  id        String   @id @default(uuid())
  userId    String   @unique
  plan      Plan     @default(FREE)
  status    SubscriptionStatus @default(inactive)

  razorpaySubscriptionId String?  @unique @map("razorpay_subscription_id")
  razorpayCustomerId     String?  @unique @map("razorpay_customer_id")
  razorpayPlanId         String?  @map("razorpay_plan_id")
  currentPeriodEnd       DateTime? @map("current_period_end")
  cancelAtPeriodEnd      Boolean   @default(false) @map("cancel_at_period_end")
  pausedAt               DateTime? @map("paused_at")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

model SubscriptionEvent {
  id              String   @id @default(uuid())
  razorpayEventId String   @unique @map("razorpay_event_id")
  userId          String?  @map("user_id")
  eventType       String   @map("event_type")
  payload         Json
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@map("subscription_events")
}
```

Drop the unused `stripeCustomerId` field. Run:

```bash
npx prisma migrate dev --name razorpay_subscriptions
```

---

### 4. Backend — Create Subscription Endpoint

Replace `src/app/api/payments/create-order/route.ts` with `src/app/api/payments/create-subscription/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/db/prisma';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { plan, currency } = await req.json(); // 'PRO', 'INR'|'USD'

  const planIdMap: Record<string, string> = {
    PRO_INR: process.env.RAZORPAY_PRO_PLAN_INR!,
    PRO_USD: process.env.RAZORPAY_PRO_PLAN_USD!,
  };
  const planId = planIdMap[`${plan}_${currency}`];
  if (!planId) return NextResponse.json({ error: 'invalid plan' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'user not synced' }, { status: 404 });

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: 120, // 10 years of monthly billing
    quantity: 1,
    customer_notify: 1,
    notes: {
      user_id: user.id,
      email: user.email,
      plan,
    },
  });

  // Persist pending state
  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: 'FREE', // not active yet — wait for webhook
      status: 'pending',
      razorpaySubscriptionId: subscription.id,
      razorpayPlanId: planId,
    },
    update: {
      status: 'pending',
      razorpaySubscriptionId: subscription.id,
      razorpayPlanId: planId,
    },
  });

  return NextResponse.json({
    subscription_id: subscription.id,
    short_url: subscription.short_url,
    razorpay_key_id: process.env.RAZORPAY_KEY_ID,
  });
}
```

---

### 5. Backend — Webhook Handler

Create `src/app/api/webhooks/razorpay/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('x-razorpay-signature') ?? '';

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return new NextResponse('invalid signature', { status: 400 });
  }

  const payload = JSON.parse(body);
  const eventId = payload.id;
  const event = payload.event;

  // Idempotency
  const existing = await prisma.subscriptionEvent.findUnique({
    where: { razorpayEventId: eventId },
  });
  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  await prisma.subscriptionEvent.create({
    data: { razorpayEventId: eventId, eventType: event, payload },
  });

  const sub = payload.payload?.subscription?.entity;
  const userId = sub?.notes?.user_id;
  if (!userId) return NextResponse.json({ ok: true, ignored: true });

  switch (event) {
    case 'subscription.activated':
    case 'subscription.charged':
      await prisma.subscription.update({
        where: { userId },
        data: {
          plan: 'PRO',
          status: 'active',
          currentPeriodEnd: new Date(sub.current_end * 1000),
          razorpayCustomerId: sub.customer_id,
        },
      });
      break;

    case 'subscription.cancelled':
      await prisma.subscription.update({
        where: { userId },
        data: { status: 'cancelled', cancelAtPeriodEnd: true },
      });
      break;

    case 'subscription.completed':
    case 'subscription.expired':
      await prisma.subscription.update({
        where: { userId },
        data: { plan: 'FREE', status: 'expired' },
      });
      break;

    case 'subscription.paused':
      await prisma.subscription.update({
        where: { userId },
        data: { status: 'halted', pausedAt: new Date() },
      });
      break;

    case 'subscription.resumed':
      await prisma.subscription.update({
        where: { userId },
        data: { status: 'active', pausedAt: null },
      });
      break;

    case 'payment.failed':
      // Don't change plan immediately — give grace period until expiresAt
      // Send email "Payment failed, please update payment method"
      break;
  }

  return NextResponse.json({ ok: true });
}
```

---

### 6. Frontend — Razorpay Checkout

Update `src/components/Hero/Pricing.tsx` (the new pricing component already in your repo):

```tsx
'use client';
import { useEffect } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function UpgradeButton({ plan, currency }: { plan: 'PRO'; currency: 'INR' | 'USD' }) {
  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
    return () => {
      document.body.removeChild(s);
    };
  }, []);

  const handleClick = async () => {
    const res = await fetch('/api/payments/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, currency }),
    });
    const { subscription_id, razorpay_key_id } = await res.json();

    const rzp = new window.Razorpay({
      key: razorpay_key_id,
      subscription_id,
      name: 'Hirin',
      description: `${plan} subscription`,
      handler: () => {
        // Webhook will activate the subscription
        // Show optimistic "Activating..." state
        window.location.href = '/matches?upgraded=1';
      },
      prefill: { email: '...' /* from Clerk */ },
      theme: { color: '#000000' },
    });
    rzp.open();
  };

  return <button onClick={handleClick}>Upgrade to Pro</button>;
}
```

Important: **Don't trust the checkout `handler` callback for plan activation.** Always wait for the webhook. The handler can show "Activating, please wait..." while the webhook fires.

---

### 7. Cancel / Manage Subscription

Add `src/app/api/payments/cancel/route.ts`:

```ts
import Razorpay from 'razorpay';
const razorpay = new Razorpay({
  /* ... */
});

export async function POST() {
  const { userId } = auth();
  // ... fetch user's razorpaySubscriptionId ...
  await razorpay.subscriptions.cancel(razorpaySubscriptionId, true /* cancel_at_cycle_end */);
  // Webhook will fire `subscription.cancelled` → updates DB
  return NextResponse.json({ ok: true });
}
```

Add a "Manage subscription" button on `/profile` page.

---

### 8. Environment Variables

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx              # SEPARATE from key_secret

# Plan IDs
RAZORPAY_PRO_PLAN_INR=plan_xxxxx
RAZORPAY_PRO_PLAN_USD=plan_xxxxx
RAZORPAY_PRO_ANNUAL_INR=plan_xxxxx
RAZORPAY_PRO_ANNUAL_USD=plan_xxxxx
```

---

### 9. Webhook Events to Subscribe To

In Razorpay Dashboard → Webhooks → Events:

- `subscription.activated`
- `subscription.charged`
- `subscription.cancelled`
- `subscription.paused`
- `subscription.resumed`
- `subscription.completed`
- `subscription.expired`
- `payment.failed`
- `payment.captured` (informational)

---

## Testing

### Test Mode

Use `rzp_test_` keys during development. Razorpay provides a sandbox where webhooks fire on simulated events.

### Test Cards

- Success: `4111 1111 1111 1111` (any future expiry, any CVV)
- Failure: `4111 1111 1111 1112`
- International: `4000 0035 6000 0008`

### Local Webhook Testing

```bash
ngrok http 3000
# Register ngrok URL as webhook in Razorpay test dashboard
# Set RAZORPAY_WEBHOOK_SECRET to match
```

### What to Verify Manually

1. ✅ Subscribe → webhook fires → `Subscription.plan = PRO`, `status = active`, `currentPeriodEnd` set
2. ✅ Replay webhook → `SubscriptionEvent` table prevents double-processing (idempotency)
3. ✅ Cancel → `status = cancelled`, `cancelAtPeriodEnd = true`, plan still PRO until `currentPeriodEnd`
4. ✅ After period end → `subscription.completed` event → `plan = FREE`
5. ✅ Failed renewal → `payment.failed` event → user gets email but stays PRO until grace period ends
6. ✅ Tampered signature → webhook returns 400

---

## Migration from Existing One-Shot Orders

If anyone has paid via the current `/api/payments/create-order` flow:

1. Pull list of users with `Subscription.plan = 'PRO'` and `razorpayId != null`
2. Email them: "We're upgrading our billing to recurring. Click here to set up auto-renewal" with a link to the new subscription flow
3. After 30 days, downgrade anyone who didn't migrate (their `expiresAt` will have passed anyway)
4. Drop the old `/api/payments/create-order` route

---

## Common Pitfalls

| Pitfall                                                          | Fix                                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Activating user inside `handler` callback (frontend)             | Always wait for webhook. Frontend handler is unreliable (network drop, tab close).                           |
| Reusing `RAZORPAY_KEY_SECRET` for webhook HMAC                   | Webhook needs `RAZORPAY_WEBHOOK_SECRET` (separate).                                                          |
| Not handling `subscription.charged` (recurring)                  | First webhook is `activated`, subsequent monthly charges are `charged`. Both must extend `currentPeriodEnd`. |
| Trusting webhook order (Razorpay can deliver out of order)       | Always check `payload.created_at` and only update if newer than DB state.                                    |
| Forgetting timezone — `current_end` is UTC seconds               | Multiply by 1000 for JS Date.                                                                                |
| Using `subscription_id` from `/orders/` (orders ≠ subscriptions) | Different APIs entirely. Use `/subscriptions/`.                                                              |

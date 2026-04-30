# Payment Integration — Dodo Payments (Hosted Checkout + Webhook Source of Truth)

This is the **strategic** payment doc. For the operational walkthrough (dashboard setup, env vars, end-to-end smoke test, troubleshooting), see [DODO_INTEGRATION_GUIDE.md](../DODO_INTEGRATION_GUIDE.md). The two are paired.

---

## Why Dodo Payments

| Factor                       | Dodo Payments              | Razorpay              | Lemon Squeezy | Paddle     | Stripe                 |
| ---------------------------- | -------------------------- | --------------------- | ------------- | ---------- | ---------------------- |
| Works for Indian founder     | ✅                         | ✅                    | ⚠️            | ⚠️         | ❌ (need US/EU entity) |
| Sells globally               | ✅ (180+ countries)        | ✅ (100+ currencies)  | ✅            | ✅         | ✅                     |
| Merchant of Record (MoR)     | ✅ (handles all tax)       | ❌ (you handle GST/VAT) | ✅          | ✅         | ❌                     |
| Native subscription product  | ✅                         | ✅                    | ✅            | ✅         | ✅                     |
| Pricing                      | 4% + $0.40 (tax included)  | 2% + GST domestic / 3% + GST intl | 5-7% | 5% + $0.50 | 2.9% + $0.30 |
| Hosted checkout              | ✅ (redirect, no JS modal) | ✅ (modal)            | ✅            | ✅         | ✅                     |
| Adaptive (local) pricing     | ✅                         | Manual (multi-product) | Limited     | ✅         | Manual                 |
| Time to integrate            | 1-2 days                   | 2-3 days              | 1-2 days      | 3-5 days   | 1-2 days               |

**Decision:** Dodo Payments. The MoR model means you don't have to register for GST/EU VAT/US sales tax — Dodo collects and remits on your behalf. The fee is higher (~4% vs Razorpay's 2-3%) but you get back the time you'd otherwise spend on tax compliance.

**Backup:** If Dodo's MoR fee becomes the bottleneck at scale (e.g., $10K+ MRR where 1% = real money), the next-cleanest swap is Lemon Squeezy or Paddle — both also MoR with similar webhook contracts.

---

## Architecture: The Webhook Is the Source of Truth

Dodo runs a hosted checkout. The user is redirected to `https://test.checkout.dodopayments.com/...` (or the live equivalent), pays, and is redirected back to your `return_url`. **Plan activation does NOT happen on the redirect.** It happens when Dodo POSTs `subscription.active` to your webhook endpoint.

```
1. User clicks "Upgrade Pro" on /pricing
   ↓
2. Frontend POSTs to /api/payments/create-checkout
   ↓
3. Server calls dodo.checkoutSessions.create({
     product_cart: [{ product_id: DODO_PRO_PRODUCT_ID, quantity: 1 }],
     customer: { email, name },
     metadata: { user_id, plan: 'PRO' },        // <-- echoed back in webhook
     return_url: NEXT_PUBLIC_APP_URL/matches?upgraded=1,
   })
   ↓
4. Server upserts Subscription with status='pending'
   ↓
5. Server returns { checkoutUrl } to the browser
   ↓
6. Browser redirects to Dodo's hosted page
   ↓
7. User pays
   ↓
8. Dodo redirects user back to /matches?upgraded=1   (UX only — NOT the source of truth)
   ↓
9. (Async, within seconds) Dodo POSTs subscription.active to /api/webhooks/dodo
   ↓
10. Webhook handler:
    - verifies the Standard Webhooks signature
    - checks idempotency via the `webhook-id` header
    - extracts metadata.user_id
    - updates Subscription: plan=PRO, status=active, currentPeriodEnd, dodoCustomerId
   ↓
11. Next page load shows the user as PRO
```

**Why this matters:** if the user closes the tab between paying and the redirect, the webhook still fires and they still get PRO. There is no "verify on redirect" failure mode.

---

## Setup Steps

### 1. Dodo Dashboard

1. Sign up at **https://app.dodopayments.com** — no KYC required for test mode
2. Toggle **Test Mode** in the dashboard top-right
3. Submit business verification when ready for live mode (1-3 business days)

### 2. Create the Pro Product

Dashboard → **Products** → **Create Product**:

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Name          | Hirin Pro                                                                  |
| Type          | **Subscription**                                                           |
| Description   | Daily job digest, AI cover letter, AI interview prep, unlimited tracking   |
| Price         | $9.00 USD (enable Adaptive Pricing for auto-INR/local currency localization) |
| Billing cycle | Monthly                                                                    |
| Tax behavior  | Inclusive (Dodo handles tax as MoR)                                        |
| Trial period  | (optional) 0 or 7 days                                                     |

Save. Copy the **Product ID** (`prod_xxxxx`) → `DODO_PRO_PRODUCT_ID`.

If you want a separate INR-denominated product instead of Adaptive Pricing, create a second product priced in INR (e.g., ₹699/mo) and route Indian users to that product id from your code (geolocate via `x-vercel-ip-country`).

### 3. Get Your API Key

Dashboard → **Developer** → **API Keys** → **Create Secret Key**.

- Test key prefix: `sk_test_...`
- Live key prefix: `sk_live_...`

Copy both. Set as `DODO_PAYMENTS_API_KEY` in the appropriate environment.

### 4. Register the Webhook Endpoint

Dashboard → **Developer** → **Webhooks** → **Add Endpoint**:

| Field   | Value                                                                                                                                                                                                                                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URL     | `https://hirin.app/api/webhooks/dodo` (production) or your ngrok URL (dev)                                                                                                                                                                              |
| Events  | Select all of:<br>`subscription.active`<br>`subscription.on_hold`<br>`subscription.cancelled`<br>`subscription.expired`<br>`subscription.failed`<br>`subscription.renewed`<br>`subscription.plan_changed`<br>`payment.succeeded`<br>`payment.failed`     |

After saving, click **Reveal Signing Secret** (`whsec_...`) and set it as `DODO_PAYMENTS_WEBHOOK_KEY`. **Test-mode and live-mode endpoints have separate secrets** — don't mix them up.

---

## Database Schema

`prisma/schema.prisma` (already migrated):

```prisma
enum Plan {
  FREE
  PRO
  PRO_PLUS
}

enum SubscriptionStatus {
  inactive
  pending
  active
  cancelled
  expired
  on_hold       // Dodo's payment-retry phase
}

model Subscription {
  id                 String             @id @default(uuid())
  userId             String             @unique
  plan               Plan               @default(FREE)
  status             SubscriptionStatus @default(inactive)

  dodoSubscriptionId String?            @unique @map("dodo_subscription_id")
  dodoCustomerId     String?            @unique @map("dodo_customer_id")
  dodoProductId      String?            @map("dodo_product_id")
  currentPeriodEnd   DateTime?          @map("current_period_end")
  cancelAtPeriodEnd  Boolean            @default(false) @map("cancel_at_period_end")

  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

model SubscriptionEvent {
  id          String   @id @default(uuid())
  webhookId   String   @unique @map("webhook_id")   // Dodo's `webhook-id` header — idempotency key
  userId      String?  @map("user_id")
  eventType   String   @map("event_type")
  payload     Json
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@map("subscription_events")
}
```

Run: `npx prisma migrate dev --name dodo_payments`

---

## Backend — Create Checkout Endpoint

`src/app/api/payments/create-checkout/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { ratelimit } from '@/lib/ratelimit';
import { createProCheckoutSession } from '@/services/subscription.service';

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { success } = await ratelimit.payments.limit(`pay:${userId}`);
  if (!success) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'user not synced' }, { status: 404 });

  const { checkoutUrl, dodoSubscriptionId } = await createProCheckoutSession({
    userId: user.id,
    email: user.email,
    name: user.name ?? undefined,
  });

  // Persist a pending subscription so we can correlate the webhook
  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: 'FREE', // not active until webhook fires
      status: 'pending',
      dodoSubscriptionId,
      dodoProductId: process.env.DODO_PRO_PRODUCT_ID,
    },
    update: {
      status: 'pending',
      dodoSubscriptionId,
      dodoProductId: process.env.DODO_PRO_PRODUCT_ID,
    },
  });

  return NextResponse.json({ checkoutUrl });
}
```

The `createProCheckoutSession` helper lives in `src/services/subscription.service.ts` and wraps `dodo.checkoutSessions.create({...})` with:

- `product_cart: [{ product_id: DODO_PRO_PRODUCT_ID, quantity: 1 }]`
- `customer: { email, name }`
- `metadata: { user_id, plan: 'PRO' }` ← critical: the webhook reads this back
- `return_url: ${NEXT_PUBLIC_APP_URL}/matches?upgraded=1`

---

## Backend — Webhook Handler

`src/app/api/webhooks/dodo/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { prisma } from '@/lib/db/prisma';
import { config } from '@/config';
import * as Sentry from '@sentry/nextjs';

const wh = new Webhook(config.dodo.webhookKey);

export async function POST(req: NextRequest) {
  const body = await req.text();           // RAW body — do not JSON.parse first
  const headers = {
    'webhook-id': req.headers.get('webhook-id') ?? '',
    'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
    'webhook-signature': req.headers.get('webhook-signature') ?? '',
  };

  try {
    await wh.verify(body, headers);
  } catch {
    return new NextResponse('invalid signature', { status: 400 });
  }

  const webhookId = headers['webhook-id'];
  const payload = JSON.parse(body);
  const event: string = payload.type;
  const data = payload.data ?? {};
  const userId: string | undefined = data.metadata?.user_id;
  const sub = data.subscription ?? data;

  // Idempotency
  const existing = await prisma.subscriptionEvent.findUnique({ where: { webhookId } });
  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  await prisma.subscriptionEvent.create({
    data: { webhookId, userId, eventType: event, payload },
  });

  if (!userId) return NextResponse.json({ ok: true, ignored: true });

  try {
    switch (event) {
      case 'subscription.active':
      case 'subscription.renewed':
        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: 'PRO',
            status: 'active',
            currentPeriodEnd: sub.next_billing_date ? new Date(sub.next_billing_date) : undefined,
            dodoCustomerId: sub.customer_id ?? undefined,
            cancelAtPeriodEnd: false,
          },
        });
        break;

      case 'subscription.cancelled':
        await prisma.subscription.update({
          where: { userId },
          data: { status: 'cancelled', cancelAtPeriodEnd: true },
        });
        break;

      case 'subscription.expired':
        await prisma.subscription.update({
          where: { userId },
          data: { plan: 'FREE', status: 'expired' },
        });
        break;

      case 'subscription.on_hold':
        await prisma.subscription.update({
          where: { userId },
          data: { status: 'on_hold' },
        });
        break;

      case 'subscription.failed':
        await prisma.subscription.update({
          where: { userId },
          data: { status: 'inactive' },
        });
        break;

      case 'payment.failed':
        // Don't downgrade — Dodo retries automatically. Log for visibility.
        break;
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { event, userId } });
    return new NextResponse('processing error', { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

**Critical:** verify against the **raw** body. If you `JSON.parse` first and re-serialize, the signature will not match (whitespace, key order).

---

## Frontend — Pricing Card

There is no JS modal to load. Dodo is a redirect-style hosted checkout, so the client does:

```tsx
async function upgrade() {
  const res = await fetch('/api/payments/create-checkout', { method: 'POST' });
  const { checkoutUrl } = await res.json();
  window.location.href = checkoutUrl;
}
```

After payment, Dodo redirects the user back to `${NEXT_PUBLIC_APP_URL}/matches?upgraded=1`. The page can show an optimistic "Activating..." state — within a couple of seconds the webhook will have fired and a refetch shows `plan === 'PRO'`.

---

## Cancel / Manage Subscription

`src/app/api/payments/cancel/route.ts` calls `cancelSubscription(dodoSubscriptionId)` from the service layer, which updates the Dodo subscription with `cancel_at_period_end: true` (or `cancel_at_next_billing_date`, depending on Dodo's API). The webhook then fires `subscription.cancelled`, which sets `cancelAtPeriodEnd=true` and keeps the user on PRO until `currentPeriodEnd`. After that date passes, Dodo fires `subscription.expired` and the user is downgraded to FREE.

Add a "Manage subscription" section to `/profile` showing:

- Current plan + renew/cancel date
- "Cancel subscription" button (or "Resume" if `cancelAtPeriodEnd=true`)

---

## Environment Variables

```env
# Required
DODO_PAYMENTS_API_KEY=sk_test_xxxxxxxxxxxx       # sk_live_... in production
DODO_PAYMENTS_WEBHOOK_KEY=whsec_xxxxxxxxxxxx     # different secret per endpoint
DODO_PAYMENTS_ENV=test_mode                      # or "live_mode"
DODO_PRO_PRODUCT_ID=prod_xxxxxxxxxxxx

# Already in your env (used by checkout return_url)
NEXT_PUBLIC_APP_URL=http://localhost:3000        # or https://hirin.app
```

These are exposed in `src/config/index.ts` as `config.dodo.{apiKey, webhookKey, environment, proProductId}`.

---

## Webhook Events to Subscribe To

Register all of these in the Dodo dashboard for both test and live endpoints:

- `subscription.active` — first activation after payment
- `subscription.renewed` — recurring monthly charge succeeded
- `subscription.cancelled` — user (or you) cancelled; period continues until `currentPeriodEnd`
- `subscription.expired` — final downgrade to FREE
- `subscription.on_hold` — Dodo is retrying a failed payment (grace period)
- `subscription.failed` — initial activation failed (rare)
- `subscription.plan_changed` — for future Pro+ upgrade flow
- `payment.succeeded` — informational
- `payment.failed` — informational; do NOT downgrade on this alone

---

## Testing

### Test Mode

`DODO_PAYMENTS_ENV=test_mode` + `sk_test_...` API key + a test-mode webhook endpoint.

### Test Cards

| Scenario           | Card                  |
| ------------------ | --------------------- |
| Successful payment | `4242 4242 4242 4242` |
| Card declined      | `4000 0000 0000 0002` |
| 3-D Secure         | `4000 0027 6000 3184` |

Any future expiry, any CVV.

### Local Webhook Testing

```bash
ngrok http 3000
# Register the ngrok https URL as a SECOND webhook endpoint in Dodo (it has its own signing secret)
# Set DODO_PAYMENTS_WEBHOOK_KEY in .env.local to that endpoint's whsec_
```

### What to Verify Manually

1. Subscribe → webhook fires → `Subscription.plan = PRO`, `status = active`, `currentPeriodEnd` set
2. Replay the webhook (Dodo dashboard → Resend) → handler returns `{ ok: true, duplicate: true }`, no DB change
3. Cancel → `status = cancelled`, `cancelAtPeriodEnd = true`, plan still PRO until period end
4. After period end → `subscription.expired` event → `plan = FREE`
5. Failed renewal → `subscription.on_hold` (Dodo retries); user keeps PRO during grace period
6. Tampered `webhook-signature` header → 400, no DB write

---

## Common Pitfalls

| Pitfall                                                              | Fix                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Activating user inside the redirect handler instead of the webhook   | The webhook is the source of truth. The redirect-back is UX only.                                            |
| Using the API key as the webhook secret                              | Webhook needs `DODO_PAYMENTS_WEBHOOK_KEY` (the `whsec_...` from the endpoint). API key is `sk_...`.          |
| `JSON.parse` before signature verify                                 | Verify against the **raw** body bytes. Re-serializing changes whitespace and breaks the HMAC.                |
| Mixing test/live keys with the wrong endpoint                        | Test endpoints have their own signing secret. Live endpoints have a different one. Don't reuse.              |
| Not setting `metadata.user_id` on checkout creation                  | The webhook needs it to know which user to update. If absent, the handler returns `{ ok: true, ignored }`.   |
| Treating `payment.failed` as a downgrade trigger                     | Don't. Dodo retries; the right downgrade signal is `subscription.expired`.                                   |
| Forgetting Adaptive Pricing                                          | Without it, an Indian user sees `$9` and may not convert. Enable on the product, or create a second INR product. |

---

## When to Revisit This

You're on Dodo for as long as:

- The 4% MoR fee is cheaper than the time/legal cost of running your own tax compliance, AND
- Dodo supports the markets you sell to

Migration paths if either changes:

- **Need lower fees at scale ($10K+ MRR):** Stripe (with US/EU entity) or Razorpay (if India-only is acceptable). You'd take on tax compliance (GST registration, EU VAT OSS, US sales-tax services like TaxJar/Stripe Tax).
- **Need a different MoR:** Lemon Squeezy or Paddle. Same hosted-checkout-plus-webhook architecture; mostly a rename of fields.

The schema (`Subscription`, `SubscriptionEvent` with a generic `webhookId` and `eventType`) is intentionally processor-agnostic — only the column names like `dodoSubscriptionId` are processor-specific. A future swap is a rename + a new webhook handler, not a re-architect.

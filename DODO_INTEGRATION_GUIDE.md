# Dodo Payments Integration Guide

Hirin' uses **Dodo Payments** as its merchant-of-record payment processor. Dodo handles tax, compliance, and global card processing — you just call their SDK.

This doc walks through:

1. What was changed in this repo
2. How to set up your Dodo account
3. Required env vars
4. Configuring the webhook endpoint
5. Local + production testing
6. The end-to-end flow
7. Troubleshooting

---

## 1. What Was Changed (Summary)

| Layer                | Before (Razorpay)                              | After (Dodo)                                                                                     |
| -------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| npm package          | `razorpay`                                     | `dodopayments` + `standardwebhooks`                                                              |
| SDK init             | `src/services/subscription.service.ts`         | `src/lib/payments/dodo.ts`                                                                       |
| Subscription service | One-shot orders + HMAC verify                  | Hosted checkout sessions + webhook-driven activation                                             |
| Create payment route | `POST /api/payments/create-order`              | `POST /api/payments/create-checkout`                                                             |
| Verify route         | `POST /api/payments/verify` (HMAC)             | **Deleted** — webhook does this now                                                              |
| Webhook handler      | None                                           | `POST /api/webhooks/dodo`                                                                        |
| Cancel route         | None                                           | `POST /api/payments/cancel`                                                                      |
| Pricing UI           | Inline Razorpay modal (`window.Razorpay(...)`) | `window.location.href = checkoutUrl` redirect to Dodo's hosted page                              |
| Schema fields        | `razorpayId`, `stripeCustomerId`               | `dodoSubscriptionId`, `dodoCustomerId`, `dodoProductId`, `currentPeriodEnd`, `cancelAtPeriodEnd` |
| Idempotency          | None                                           | `SubscriptionEvent.webhookId @unique`                                                            |
| Pricing display      | ₹800                                           | $9                                                                                               |
| Footer copy          | "secured by Razorpay"                          | "secured by Dodo Payments"                                                                       |

Files added:

```
src/lib/payments/dodo.ts                    # Singleton Dodo client
src/app/api/payments/create-checkout/route.ts
src/app/api/payments/cancel/route.ts
src/app/api/webhooks/dodo/route.ts
DODO_INTEGRATION_GUIDE.md                   # this file
```

Files removed:

```
src/app/api/payments/create-order/         # Razorpay one-shot order
src/app/api/payments/verify/               # Razorpay HMAC verify
```

Files modified:

```
package.json                                # razorpay → dodopayments + standardwebhooks
prisma/schema.prisma                        # Subscription + new SubscriptionEvent
src/config/index.ts                         # razorpay block → dodo block
src/services/subscription.service.ts        # full rewrite
src/app/pricing/page.tsx                    # checkout flow + price + copy
src/components/Hero/Pricing.tsx             # price + copy
```

---

## 2. Set Up Your Dodo Account

1. Sign up at **https://app.dodopayments.com** — no KYC required to start in test mode.
2. Switch to **Test Mode** (toggle in dashboard top-right) for development.
3. Complete business verification when you're ready for live mode (KYC takes 1-3 business days).

### 2a. Create the Pro Product

Dashboard → **Products** → **Create Product**:

| Field         | Value                                                                                   |
| ------------- | --------------------------------------------------------------------------------------- |
| Name          | Hirin Pro                                                                               |
| Type          | **Subscription**                                                                        |
| Description   | Daily job digest, AI cover letter, AI interview prep, unlimited tracking                |
| Price         | $9.00 USD (or ₹699 INR — pick your default; you can also create a separate INR product) |
| Billing cycle | Monthly                                                                                 |
| Tax behavior  | Inclusive (Dodo handles tax as MoR)                                                     |
| Trial period  | (optional) 0 or 7 days                                                                  |

After saving, copy the **Product ID** (e.g., `prod_xxxxx`). You'll set this as `DODO_PRO_PRODUCT_ID`.

### 2b. Get Your API Key

Dashboard → **Developer** → **API Keys** → **Create Secret Key**:

- Test mode key prefix: `sk_test_...`
- Live mode key prefix: `sk_live_...`

Copy both — you'll set them as `DODO_PAYMENTS_API_KEY`.

---

## 3. Environment Variables

Add to `.env.local` (and to Vercel env in production):

```env
# Required
DODO_PAYMENTS_API_KEY=sk_test_xxxxxxxxxxxx
DODO_PAYMENTS_WEBHOOK_KEY=whsec_xxxxxxxxxxxx
DODO_PAYMENTS_ENV=test_mode                  # or "live_mode"
DODO_PRO_PRODUCT_ID=prod_xxxxxxxxxxxx

# Already in your env (used by checkout return_url)
NEXT_PUBLIC_APP_URL=http://localhost:3000    # or https://hirin.app
```

`src/config/index.ts` exposes them as:

```ts
config.dodo.apiKey;
config.dodo.webhookKey;
config.dodo.environment;
config.dodo.proProductId;
```

You can delete the legacy keys from `.env`:

```env
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
```

---

## 4. Configure the Webhook Endpoint

This is critical — without a working webhook, payments succeed but your DB never marks the user PRO.

### 4a. Register the Endpoint in Dodo

Dashboard → **Developer** → **Webhooks** → **Add Endpoint**:

| Field       | Value                                                                                                                                                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URL         | `https://hirin.app/api/webhooks/dodo` (production) or your ngrok URL (dev)                                                                                                                                                                               |
| Description | Hirin production webhook                                                                                                                                                                                                                                 |
| Events      | Select **all** of:<br>`subscription.active`<br>`subscription.on_hold`<br>`subscription.cancelled`<br>`subscription.expired`<br>`subscription.failed`<br>`subscription.renewed`<br>`subscription.plan_changed`<br>`payment.succeeded`<br>`payment.failed` |

After saving, click **Reveal Signing Secret** and copy it (`whsec_...`). Set it as `DODO_PAYMENTS_WEBHOOK_KEY`.

### 4b. How the Handler Works

`src/app/api/webhooks/dodo/route.ts` does four things:

1. **Verifies the signature** using the Standard Webhooks library — Dodo signs with HMAC-SHA256 over `webhook-id.webhook-timestamp.body`.
2. **Idempotency check** — looks up `webhookId` in `SubscriptionEvent` table; skips if already processed.
3. **Resolves the user** — every checkout session is created with `metadata: { user_id }`. The webhook event echoes that metadata back so we know which user to update.
4. **Applies the state change** — switches `Subscription.plan`, `status`, `currentPeriodEnd`, etc. based on the event type.

```
subscription.active     → plan=PRO, status=active
subscription.renewed    → plan=PRO, status=active, currentPeriodEnd extended
subscription.cancelled  → status=cancelled, cancelAtPeriodEnd=true (still PRO until period ends)
subscription.expired    → plan=FREE, status=expired
subscription.on_hold    → status=on_hold (payment retry phase)
subscription.failed     → status=inactive (initial failure to activate)
payment.failed          → logged only; doesn't downgrade (grace period)
```

---

## 5. Testing

### 5a. Local Testing with ngrok

```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000
# Copy the https://xxx.ngrok-free.app URL
```

In Dodo dashboard, create a SECOND webhook endpoint pointed at `https://xxx.ngrok-free.app/api/webhooks/dodo`. Set its secret as `DODO_PAYMENTS_WEBHOOK_KEY` in `.env.local`.

### 5b. Apply the Schema Change

```bash
npx prisma migrate dev --name dodo_payments
# This creates the new Subscription + SubscriptionEvent fields
```

### 5c. Test Cards (Test Mode)

| Scenario            | Card                  |
| ------------------- | --------------------- |
| Successful payment  | `4242 4242 4242 4242` |
| Card declined       | `4000 0000 0000 0002` |
| 3-D Secure required | `4000 0027 6000 3184` |

Any future expiry, any CVV.

### 5d. End-to-End Smoke Test

1. Sign in as a test user
2. Go to `/pricing` → click **Upgrade to Pro**
3. You're redirected to `https://test.checkout.dodopayments.com/...`
4. Pay with `4242 4242 4242 4242`
5. Dodo redirects you back to `/matches?upgraded=1`
6. Within ~2 seconds, the webhook fires → DB updates → user is PRO

Verify:

```sql
SELECT plan, status, "dodo_subscription_id", "current_period_end"
FROM subscriptions WHERE "userId" = '<your_user_id>';
-- Expected: plan=PRO, status=active

SELECT "event_type", "created_at"
FROM subscription_events ORDER BY "created_at" DESC LIMIT 5;
-- Expected: subscription.active and possibly payment.succeeded
```

### 5e. Test Cancellation

```bash
curl -X POST http://localhost:3000/api/payments/cancel \
  -H "Authorization: Bearer <clerk_session_jwt>"
```

Verify in DB:

```sql
SELECT status, "cancel_at_period_end", "current_period_end"
FROM subscriptions WHERE "userId" = '<your_user_id>';
-- Expected: cancel_at_period_end=true, plan still PRO until current_period_end
```

After `current_period_end` passes, Dodo fires `subscription.expired` and your handler downgrades to FREE.

### 5f. Webhook Replay Test (Idempotency)

In the Dodo dashboard, find a delivered webhook and click **Resend**. Your handler should respond `{ ok: true, duplicate: true }` and **NOT** double-process.

---

## 6. The Full User Flow

```
1. User clicks "Upgrade to Pro" on /pricing
   ↓
2. Frontend POSTs to /api/payments/create-checkout
   ↓
3. Server calls dodo.checkoutSessions.create({
     product_cart: [{ product_id: DODO_PRO_PRODUCT_ID, quantity: 1 }],
     customer: { email, name },
     metadata: { user_id, plan: 'PRO' },
     return_url: NEXT_PUBLIC_APP_URL/matches?upgraded=1,
   })
   ↓
4. Server upserts Subscription with status='pending'
   ↓
5. Server returns { checkoutUrl } to frontend
   ↓
6. Frontend redirects to checkoutUrl (Dodo hosted page)
   ↓
7. User pays on Dodo's secure checkout
   ↓
8. Dodo redirects user back to /matches?upgraded=1
   ↓
9. (Async) Dodo POSTs subscription.active to /api/webhooks/dodo
   ↓
10. Webhook handler:
    - verifies signature
    - checks idempotency via webhook-id
    - extracts metadata.user_id
    - updates Subscription: plan=PRO, status=active, currentPeriodEnd
   ↓
11. Next page load shows user as PRO
```

**Important:** Step 10 (the webhook) is the source of truth, NOT the redirect. If the user closes the tab between paying and the redirect, the webhook still fires and they still get PRO. This is the key advantage over the old Razorpay flow that relied on the verify-on-redirect pattern.

---

## 7. Troubleshooting

### "Webhook signature verification failed"

- Check `DODO_PAYMENTS_WEBHOOK_KEY` matches the secret in the Dodo dashboard for that endpoint
- Each webhook endpoint has its own secret. Test-mode and live-mode endpoints have different secrets.
- Don't trim/transform the raw body before passing to `wh.verify()` — the signature is over the exact bytes

### "User clicked Upgrade but never became PRO"

- Check `subscription_events` table — is the webhook arriving?
- If no rows, the webhook URL or signing secret is wrong
- If rows exist but status didn't update, check `metadata.user_id` is actually being set in `create-checkout` (it is, in the code we wrote)
- Check Dodo dashboard → Webhooks → your endpoint → **Recent deliveries** for any 4xx/5xx responses

### "Cannot find module 'dodopayments'"

```bash
npm install
npx prisma generate
```

### "Prisma error: Unknown field dodoSubscriptionId"

You haven't run the migration yet:

```bash
npx prisma migrate dev --name dodo_payments
```

### Test mode card not accepted

Make sure `DODO_PAYMENTS_ENV=test_mode` AND your API key starts with `sk_test_`. Mixing test/live keys/envs will fail.

### `return_url` shows error

The URL must be reachable + HTTPS in live mode. For dev, `http://localhost:3000` is fine.

### User in India sees USD pricing

Dodo's **Adaptive Pricing** can auto-localize. Enable it in dashboard → Product → Adaptive Pricing. Otherwise create a separate INR-priced product and pick which one to use based on `x-vercel-ip-country`.

---

## 8. Going Live

1. Complete KYC in Dodo dashboard (1-3 business days)
2. Create the Pro Product again in **Live Mode** (test products don't carry over)
3. Get live API key (`sk_live_...`) and set on Vercel
4. Set `DODO_PAYMENTS_ENV=live_mode` on Vercel
5. Register the production webhook endpoint with `https://hirin.app/api/webhooks/dodo`
6. Copy the live webhook secret to Vercel as `DODO_PAYMENTS_WEBHOOK_KEY`
7. Update `DODO_PRO_PRODUCT_ID` to the live product id
8. Test with a real card (you, $9, refund yourself)

That's it. With Dodo as merchant-of-record, you don't need to handle GST, EU VAT, or Stripe-style tax registrations — Dodo does it.

---

## 9. Quick Reference

| Action              | Code                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Create checkout     | `POST /api/payments/create-checkout`                                                                                 |
| Cancel subscription | `POST /api/payments/cancel`                                                                                          |
| Webhook endpoint    | `POST /api/webhooks/dodo`                                                                                            |
| Dodo client         | `import { dodo } from '@/lib/payments/dodo'`                                                                         |
| Service helpers     | `import { createProCheckoutSession, cancelSubscription, resumeSubscription } from '@/services/subscription.service'` |

| File                                            | Purpose                                      |
| ----------------------------------------------- | -------------------------------------------- |
| `src/lib/payments/dodo.ts`                      | SDK singleton                                |
| `src/services/subscription.service.ts`          | Plan config + checkout/cancel/resume helpers |
| `src/app/api/payments/create-checkout/route.ts` | Initiates a checkout session                 |
| `src/app/api/payments/cancel/route.ts`          | User-facing cancel endpoint                  |
| `src/app/api/webhooks/dodo/route.ts`            | Dodo → DB sync (the source of truth)         |
| `prisma/schema.prisma`                          | `Subscription` + `SubscriptionEvent` models  |

# Security Fixes — Do These FIRST

These are ordered by severity. Fix top-to-bottom.

---

## 1. CRITICAL: Razorpay Webhook Missing — You Are Losing Revenue

**Problem:** Currently `/api/payments/verify` is the only path that flips `Subscription.plan = 'PRO'`. If the user closes the tab between paying and the verify call, **they paid you and stayed free forever.**

There is no `/api/webhooks/razorpay` listener. There is no handler for `subscription.charged` (recurring billing), `subscription.cancelled`, or `payment.failed`.

**Impact:** Payment loss + drift between Razorpay state and your DB state. Eventually a user will threaten a chargeback.

**Fix:**

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
  const eventId = payload.id; // razorpay event id
  const event = payload.event;

  // Idempotency
  const existing = await prisma.subscriptionEvent.findUnique({
    where: { razorpayEventId: eventId },
  });
  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  await prisma.subscriptionEvent.create({
    data: { razorpayEventId: eventId, eventType: event, payload },
  });

  switch (event) {
    case 'subscription.activated':
    case 'subscription.charged':
      await activateOrExtend(payload);
      break;
    case 'subscription.cancelled':
    case 'subscription.paused':
      await downgradeToFree(payload);
      break;
    case 'payment.failed':
      // Notify user, keep PRO active until expiresAt
      break;
  }

  return NextResponse.json({ ok: true });
}
```

Add to `prisma/schema.prisma`:

```prisma
model SubscriptionEvent {
  id              String   @id @default(uuid())
  razorpayEventId String   @unique @map("razorpay_event_id")
  eventType       String   @map("event_type")
  payload         Json
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("subscription_events")
}
```

Register the webhook in Razorpay Dashboard with `RAZORPAY_WEBHOOK_SECRET` (separate from `RAZORPAY_KEY_SECRET`).

---

## 2. CRITICAL: AI Endpoints Have No Rate Limit (Gemini Bill Bomb)

**Problem:** `src/app/api/ai/cover-letter/route.ts` and `src/app/api/ai/interview-prep/route.ts` both have rate-limit checks **commented out** in code. One Pro user calling them in a loop = $X00 in Gemini charges.

**Fix:** Uncomment and harden.

```ts
import { ratelimit } from '@/lib/ratelimit';

const { success, remaining, reset } = await ratelimit.aiPro.limit(`ai:cover:${userId}`);
if (!success) {
  return NextResponse.json(
    { error: 'Rate limit', retryAfter: reset },
    { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
  );
}
```

Add to `src/lib/ratelimit.ts`:

```ts
export const ratelimit = {
  jobsFreeWeekly: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '7 d') }),
  jobsProDaily: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1 d') }),
  aiPro: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 d') }),
  scrape: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 d') }),
};
```

20 cover letters / 20 interview preps per Pro user per day is generous. 5 deep scrapes/day is fair.

Also delete `src/lib/rate-limit.ts` (the duplicate).

---

## 3. CRITICAL: Email Sender on Resend Test Domain

**Problem:** `src/services/email.service.ts` sends from `onboarding@resend.dev`. Resend explicitly states this is for testing only — production emails will be rejected, throttled, or land in spam.

**Impact:** Your daily digest — the entire retention loop — silently fails.

**Fix:**

1. Buy domain: `hirin.app` or `hirin.dev`
2. In Resend dashboard, add the domain
3. Add DNS records: SPF (TXT), DKIM (3 CNAMEs), DMARC (TXT)
4. Verify domain in Resend
5. Update env: `EMAIL_FROM=Hirin <hello@hirin.app>`

```ts
// src/services/email.service.ts
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Hirin <hello@hirin.app>';
```

---

## 4. HIGH: No Unsubscribe Link / `List-Unsubscribe` Header

**Problem:** Digest emails violate CAN-SPAM (US) and GDPR (EU). Resend will eventually rate-limit or suspend your account based on complaint rate.

**Fix:** Add unsubscribe in two places.

### Email body (`src/lib/email/templates/JobDigest.tsx`):

```tsx
<Text style={{ fontSize: 12, color: '#666' }}>
  You're receiving this because you signed up at Hirin.
  <Link href={`https://hirin.app/unsubscribe?token=${unsubToken}`}>Unsubscribe</Link>
  or <Link href={`https://hirin.app/preferences`}>change preferences</Link>.
</Text>
```

### Headers when sending:

```ts
await resend.emails.send({
  from: EMAIL_FROM,
  to: user.email,
  subject: `${matches.length} new job matches`,
  react: <JobDigest ... />,
  headers: {
    'List-Unsubscribe': `<https://hirin.app/unsubscribe?token=${unsubToken}>, <mailto:unsubscribe@hirin.app?subject=unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  },
});
```

Add `User.emailDigestEnabled Boolean @default(true)` and a `/unsubscribe` route that flips it off.

---

## 5. HIGH: No Idempotency on Razorpay Webhook

**Problem:** Razorpay retries webhooks if you don't return 2xx fast. Without an idempotency check, you'll process `subscription.charged` twice → user's `expiresAt` extended twice → free month.

**Fix:** Persist `razorpay_event_id` (unique) before processing. See fix #1.

---

## 6. HIGH: `/api/jobs/scrape` Has No Rate Limit (Pro DoS)

**Problem:** Pro check exists but no rate limit. A Pro user (or compromised Pro account) can spam your Playwright queue.

**Fix:**

```ts
const { success } = await ratelimit.scrape.limit(`scrape:${userId}`);
if (!success) return NextResponse.json({ error: '5 scrapes/day max' }, { status: 429 });
```

---

## 7. HIGH: Resume Upload — No Magic-Byte Validation, No Max Size

**Problem:** `src/app/api/resume/route.ts` trusts MIME header from the client. Attacker uploads `evil.exe` renamed `evil.pdf` — your serverless function will try to parse it. Or uploads a 200MB file → OOM.

**Fix:**

```ts
import { fileTypeFromBuffer } from 'file-type';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const buf = Buffer.from(await file.arrayBuffer());
if (buf.length > MAX_SIZE) return NextResponse.json({ error: 'Max 5MB' }, { status: 413 });

const detected = await fileTypeFromBuffer(buf);
if (!detected || !ALLOWED.has(detected.mime)) {
  return NextResponse.json({ error: 'Only PDF/DOC/DOCX allowed' }, { status: 415 });
}
```

`npm install file-type`

---

## 8. HIGH: CRON_SECRET Is Only Defense for Cron Routes

**Problem:** If `CRON_SECRET` leaks (env dump in error log, accidental commit), anyone can hammer `/api/cron/digest` and exhaust your Resend quota.

**Fix:**

- Restrict at edge to Vercel cron source IPs (check `x-vercel-cron` header which Vercel sets):
  ```ts
  if (req.headers.get('x-vercel-cron') !== '1') {
    return new NextResponse('forbidden', { status: 403 });
  }
  ```
- Add a "max emails sent in last hour" guard inside the cron handler.

---

## 9. MEDIUM: Two Resume-Parse Endpoints (Confusion + Attack Surface)

**Problem:** `/api/resume/parse` and `/api/parse-resume` both exist. Hard to know which is canonical. If only one is patched, the other becomes a vulnerability.

**Fix:** Delete `src/app/api/parse-resume/route.ts`. Keep `src/app/api/resume/parse/route.ts`.

---

## 10. MEDIUM: Webhook Signature for Clerk vs Razorpay vs QStash

**Problem:** Three different webhook senders, three different signature schemes. Easy to mix up.

**Audit:**

- `/api/webhooks/clerk` — uses Svix (`svix.Webhook`). ✅ Should be correct.
- `/api/payments/verify` — uses `RAZORPAY_KEY_SECRET` HMAC. ✅ Correct for client-confirm.
- `/api/webhooks/razorpay` — must use `RAZORPAY_WEBHOOK_SECRET` (different secret). ⚠️ Don't reuse.
- `/api/queue/process-job` — must use QStash signature (`Upstash-Signature` header) verified with `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY`. ⚠️ Verify it does.

Use Upstash's verifier:

```ts
import { Receiver } from '@upstash/qstash';
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});
await receiver.verify({ signature, body });
```

---

## 11. MEDIUM: Scraper Detection / Legal Exposure

**Problem:** LinkedIn and Indeed actively block scrapers. LinkedIn has previously sent C&D letters and IP-banned cloud provider ranges.

**Mitigations:**

- **Don't scrape LinkedIn search** — instead, let users paste a LinkedIn job URL and scrape only that single page. Lower volume, lower legal risk, better UX (user-driven).
- **Indeed:** behind Cloudflare. Free Playwright will hit a CAPTCHA. Either drop Indeed or use a paid unblocker (Bright Data Web Unlocker ~$3/1000 reqs).
- **User-Agent + viewport rotation** — the cheapest deterrent. Pool of 10 UAs, randomize per request.
- **Run scrapers on residential IPs** — Vercel functions run on AWS IPs that LinkedIn flags instantly. Move to Bright Data residential proxy or self-host on Fly Machines.
- **Add ToS clause:** "Pro users access third-party job sources at their own risk; we are not affiliated with LinkedIn/Indeed."

---

## 12. MEDIUM: XSS via Scraped Job Description in Email

**Problem:** Scraped descriptions sometimes contain HTML (`<b>`, `<a href>`, even `<script>` from poorly-sanitized employer postings). React Email + your template don't strip HTML.

**Fix:**

```ts
import sanitizeHtml from 'sanitize-html';

const safe = sanitizeHtml(job.description, {
  allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'li'],
  allowedAttributes: {},
});
```

`npm install sanitize-html @types/sanitize-html`

Apply both in email template and matches detail modal.

---

## 13. MEDIUM: `/api/payments/create-order` Has No Rate Limit

**Problem:** Anonymous spam can create thousands of Razorpay orders. Razorpay rate-limits the API but you'll waste calls.

**Fix:**

```ts
const { success } = await ratelimit.payments.limit(`pay:${userId}`);
// Allow 10 order creates per day
```

---

## 14. LOW: PII (Email) in QStash Payloads

**Problem:** `src/lib/queue/client.ts` enqueues jobs with `userEmail` in plaintext. QStash dashboard logs these.

**Fix:** Pass only `userId`. Look up email inside the worker.

---

## 15. LOW: `console.log` Leaking Data

**Problem:** ~96 `console.log` calls. Some print user resume snippets, parsed skills, embedding lengths. In Vercel logs, these are searchable indefinitely.

**Fix:** Replace with a `log()` helper that strips PII and routes to Sentry breadcrumbs in prod.

```ts
// src/lib/log.ts
export const log = {
  info: (msg: string, meta?: object) =>
    process.env.NODE_ENV === 'production'
      ? Sentry.addBreadcrumb({ message: msg, data: meta })
      : console.log(msg, meta),
  error: (msg: string, err: unknown) => {
    if (process.env.NODE_ENV === 'production') Sentry.captureException(err);
    else console.error(msg, err);
  },
};
```

Then:

```bash
# Find and replace
rg "console\.(log|error|warn)" src/ -l
```

---

## 16. LOW: Check `.gitignore` for Leaked Secrets

Verify these are gitignored:

```
.env
.env.local
.env.production
*.env
sentry.client.config.ts ← safe (DSN is public)
sentry.server.config.ts ← safe but verify no secrets inline
madio-backend-user_accessKeys.csv  ← currently in repo root, MUST be deleted
```

**ACTION:** Delete `madio-backend-user_accessKeys.csv` from the repo. Run:

```bash
git filter-repo --path madio-backend-user_accessKeys.csv --invert-paths
# Then rotate any AWS keys that were in it
```

---

## Severity Summary

| #                               | Severity        | Fix Time                  |
| ------------------------------- | --------------- | ------------------------- |
| 1. Razorpay webhook missing     | CRITICAL        | 1 day                     |
| 2. AI rate limits commented out | CRITICAL        | 30 min                    |
| 3. Email sender on test domain  | CRITICAL        | 2 hours (DNS propagation) |
| 4. No unsubscribe link          | HIGH            | 2 hours                   |
| 5. Webhook idempotency          | HIGH            | (part of #1)              |
| 6. Scrape rate limit            | HIGH            | 30 min                    |
| 7. Resume upload validation     | HIGH            | 1 hour                    |
| 8. CRON_SECRET hardening        | HIGH            | 30 min                    |
| 9. Duplicate parse endpoints    | MEDIUM          | 10 min                    |
| 10. Webhook signature audit     | MEDIUM          | 1 hour                    |
| 11. Scraper detection           | MEDIUM          | Ongoing                   |
| 12. XSS in email                | MEDIUM          | 1 hour                    |
| 13. Payment endpoint rate limit | MEDIUM          | 30 min                    |
| 14. PII in queue payloads       | LOW             | 30 min                    |
| 15. console.log cleanup         | LOW             | 2 hours                   |
| 16. Leaked CSV in repo          | LOW (but do it) | 30 min                    |

**Total: ~2 working days for everything.** Don't launch without fixes #1-#8.

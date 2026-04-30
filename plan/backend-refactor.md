# Backend Refactor Plan

Every change is mapped to exact files. Ordered by priority — do top to bottom.

---

## PHASE 1: Razorpay Subscriptions (CRITICAL — Day 1-2)

You're currently using Razorpay's Orders API (one-shot payments) when you need the Subscriptions API (recurring billing). Right now PRO users pay once and never again — you're losing every recurring dollar.

### 1.1 Update Prisma Schema

**File:** `prisma/schema.prisma`

Replace existing `Subscription` model (drops `stripeCustomerId` — unused):

```prisma
enum Plan {
  FREE
  PRO
  PRO_PLUS
}

enum SubscriptionStatus {
  inactive
  pending
  authenticated
  active
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

Run: `npx prisma migrate dev --name razorpay_subscriptions`

### 1.2 Replace `/api/payments/create-order` with `/api/payments/create-subscription`

**Delete:** `src/app/api/payments/create-order/route.ts`

**New file:** `src/app/api/payments/create-subscription/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/db/prisma';
import { ratelimit } from '@/lib/ratelimit';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLAN_ID_MAP: Record<string, string | undefined> = {
  PRO_INR_MONTHLY: process.env.RAZORPAY_PRO_PLAN_INR,
  PRO_USD_MONTHLY: process.env.RAZORPAY_PRO_PLAN_USD,
  PRO_INR_ANNUAL: process.env.RAZORPAY_PRO_ANNUAL_INR,
  PRO_USD_ANNUAL: process.env.RAZORPAY_PRO_ANNUAL_USD,
};

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { success } = await ratelimit.payments.limit(`pay:${userId}`);
  if (!success) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });

  const { plan, currency, billing } = await req.json();
  const planKey = `${plan}_${currency}_${billing}`.toUpperCase();
  const planId = PLAN_ID_MAP[planKey];
  if (!planId) return NextResponse.json({ error: 'invalid plan' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'user not synced' }, { status: 404 });

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: billing === 'annual' ? 10 : 120,
    quantity: 1,
    customer_notify: 1,
    notes: { user_id: user.id, email: user.email, plan },
  });

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: 'FREE',
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

### 1.3 Build Razorpay Webhook Handler

**New file:** `src/app/api/webhooks/razorpay/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('x-razorpay-signature') ?? '';

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return new NextResponse('invalid signature', { status: 400 });
  }

  const payload = JSON.parse(body);
  const eventId: string = payload.id;
  const event: string = payload.event;

  const existing = await prisma.subscriptionEvent.findUnique({
    where: { razorpayEventId: eventId },
  });
  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  const sub = payload.payload?.subscription?.entity;
  const userId: string | undefined = sub?.notes?.user_id;

  await prisma.subscriptionEvent.create({
    data: { razorpayEventId: eventId, userId, eventType: event, payload },
  });

  if (!userId) return NextResponse.json({ ok: true, ignored: true });

  try {
    switch (event) {
      case 'subscription.activated':
      case 'subscription.charged':
        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: 'PRO',
            status: 'active',
            currentPeriodEnd: new Date(sub.current_end * 1000),
            razorpayCustomerId: sub.customer_id ?? undefined,
            cancelAtPeriodEnd: false,
            pausedAt: null,
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
        // TODO: trigger email notification, keep PRO until currentPeriodEnd
        break;
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { event, userId } });
    return new NextResponse('processing error', { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

### 1.4 Add Cancel Subscription Endpoint

**New file:** `src/app/api/payments/cancel/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/db/prisma';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  });

  if (!user?.subscription?.razorpaySubscriptionId) {
    return NextResponse.json({ error: 'no active subscription' }, { status: 404 });
  }

  await razorpay.subscriptions.cancel(
    user.subscription.razorpaySubscriptionId,
    true /* cancel_at_cycle_end */
  );
  // Webhook will fire `subscription.cancelled` to update DB

  return NextResponse.json({ ok: true });
}
```

---

## PHASE 2: Rate Limits & Validation (Day 3)

### 2.1 Consolidate Rate Limit Modules

**Delete:** `src/lib/rate-limit.ts` (the duplicate)

**Update:** `src/lib/ratelimit.ts` — single source of truth

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const ratelimit = {
  jobsFreeWeekly: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '7 d'),
    prefix: 'rl:jobs:free',
  }),
  jobsProDaily: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 d'),
    prefix: 'rl:jobs:pro',
  }),
  aiPro: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 d'), prefix: 'rl:ai' }),
  scrape: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 d'), prefix: 'rl:scrape' }),
  payments: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 d'), prefix: 'rl:pay' }),
};
```

### 2.2 Uncomment AI Rate Limits

**File:** `src/app/api/ai/cover-letter/route.ts`

Find the commented-out rate limit block and replace with:

```ts
import { ratelimit } from '@/lib/ratelimit';

const { success, remaining, reset } = await ratelimit.aiPro.limit(`ai:cover:${userId}`);
if (!success) {
  return NextResponse.json(
    { error: 'Daily limit reached (20/day). Resets in a few hours.', retryAfter: reset },
    { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
  );
}
```

Same for `src/app/api/ai/interview-prep/route.ts` with key `ai:interview:${userId}`.

### 2.3 Rate Limit on Scrape

**File:** `src/app/api/jobs/scrape/route.ts`

After the Pro check:

```ts
const { success } = await ratelimit.scrape.limit(`scrape:${userId}`);
if (!success) {
  return NextResponse.json({ error: '5 deep scrapes per day max' }, { status: 429 });
}
```

### 2.4 Resume Upload Validation

**File:** `src/app/api/resume/route.ts`

Add at the top of POST handler (after auth check):

```ts
import { fileTypeFromBuffer } from 'file-type';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const formData = await req.formData();
const file = formData.get('file') as File | null;
if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

const buf = Buffer.from(await file.arrayBuffer());
if (buf.length > MAX_SIZE) {
  return NextResponse.json({ error: 'File exceeds 5MB' }, { status: 413 });
}

const detected = await fileTypeFromBuffer(buf);
if (!detected || !ALLOWED.has(detected.mime)) {
  return NextResponse.json({ error: 'Only PDF, DOC, DOCX allowed' }, { status: 415 });
}
```

`npm install file-type`

### 2.5 Cron Hardening

**File:** `src/app/api/cron/jobs/route.ts` and `src/app/api/cron/digest/route.ts`

Add at the top of each:

```ts
const isVercelCron = req.headers.get('x-vercel-cron') === '1';
const hasValidSecret = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;

if (!isVercelCron && !hasValidSecret) {
  return new NextResponse('forbidden', { status: 403 });
}
```

(`isVercelCron` check is for production; `hasValidSecret` lets you trigger manually in dev.)

### 2.6 Sanitize HTML in Job Descriptions

**File:** `src/services/job.service.ts`

```ts
import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTS = {
  allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'],
  allowedAttributes: {},
};

// When persisting Job:
description: sanitizeHtml(rawDescription, SANITIZE_OPTS),
```

`npm install sanitize-html @types/sanitize-html`

---

## PHASE 3: Code Cleanup (Day 4)

### 3.1 Delete Duplicate Resume-Parse Endpoint

```bash
rm -rf src/app/api/parse-resume
```

Update any frontend callers to use `/api/resume/parse`. Run `rg "/api/parse-resume" src/` to find them.

### 3.2 Plan Gating Helper

**File:** `src/services/subscription.service.ts`

Add at top:

```ts
import type { Plan } from '@prisma/client';

export const PLAN_LIMITS = {
  FREE: {
    digestFrequency: 'weekly' as const,
    apiSources: ['remoteok', 'weworkremotely'],
    lightScrapesPerWeek: 3,
    deepScrapesPerDay: 0,
    resumes: 1,
    aiCoverLettersPerDay: 0,
    aiInterviewPrepsPerDay: 0,
    applicationsActive: 5,
    matchHistoryDays: 7,
    bookmarks: 10,
  },
  PRO: {
    digestFrequency: 'daily' as const,
    apiSources: ['adzuna', 'jsearch', 'remoteok', 'weworkremotely'],
    lightScrapesPerWeek: Infinity,
    deepScrapesPerDay: 5,
    resumes: 3,
    aiCoverLettersPerDay: 20,
    aiInterviewPrepsPerDay: 20,
    applicationsActive: Infinity,
    matchHistoryDays: Infinity,
    bookmarks: Infinity,
  },
  PRO_PLUS: {
    /* phase 2 — clone PRO and bump */
  } as any,
} as const;

export function getLimits(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

export function requireFeature<T>(plan: Plan, feature: keyof typeof PLAN_LIMITS.PRO): T {
  const limit = getLimits(plan)[feature];
  return limit as T;
}
```

Replace scattered `if (plan === 'PRO')` checks across the codebase. Find with:

```bash
rg "plan ===|plan ==|PRO" src/services src/app/api -l
```

### 3.3 Drop Unused Stripe Field

Already done in Phase 1.1's schema migration.

### 3.4 Replace `console.log` with Structured Logger

**New file:** `src/lib/log.ts`

```ts
import * as Sentry from '@sentry/nextjs';

const isDev = process.env.NODE_ENV !== 'production';

export const log = {
  info: (msg: string, data?: object) => {
    if (isDev) console.log(`[info] ${msg}`, data ?? '');
    else Sentry.addBreadcrumb({ category: 'info', message: msg, data, level: 'info' });
  },
  warn: (msg: string, data?: object) => {
    if (isDev) console.warn(`[warn] ${msg}`, data ?? '');
    else Sentry.addBreadcrumb({ category: 'warn', message: msg, data, level: 'warning' });
  },
  error: (msg: string, err: unknown, data?: object) => {
    if (isDev) console.error(`[error] ${msg}`, err, data ?? '');
    else Sentry.captureException(err, { tags: { msg }, extra: data });
  },
};
```

Find and replace:

```bash
rg "console\.(log|warn|error)" src/ -l
```

For each file, replace:

- `console.log(...)` → `log.info(...)`
- `console.warn(...)` → `log.warn(...)`
- `console.error('msg', err)` → `log.error('msg', err)`

### 3.5 Strip `any` Types

**File:** `src/app/Onboard/page.tsx`

```ts
interface ParsedResume {
  rawText: string;
  skills: string[];
  experience: { company: string; role: string; duration: string; description: string }[];
}
const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
```

**File:** `src/app/profile/page.tsx`

```ts
import type { Job } from '@prisma/client';
const [savedJobs, setSavedJobs] = useState<Job[]>([]);
```

**File:** `src/app/matches/page.tsx`

Replace `any[]` for bookmarks/applications with proper Prisma types.

**File:** `src/lib/api/remoteok.ts`

```ts
interface RemoteOkJob {
  id: string;
  position: string;
  company: string;
  location?: string;
  salary?: string;
  description?: string;
  url: string;
  tags?: string[];
}
```

### 3.6 Pick One Gemini Env Var

Decide on `GOOGLE_API_KEY` (more standard). Update `src/lib/ai/google.ts` to read only that. Remove `GEMINI_API_KEY` references.

```bash
rg "GEMINI_API_KEY" src/ -l
```

---

## PHASE 4: Per-User Job Fetching + Scraper Hardening (Day 5-6)

### 4.1 Per-User Cron Job Fetch

**File:** `src/app/api/cron/jobs/route.ts`

Currently fetches generic queries. Change to chunk by user preferences:

```ts
import { prisma } from '@/lib/db/prisma';
import { fetchAndSaveJobsFor } from '@/services/job.service';

export async function GET(req: NextRequest) {
  // ... auth check ...

  const users = await prisma.user.findMany({
    where: {
      jobPreferences: { isNot: null },
      resumes: { some: {} },
    },
    include: { jobPreferences: true },
  });

  // Chunk to avoid 60s function timeout
  const BATCH_SIZE = 50;
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map((u) => fetchAndSaveJobsFor(u)));
  }

  return NextResponse.json({ ok: true, processed: users.length });
}
```

**File:** `src/services/job.service.ts`

Add `fetchAndSaveJobsFor(user)`:

```ts
export async function fetchAndSaveJobsFor(user: User & { jobPreferences: JobPreferences | null }) {
  const prefs = user.jobPreferences;
  const query = prefs?.desiredRoles?.[0] ?? 'software engineer';
  const location =
    prefs?.workLocation === 'remote' ? 'remote' : (prefs?.locations?.[0] ?? 'remote');
  const salaryMin = prefs?.salaryMin ?? undefined;

  const sources = getLimits(user.subscription?.plan ?? 'FREE').apiSources;
  await Promise.allSettled([
    sources.includes('adzuna') && fetchFromAdzuna({ query, location, salaryMin }),
    sources.includes('jsearch') && fetchFromJsearch({ query, location }),
    sources.includes('remoteok') && fetchFromRemoteOk({ query }),
    sources.includes('weworkremotely') && fetchFromWWR({ query }),
  ]);
}
```

**Note:** This still fetches the same job pool for all users matching same prefs. Better: a single global fetch with the union of all unique queries, then per-user matching. Prefer the global approach if you have 1000+ users.

### 4.2 Job Dedupe by Hash, Not Just URL

Same job often appears with different URLs (UTM params).

**File:** `src/services/job.service.ts`

```ts
import crypto from 'crypto';

function jobHash(job: { title: string; company: string; location?: string }) {
  return crypto
    .createHash('sha256')
    .update(
      `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}|${(job.location ?? '').toLowerCase().trim()}`
    )
    .digest('hex');
}
```

Add to `Job` model:

```prisma
model Job {
  // ...
  contentHash String? @unique @map("content_hash")
}
```

Migrate, then dedupe on `contentHash` instead of `url` for new inserts.

### 4.3 Scraper Hardening

**File:** `src/lib/scrapers/linkedin.ts`

```ts
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

export async function scrapeLinkedInJob(url: string) {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: ua,
    viewport: { width: 1280 + Math.floor(Math.random() * 200), height: 720 },
    locale: 'en-US',
  });
  // ... rest with selectors abstracted to a config object ...
}
```

For production, consider Bright Data Web Unlocker (~$3/1000 reqs) and run the scraper on Fly Machines or Railway, NOT Vercel functions.

### 4.4 LinkedIn → Paste-URL Only

To reduce legal exposure, change `/api/jobs/scrape` to accept ONLY a single LinkedIn URL pasted by the user, not a search query. Disable bulk LinkedIn search scraping.

```ts
const { url } = await req.json();
if (!url.startsWith('https://www.linkedin.com/jobs/view/')) {
  return NextResponse.json({ error: 'Only LinkedIn job URLs allowed' }, { status: 400 });
}
```

Indeed: drop entirely OR route through Bright Data unblocker.

### 4.5 QStash Signature Verification

**File:** `src/app/api/queue/process-job/route.ts`

```ts
import { Receiver } from '@upstash/qstash';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('upstash-signature') ?? '';

  try {
    await receiver.verify({ signature, body });
  } catch {
    return new NextResponse('invalid signature', { status: 400 });
  }

  // ... process job ...
}
```

### 4.6 Don't Send Email in QStash Payload

**File:** `src/lib/queue/client.ts`

When enqueueing, pass only `userId`. Worker fetches user record to get email.

---

## Summary: Files Changed

| File                                                               | Changes                                                                            |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                                             | Subscription model rebuilt, SubscriptionEvent added, Plan enum, contentHash on Job |
| `src/app/api/payments/create-order/route.ts`                       | DELETED                                                                            |
| `src/app/api/payments/create-subscription/route.ts`                | NEW — Razorpay subscriptions API                                                   |
| `src/app/api/payments/cancel/route.ts`                             | NEW — cancel at period end                                                         |
| `src/app/api/webhooks/razorpay/route.ts`                           | NEW — HMAC verify, idempotency, all event types                                    |
| `src/app/api/parse-resume/`                                        | DELETED (duplicate)                                                                |
| `src/app/api/resume/route.ts`                                      | Magic-byte + max-size validation                                                   |
| `src/app/api/ai/cover-letter/route.ts`                             | Uncomment + harden rate limit                                                      |
| `src/app/api/ai/interview-prep/route.ts`                           | Same                                                                               |
| `src/app/api/jobs/scrape/route.ts`                                 | Rate limit + LinkedIn paste-URL only                                               |
| `src/app/api/cron/jobs/route.ts`                                   | Per-user fetch, batched, x-vercel-cron check                                       |
| `src/app/api/cron/digest/route.ts`                                 | x-vercel-cron check, batching                                                      |
| `src/app/api/queue/process-job/route.ts`                           | QStash signature verify                                                            |
| `src/lib/ratelimit.ts`                                             | Single source of truth                                                             |
| `src/lib/rate-limit.ts`                                            | DELETED                                                                            |
| `src/lib/log.ts`                                                   | NEW — structured logger                                                            |
| `src/lib/scrapers/linkedin.ts`                                     | UA rotation, selector abstraction                                                  |
| `src/services/job.service.ts`                                      | fetchAndSaveJobsFor, contentHash dedup, sanitize-html                              |
| `src/services/subscription.service.ts`                             | PLAN_LIMITS + getLimits                                                            |
| `src/app/Onboard/page.tsx`, `profile/page.tsx`, `matches/page.tsx` | Strip `any`, type with Prisma types                                                |
| `src/lib/api/remoteok.ts`                                          | Strip `any`                                                                        |
| `src/lib/ai/google.ts`                                             | Single env var                                                                     |

Total: **~12 modified files, 5 new files, 3 deletions, 2 migrations**.

# Production Hardening Plan

What you have vs what production-ready looks like.

---

## Current State (Brutal)

| Area                             | Status                                                                                         | Verdict                |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------- |
| TypeScript strict mode           | ON                                                                                             | Good                   |
| ESLint                           | Configured (`eslint.config.mjs` extends `next/core-web-vitals` + `next/typescript` + prettier) | Good                   |
| Prettier                         | Configured                                                                                     | Good                   |
| Husky pre-commit                 | Runs `lint-staged`                                                                             | Good                   |
| commitlint                       | Conventional commits enforced                                                                  | Good                   |
| Frontend tests                   | Zero                                                                                           | Missing                |
| Backend tests                    | Zero                                                                                           | Missing                |
| CI/CD                            | `.github/workflows/` is empty                                                                  | Missing                |
| Sentry                           | Configured (3 configs: client, server, edge) but few captures in code                          | Partial                |
| Uptime monitoring                | None                                                                                           | Missing                |
| Rate limiting                    | Some endpoints, AI ones commented out                                                          | Partial                |
| Health checks                    | None                                                                                           | Missing                |
| Logging                          | ~96 `console.log` statements                                                                   | Weak                   |
| Vercel cron                      | Configured                                                                                     | Good                   |
| Cron timeout safety              | Single function loops all users                                                                | Missing (timeout risk) |
| Resend domain auth               | `onboarding@resend.dev` (test)                                                                 | Broken                 |
| `.env*` in `.gitignore`          | Yes                                                                                            | Good                   |
| Leaked CSV                       | `madio-backend-user_accessKeys.csv` in repo root                                               | Bad                    |
| Type safety in user-facing pages | Several `any` types                                                                            | Weak                   |

**Score: 4/10 production-ready.** Better than most side projects, but the gaps are exactly the ones that bite at launch.

---

## What to Add (Ordered by Impact)

### 1. Vitest (Frontend + Service Layer)

**Install:**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @types/node
```

**New file:** `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

**New file:** `src/test/setup.ts`

```ts
import '@testing-library/jest-dom';
```

**Add to `package.json`:**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

**First tests** (`src/services/__tests__/`):

```ts
// matching.service.test.ts
import { describe, it, expect } from 'vitest';
import { computeOverlap } from '../matching.service';

describe('computeOverlap', () => {
  it('returns intersection of skills', () => {
    expect(computeOverlap(['React', 'Node'], ['Node', 'Postgres'])).toEqual(['Node']);
  });
  it('is case-insensitive', () => {
    expect(computeOverlap(['react'], ['React'])).toEqual(['react']);
  });
});

// subscription.service.test.ts
import { describe, it, expect } from 'vitest';
import { getLimits, PLAN_LIMITS } from '../subscription.service';

describe('getLimits', () => {
  it('returns FREE limits for FREE plan', () => {
    expect(getLimits('FREE').digestFrequency).toBe('weekly');
    expect(getLimits('FREE').aiCoverLettersPerDay).toBe(0);
  });
  it('returns PRO limits for PRO plan', () => {
    expect(getLimits('PRO').digestFrequency).toBe('daily');
    expect(getLimits('PRO').aiCoverLettersPerDay).toBe(20);
  });
});
```

**Coverage target:** 70%+ on `src/services/` and `src/lib/`. Don't bother testing UI components — Playwright covers that.

### 2. Playwright (E2E Critical Path)

**Install:**

```bash
npm init playwright@latest
```

**`playwright.config.ts`:**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'mobile', use: devices['iPhone 14'] },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

**Critical-path tests:** `e2e/critical-path.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('landing page loads with hero CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('matched jobs');
  await expect(page.getByRole('link', { name: /try free/i })).toBeVisible();
});

test('pricing page shows both tiers', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByText('Free')).toBeVisible();
  await expect(page.getByText('Pro')).toBeVisible();
});

test('robots.txt is served', async ({ request }) => {
  const r = await request.get('/robots.txt');
  expect(r.status()).toBe(200);
});

test('sitemap.xml is served', async ({ request }) => {
  const r = await request.get('/sitemap.xml');
  expect(r.status()).toBe(200);
});
```

For authenticated flows, use Clerk's testing token approach.

### 3. GitHub Actions CI

**New file:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-typecheck-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Generate Prisma client
        run: npx prisma generate
      - name: Lint
        run: npm run lint
      - name: Typecheck
        run: npx tsc --noEmit
      - name: Test
        run: npm test
      - name: Build
        run: npm run build
        env:
          # Provide minimal env vars for build
          DATABASE_URL: postgresql://user:pass@localhost:5432/test
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_test_dummy
          CLERK_SECRET_KEY: sk_test_dummy

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test
        env:
          # ... minimum env ...
```

This gates merges. No broken code reaches main.

### 4. Sentry — Actually Use It

The 3 config files exist but most code paths don't capture errors. Audit:

```bash
rg "Sentry\.captureException|Sentry\.captureMessage" src/ -l
```

Add at minimum:

- Razorpay webhook errors (already in our plan)
- Cron job failures (per-user error in loop)
- Resend send failures
- Gemini API failures
- LinkedIn scraper failures (with category tag for monitoring)

```ts
import * as Sentry from '@sentry/nextjs';

try {
  await resend.emails.send({ ... });
} catch (err) {
  Sentry.captureException(err, {
    tags: { component: 'email_digest', user_id: user.id },
    extra: { match_count: matches.length },
  });
}
```

Set up alerts:

- Sentry → Project Settings → Alerts → "Notify when issue rate > 5/min"
- Email + Slack/Discord webhook

**Source maps:** verified in `next.config.ts` — already wired via `withSentryConfig`. Confirm uploads happen in CI.

### 5. UptimeRobot (Free Tier)

Sign up at uptimerobot.com (free, 50 monitors).

Monitor:

- `https://hirin.app/` (status 200)
- `https://hirin.app/api/health` (you need to add this)
- Check frequency: every 5 minutes

**New file:** `src/app/api/health/route.ts`

```ts
import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'healthy', ts: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'unhealthy' }, { status: 503 });
  }
}
```

UptimeRobot alerts → email + push notification on phone.

### 6. Resend Custom Domain (CRITICAL)

Buy domain (`hirin.app` recommended).

In Resend dashboard:

1. Add domain
2. Add DNS records to your registrar:
   - **SPF (TXT):** `v=spf1 include:amazonses.com ~all` (Resend uses SES under the hood)
   - **DKIM (3 CNAMEs):** Resend gives them, point as instructed
   - **DMARC (TXT):** `v=DMARC1; p=quarantine; rua=mailto:dmarc@hirin.app`
3. Wait 24-48h for DNS propagation
4. Click "Verify" in Resend
5. Update env: `EMAIL_FROM="Hirin <hello@hirin.app>"`

Test with mail-tester.com — score should be 9/10 or 10/10.

### 7. Cron Chunking (Avoid Timeout)

Vercel function timeout: 60s on Hobby, 300s on Pro. At 1000 users, looping through all in `cron/digest` will timeout.

**Option A — Chunk into batches:**

```ts
const BATCH = 50;
for (let i = 0; i < users.length; i += BATCH) {
  await Promise.allSettled(users.slice(i, i + BATCH).map(processUser));
}
```

**Option B — Queue per user via QStash:**

```ts
// In cron/digest:
for (const user of users) {
  await qstash.publishJSON({
    url: `${BASE}/api/queue/process-digest`,
    body: { userId: user.id },
  });
}
return NextResponse.json({ ok: true, queued: users.length });
```

Then each `process-digest` call is a separate function execution, all run in parallel. This is the right pattern at scale.

### 8. Structured Logging

We added `src/lib/log.ts` in the backend refactor plan. Use it everywhere instead of `console.log`.

Optional: integrate Axiom or Logtail for log aggregation:

```bash
npm install @axiomhq/js
```

```ts
// src/lib/log.ts (extended)
import { Axiom } from '@axiomhq/js';

const axiom = process.env.AXIOM_TOKEN ? new Axiom({ token: process.env.AXIOM_TOKEN }) : null;

export const log = {
  info: (msg, data) => {
    axiom?.ingest('app', [{ level: 'info', msg, ...data, ts: new Date() }]);
    if (isDev) console.log(`[info] ${msg}`, data);
  },
  // ...
};
```

Free Axiom tier: 0.5 GB ingest/day. Plenty for early stage.

### 9. Bundle Size Budget

Add to `next.config.ts`:

```ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};
```

Run periodically:

```bash
npm run build
# Check `.next/server/app` and `.next/static/chunks` sizes
```

Aim for < 200KB initial JS on landing page. Use `next/dynamic` for heavy components (CoverLetterModal, InterviewPrepModal).

### 10. Database Index Audit

Add these indexes to `prisma/schema.prisma`:

```prisma
model Job {
  // ...
  @@index([scrapedAt])      // for cron cleanup queries
  @@index([source])         // filter by source
}

model JobMatch {
  // ...
  @@index([userId, createdAt])  // listing user's matches in order
  @@index([userId, status])     // filter by status
}

model Application {
  @@index([userId, status])
}
```

After running `prisma migrate`, manually create the pgvector index in Postgres:

```sql
-- IVFFlat index for cosine similarity (faster than tablescan past 10K rows)
CREATE INDEX ON jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON resumes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
```

This is a one-time SQL migration outside Prisma. Add to a `prisma/migrations/manual/pgvector_indexes.sql` file and document in README.

### 11. Vercel Production Config

In Vercel project settings:

- **Plan:** Pro ($20/mo) — required for cron > 10s and proper logs
- **Region:** match your Neon region (us-east-1 typical)
- **Environment Variables:** copy all from `.env.local`, mark sensitive ones as "Encrypted"
- **Cron Jobs:** verify `vercel.json` schedule reflects in dashboard
- **Domain:** custom domain, force HTTPS

### 12. Backup & Recovery

Neon has automatic point-in-time backups for 7 days (free tier). Verify:

- Neon dashboard → Branches → Backups
- Test recovery once: branch from yesterday's snapshot, query a row

Document rollback steps in a `RUNBOOK.md`.

---

## Production Readiness Checklist

```
Linting & Formatting
  [x] ESLint configured
  [x] Prettier configured
  [x] Husky pre-commit + lint-staged + commitlint
  [ ] All `any` types removed from user-data paths
  [ ] All `console.log` replaced with `log` helper

Testing
  [ ] Vitest installed + first tests written (services + lib)
  [ ] Playwright installed + critical-path tests
  [ ] CI runs tests on every push

CI/CD
  [ ] GitHub Actions: lint → typecheck → test → build → e2e
  [ ] Fails on any error (no merging broken code)
  [ ] Vercel preview deploy per PR (automatic)

Monitoring
  [x] Sentry installed (3 configs)
  [ ] Sentry captures used at critical points (webhooks, cron, AI failures)
  [ ] UptimeRobot monitoring `/api/health` every 5 min
  [ ] Sentry alert rules + webhook to phone

Logging
  [ ] `log` helper replaces `console.log` everywhere
  [ ] Optional: Axiom or Logtail aggregator
  [ ] Sensitive data (resume text, email) never in logs

Email
  [ ] Custom domain (hirin.app) verified in Resend
  [ ] SPF + DKIM + DMARC records pass
  [ ] `EMAIL_FROM=Hirin <hello@hirin.app>`
  [ ] mail-tester.com score 9+/10
  [ ] `<List-Unsubscribe>` header present
  [ ] `/unsubscribe` route + `User.emailDigestEnabled` toggle

Cron Hardening
  [ ] `x-vercel-cron` check in cron handlers
  [ ] Chunked processing OR QStash fanout
  [ ] Per-user errors don't kill the whole cron
  [ ] Sentry captures all cron errors

Database
  [ ] Indexes on `Job.scrapedAt`, `Job.source`, `JobMatch.[userId, createdAt]`
  [ ] pgvector IVFFlat indexes on `Job.embedding` and `Resume.embedding`
  [ ] Backup verified (Neon point-in-time)
  [ ] Cleanup cron for stale jobs > 30 days

Security (cross-ref `docs/security.md`)
  [ ] Razorpay webhook with signature + idempotency
  [ ] AI rate limits enforced
  [ ] Resume upload magic-byte + max-size
  [ ] CRON_SECRET hardened
  [ ] QStash signature verified
  [ ] sanitize-html on scraped descriptions
  [ ] `madio-backend-user_accessKeys.csv` deleted from repo + git history

Vercel Config
  [ ] Pro plan ($20/mo)
  [ ] Custom domain with HTTPS
  [ ] All env vars set
  [ ] Cron jobs visible in dashboard
  [ ] Deploy hooks configured

Legal
  [ ] /terms, /privacy, /refund, /contact pages live
  [ ] Privacy policy mentions resume PII + GDPR delete
  [ ] Razorpay merchant settings reference these URLs
```

---

## What "Production-Ready" Actually Means

No software never breaks. But here's what makes it not break at 3am:

1. **Sentry alerts you** before users complain about cron failures
2. **UptimeRobot SMS/email** if the server goes down
3. **CI blocks** broken code from reaching production
4. **Vercel auto-recovers** function crashes within seconds
5. **Per-user errors don't cascade** — one bad user's cron iteration doesn't kill 999 others
6. **Webhook idempotency** prevents double-charging
7. **Structured logs** let you debug without SSH-ing into prod
8. **Backups verified** — you've actually restored once, not assumed it works

That's production-ready. Not "perfect code" — **code that fails gracefully and tells you when it fails.**

# Audit & Improvements — The Brutal Truth

No sugarcoating. What's good, what's broken, what will lose you customers (or get you sued).

---

## What's Genuinely Good

1. **The core idea is timeless.** Job seekers are eternally desperate. "Upload resume → get matched jobs in your inbox" is a one-line pitch every grad, switcher, and laid-off engineer instantly understands.

2. **Vector matching actually works.** pgvector + Gemini text-embedding-004 (768 dims) on both resume and job descriptions, cosine similarity ranking. This is the right architecture — most "AI job matching" startups still keyword-match.

3. **Multi-source aggregation done.** Adzuna + JSearch + RemoteOK + WeWorkRemotely + LinkedIn/Indeed scrapers. You're aggregating where most competitors only have one source.

4. **Auth is done.** Clerk + Svix-verified webhook for sync, App Router middleware. Solid.

5. **Cron jobs scheduled in `vercel.json`** — daily fetch + daily digest. Bearer-token protected. Right primitive.

6. **Onboarding flow is full** — resume → preferences → social links → projects. No half-done steps.

7. **Sentry, Husky, commitlint, Prettier, ESLint** — the production polish layer is set up early. Most side projects never get this far.

8. **Dodo Payments over Stripe** — correct call for an Indian founder targeting global. Dodo is merchant-of-record (handles tax + global cards) and doesn't require US/EU incorporation or GST setup the way Stripe does.

9. **Application tracker exists** — most "job board" tools forget this and lose retention.

---

## What's Broken (Costs You Customers)

### Landing Page (`src/app/page.tsx`)

| Problem                                                   | Why It Matters                                                     | Fix                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Testimonials are hardcoded fake users                     | Anyone reading the source HTML sees fake reviews. Trust dies.      | Pull from a real testimonials table or remove until you have real ones |
| No demo video / GIF                                       | You're selling a workflow but show nothing of the product          | 15-sec screen recording: upload PDF → matches appear                   |
| FAQ before pricing                                        | Visitors compare price first                                       | Reorder: Hero → How → Pricing → FAQ → Footer                           |
| No live job count or "X jobs scraped today"               | Missed social proof signal                                         | Add a counter: "12,438 jobs from 6 sources today"                      |
| Pricing card omits AI features                            | Pro buyers want to see Cover Letter + Interview Prep before paying | Bullet list both with "Pro" badges                                     |
| Mobile carousel can't be touched without hijacking scroll | Mobile users bounce                                                | Test on iPhone, fix touch handlers                                     |

### Onboarding (`src/app/Onboard/page.tsx`)

| Problem                                                          | Why It Matters                                            | Fix                                                                                |
| ---------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Capital `O` in `/Onboard` URL                                    | Looks unprofessional, breaks copy-paste in some browsers  | Rename route to `/onboard`                                                         |
| `useState<any>` for `parsedResume`                               | Lost type safety on the most important user data          | Strongly type with `ParsedResume` interface                                        |
| Resume parsing is the slowest step but no progress indicator     | User assumes app is broken                                | Add a "parsing skills... extracting experience... generating embedding..." stepper |
| User can skip every step and finish onboarding                   | Empty profiles → bad matches → churn                      | Require resume upload to mark onboarding complete                                  |
| Preferences (location, salary) don't filter the actual job fetch | User sets "Remote, $100K+" then gets onsite $40K listings | Pass preferences to Adzuna/JSearch query params                                    |

### Matches Page (`src/app/matches/page.tsx`, 631 lines)

| Problem                                           | Why It Matters                                            | Fix                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 631-line file                                     | Untouchable in 6 months — every change risks a regression | Split: `MatchesGrid`, `MatchCard`, `MatchFilters`, hooks for fetching                          |
| No pagination                                     | Past ~200 matches the page hangs                          | Cursor pagination, 20 per page                                                                 |
| Score shown as `0.7234` (float)                   | Looks like a database value, not UX                       | Convert to "73% match" with color band (green ≥80%, amber 60-80, red <60)                      |
| `useState<any[]>` for bookmarks                   | Same type-safety story                                    | Type with `Job[]`                                                                              |
| No filter by source / location / salary on client | Users want to slice 100s of matches                       | Add chip filters                                                                               |
| No "Why this match?" explanation                  | The AI is opaque — user can't trust it                    | Show top 3 overlap signals: "Skills: React, Postgres ✓ / Location: Remote ✓ / Salary: matches" |
| No "Hide this job" / "Don't show this company"    | Users get spammed by irrelevant matches                   | Add a hide button, persist as `JobMatch.status = "hidden"`                                     |

### Email Digest (`src/services/email.service.ts`)

| Problem                                            | Why It Matters                                                                 | Fix                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `from: 'Hirin Job Digest <onboarding@resend.dev>'` | Resend test domain. **Will land in spam.** Domain not authenticated.           | Set up custom domain in Resend, add SPF/DKIM/DMARC records   |
| No unsubscribe link                                | **CAN-SPAM / GDPR violation.** Resend will throttle you.                       | Add `<List-Unsubscribe>` header + visible unsubscribe footer |
| Job descriptions rendered without sanitization     | Embedded HTML in scraped descriptions = email rendering chaos / XSS in webmail | Strip HTML tags before email render                          |
| Free vs Pro frequency not enforced in code         | Free users get daily digest = wasted Resend credits                            | Check user.subscription.plan inside cron loop                |
| Errors swallowed in cron loop                      | One bad email kills nothing, but no visibility                                 | Log to Sentry, increment a failure counter                   |
| No retry logic                                     | If Resend has a blip, those users miss their digest                            | Wrap in `try/catch` with one retry                           |

### Payments (`src/services/subscription.service.ts`) — historical (now migrated to Dodo)

This section is kept for context. Originally the codebase used Razorpay one-shot orders with no webhook handler. The migration to Dodo Payments addressed all of the issues below — see [DODO_INTEGRATION_GUIDE.md](../DODO_INTEGRATION_GUIDE.md) for the post-migration architecture.

| Past problem (pre-Dodo)                          | How Dodo migration resolved it                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| One-shot orders instead of recurring billing     | Dodo subscription products with `subscription.renewed` events extending `currentPeriodEnd` |
| No webhook handler                                | `/api/webhooks/dodo` is now the source of truth for plan changes                          |
| `expiresAt` never updated by webhook              | Replaced with `currentPeriodEnd`, refreshed on every `subscription.renewed` event         |
| `stripeCustomerId` dead field                     | Dropped from schema; replaced by `dodoCustomerId`                                         |
| No idempotency                                    | `SubscriptionEvent.webhookId @unique` blocks duplicate processing                         |

### Scrapers (`src/lib/scrapers/`)

| Problem                                                  | Why It Matters                                                             | Fix                                                                                                      |
| -------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| LinkedIn scraper relies on raw DOM selectors             | Will break on every LinkedIn UI tweak (monthly)                            | Extract selectors to a config object so you can fix in one place; add a "scraper health" cron            |
| No proxy rotation                                        | LinkedIn IP-bans serverless ranges fast                                    | Use Bright Data / Oxylabs residential proxies for Pro tier (cost: ~$1-5/user/month, factor into pricing) |
| No user-agent rotation                                   | Trivial fingerprinting                                                     | Rotate UA + viewport + locale per request                                                                |
| Playwright on Vercel Functions                           | Vercel Hobby has 10s function timeout — Playwright cold start alone is ~6s | Run scrapers on a separate worker (Railway / Fly machine) triggered via QStash, not inline in Vercel     |
| Indeed scraper trips Cloudflare                          | You'll get a CAPTCHA wall, not job data                                    | Either drop Indeed or use Bright Data's "Web Unlocker"                                                   |
| Default scrape query is `'software engineer' + 'remote'` | Every user gets the same scrape regardless of preferences                  | Pass user's `desiredRoles` and `locations` from JobPreferences                                           |

### Code Quality

| Problem                                   | Files                                                                             | Fix                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ~96 `console.log` / `console.error` calls | All over `src/`                                                                   | Replace with Pino or `console` wrapper that no-ops in prod and reports to Sentry         |
| `@ts-ignore` and `useState<any>`          | `matches/page.tsx`, `Onboard/page.tsx`, `profile/page.tsx`, `lib/api/remoteok.ts` | Type properly — these are the most user-data-heavy files                                 |
| Two duplicate resume-parse endpoints      | `/api/resume/parse` and `/api/parse-resume`                                       | Delete one (keep `/api/resume/parse`)                                                    |
| Two rate-limit modules                    | `lib/ratelimit.ts` and `lib/rate-limit.ts`                                        | Consolidate to one                                                                       |
| AI rate limits **commented out**          | `/api/ai/cover-letter`, `/api/ai/interview-prep`                                  | Uncomment or you'll get a $X00 Gemini bill from one abusive Pro user                     |
| Empty `.github/workflows/`                | No CI                                                                             | At minimum: typecheck + lint + build                                                     |
| No test files anywhere                    | Frontend + backend                                                                | Add Vitest + Playwright (see [production-hardening.md](../plan/production-hardening.md)) |

---

## What Will Kill You

### Legal / Compliance

- **Sender domain `onboarding@resend.dev`** — emails will be spam-filtered AND it's a Resend test domain. Set up custom domain DKIM/SPF day 1.
- **No unsubscribe link in digest** — CAN-SPAM Act violation in US, GDPR violation in EU. Resend has automatic suppression built in but you must wire `<List-Unsubscribe>` headers. **One report = your domain rep tanks.**
- **Scraping LinkedIn jobs** — LinkedIn's hiQ Labs lawsuit (2017-2022) ended with hiQ losing on contract grounds. Public data scraping is _probably_ legal but LinkedIn will IP-block you and may send a cease-and-desist. **Consider only scraping LinkedIn job posts that the user explicitly pastes a URL for, not bulk scraping.**
- **No Terms of Service or Privacy Policy** — Dodo (like every payment processor) requires these for KYC/live-mode approval, and the Dodo checkout page links to them. **You cannot accept payments without them.**
- **Storing resumes (PII)** — GDPR right-to-deletion required. Add a "Delete my account" button that actually deletes Resume rows and embeddings.

### Business

- **No analytics on the funnel** — Umami is wired but no events are tracked. You don't know where users drop off in onboarding.
- **No email capture on landing page for non-signups** — visitors who aren't ready to commit walk away forever.
- **Pro plan features (cover letter, interview prep) are unlimited** — one abuser hits Gemini API hard, your costs spike.

### Technical / Scale

- **Single Vercel cron `/api/cron/digest` loops through ALL users in one function call** — function timeout is 60s on Hobby, 300s on Pro. At 1000 users sending emails, this WILL timeout and silently miss the back half of users.
- **Job table has no index on `embedding`** unless explicitly created with `CREATE INDEX ON jobs USING ivfflat (embedding vector_cosine_ops);` — vector search will tablescan past ~10K rows.
- **Job dedupe by `url`** — but APIs sometimes return the same job with different URLs (e.g., `?utm_source=`). You'll have duplicates. Hash on `(title + company + location)` instead.
- **No job cleanup** — stale jobs (>30 days old, expired postings) accumulate. Add a `cron/cleanup` to soft-delete.
- **`/api/jobs/scrape` has Pro check but no rate limit** — Pro user can DoS your scraper queue.
- **QStash queue payload includes user email in plaintext** — minor PII leak in queue inspection logs.

### Security

- **Dodo webhook signature must be verified with `DODO_PAYMENTS_WEBHOOK_KEY`** — separate from `DODO_PAYMENTS_API_KEY`. Use the `standardwebhooks` library against the raw request body — don't trim or re-serialize before verifying.
- **CRON_SECRET is the only auth on `/api/cron/*`** — if leaked (config commit, log dump), anyone can trigger your daily fetch repeatedly. Add IP allowlist to Vercel cron source IPs.
- **Resume upload — no MIME sniff, just header trust** — attacker uploads `.exe` renamed `.pdf`. Validate magic bytes.
- **Resume upload — no max file size** — 100MB resume will OOM your serverless function.
- **CORS not explicitly set** — Next.js default is fine for same-origin, but if you ever add a mobile/extension client, lock it down.

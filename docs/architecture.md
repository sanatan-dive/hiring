# Architecture Overview

## Tech Stack

```
Frontend (Next.js 15 App Router)         Backend (Same Next.js — API routes)
┌────────────────────────────┐         ┌────────────────────────────────┐
│ Next.js 15.3.8             │         │ Next.js API routes             │
│ React 19                   │         │ Prisma 5.22 + Postgres         │
│ Tailwind CSS 4             │──HTTP──▶│ pgvector (768-dim embeddings)  │
│ Clerk Auth                 │         │ Gemini text-embedding-004 (AI) │
│ Framer Motion              │         │ Resend (email)                 │
│ Embla Carousel             │         │ Dodo Payments (MoR billing)    │
│ Sentry (client)            │         │ Upstash Redis (rate limit)     │
└────────────────────────────┘         │ Upstash QStash (async jobs)    │
                                       │ Playwright (LinkedIn/Indeed)   │
                                       │ Sentry (server + edge)         │
                                       └────────────────────────────────┘
```

## App Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing (Hero, How-it-works, Pricing, FAQ, Testimonials)
│   ├── pricing/page.tsx          # Pricing page + Dodo hosted checkout
│   ├── matches/page.tsx          # Job match dashboard (631 lines, vector ranked)
│   ├── Onboard/page.tsx          # 4-step onboarding (resume → prefs → socials → projects)
│   ├── profile/page.tsx          # Profile + saved jobs + experience editor
│   ├── applications/page.tsx     # Application tracker
│   ├── sign-in/[[...sign-in]]/   # Clerk hosted UI
│   ├── sign-up/[[...sign-up]]/   # Clerk hosted UI
│   ├── layout.tsx                # ClerkProvider + Sentry + Umami
│   ├── global-error.tsx          # Sentry error boundary
│   ├── robots.ts, sitemap.ts     # SEO
│   └── api/
│       ├── webhooks/clerk/       # User sync (Svix-verified)
│       ├── user/                 # GET profile, POST sync
│       ├── resume/               # Upload + parse (Gemini)
│       ├── parse-resume/         # Duplicate of /resume/parse — delete one
│       ├── jobs/fetch/           # Multi-source job fetch (rate-limited)
│       ├── jobs/scrape/          # Pro-only deep scrape (Playwright)
│       ├── matches/              # Vector similarity search
│       ├── ai/cover-letter/      # Pro AI cover letter
│       ├── ai/interview-prep/    # Pro AI interview prep
│       ├── applications/         # Application CRUD
│       ├── bookmarks/            # Save/unsave jobs
│       ├── preferences/          # Job preferences CRUD
│       ├── experience/           # Work experience CRUD
│       ├── projects/             # Portfolio projects CRUD
│       ├── skills/               # Skills CRUD
│       ├── social-links/         # GitHub/LinkedIn/Twitter CRUD
│       ├── payments/create-checkout/ # Dodo hosted checkout session
│       ├── payments/cancel/      # User-initiated cancel-at-period-end
│       ├── webhooks/dodo/        # Dodo webhook (subscription lifecycle)
│       ├── queue/process-job/    # QStash worker (async scrapers)
│       ├── cron/jobs/            # Daily 0 0 * * * — fetch jobs
│       └── cron/digest/          # Daily 0 9 * * * — send digest emails
├── lib/
│   ├── db/prisma.ts              # Prisma singleton
│   ├── ai/google.ts              # Gemini embedding wrapper
│   ├── api/                      # Adzuna, JSearch, RemoteOK, WeWorkRemotely
│   ├── scrapers/                 # LinkedIn, Indeed (Playwright)
│   ├── queue/client.ts           # QStash wrapper
│   ├── email/templates/JobDigest.tsx  # React Email
│   ├── ratelimit.ts, rate-limit.ts    # Two files, both Upstash — consolidate
│   └── utils.ts
├── services/
│   ├── job.service.ts            # fetchAndSaveJobs, triggerDeepScrape
│   ├── resume.service.ts         # parse + persist
│   ├── matching.service.ts       # findSimilarJobs (pgvector)
│   ├── user.service.ts           # User CRUD + sub sync
│   ├── subscription.service.ts   # Dodo checkout/cancel + plan logic
│   ├── preferences.service.ts    # JobPreferences CRUD
│   └── email.service.ts          # Resend digests
├── components/
│   ├── ui/                       # glow-button, file-upload, JobDetailModal, StatCounter
│   ├── preferences/              # MultiSelect, RadioGroup, SalaryRangeSlider, PreferenceCard
│   ├── features/                 # CoverLetterModal, InterviewPrepModal
│   ├── Hero/                     # HeroPage, Pricing, HowItWorks, FAQ, Carousel
│   ├── Header.tsx, Footer.tsx, Dashboard.tsx, FallingProfilesBackground.tsx
├── hooks/                        # useAsync, useProfile
├── types/index.ts                # Shared TS interfaces
└── config/index.ts               # Env-backed central config

prisma/
├── schema.prisma
└── migrations/
```

## Database Schema (Postgres + pgvector)

```
User
├── id (UUID), clerkId (unique), email (unique)
├── name, imageUrl, skills (string[])
└── relations: resumes[], jobPreferences, jobMatches[], applications[],
              socialLinks[], projects[], subscription, bookmarks[]

Resume
├── id, userId, fileName, fileUrl
├── rawText (full text), embedding (vector(768))
└── relations: parsedSkills[], parsedExperiences[]

ParsedSkill           — resumeId, skill
ParsedExperience      — resumeId, company, role, duration, description

JobPreferences (1:1 with User)
├── desiredRoles[], experienceLevel, workLocation, locations[]
├── salaryMin, salaryMax, salaryCurrency, jobType

Job
├── id, title, company, location, salary, description
├── url (unique), source (adzuna|jsearch|remoteok|weworkremotely|scraper|indeed)
├── techStack[], embedding (vector(768)), scrapedAt
└── relations: matches[], applications[], bookmarks[]

JobMatch (unique [userId, jobId])
├── userId, jobId, score (float)
├── status (pending|new|viewed|applied|rejected)
├── emailedAt

Application (unique [userId, jobId])
├── userId, jobId, status, appliedAt, notes

Bookmark (unique [userId, jobId])  — userId, jobId
SocialLink (unique [userId, platform]) — platform, url
Project — userId, name, description, url, techUsed[]

Subscription (1:1 with User)
├── plan (FREE|PRO), status (pending|active|cancelled|expired|on_hold)
├── dodoSubscriptionId, dodoCustomerId, dodoProductId
├── currentPeriodEnd, cancelAtPeriodEnd

SubscriptionEvent (idempotency log)
├── webhookId (unique), userId, eventType, payload, createdAt
```

## API Endpoints

| Method | Path                         | Auth                 | Rate Limit                   | Purpose                   |
| ------ | ---------------------------- | -------------------- | ---------------------------- | ------------------------- |
| POST   | `/api/webhooks/clerk`        | Svix sig             | No                           | User sync from Clerk      |
| GET    | `/api/user`                  | Clerk                | No                           | Current user profile      |
| POST   | `/api/user/sync`             | Clerk                | No                           | Upsert user record        |
| POST   | `/api/resume`                | Clerk                | No                           | Upload resume file        |
| GET    | `/api/resume`                | Clerk                | No                           | Get latest resume         |
| POST   | `/api/resume/parse`          | Clerk                | No                           | Parse via Gemini          |
| POST   | `/api/jobs/fetch`            | Clerk                | Yes (3/wk free, 100/day pro) | Pull from APIs            |
| POST   | `/api/jobs/scrape`           | Clerk + Pro          | No (gap!)                    | Trigger Playwright scrape |
| GET    | `/api/matches`               | Clerk                | No                           | Top vector matches        |
| POST   | `/api/ai/cover-letter`       | Clerk + Pro          | Stub (commented out)         | AI cover letter           |
| POST   | `/api/ai/interview-prep`     | Clerk + Pro          | Stub                         | AI interview Q&A          |
| POST   | `/api/applications`          | Clerk                | No                           | Track application         |
| POST   | `/api/bookmarks`             | Clerk                | No                           | Save job                  |
| POST   | `/api/preferences`           | Clerk                | No                           | Save preferences          |
| POST   | `/api/payments/create-checkout` | Clerk             | Yes (10/day)                 | Dodo hosted checkout      |
| POST   | `/api/payments/cancel`       | Clerk                | No                           | Cancel at period end      |
| POST   | `/api/webhooks/dodo`         | Standard Webhooks sig | No                          | Dodo subscription events  |
| POST   | `/api/queue/process-job`     | QStash sig           | No                           | Async worker              |
| GET    | `/api/cron/jobs`             | Bearer (CRON_SECRET) | No                           | Daily fetch (00:00 UTC)   |
| GET    | `/api/cron/digest`           | Bearer               | No                           | Daily emails (09:00 UTC)  |

## Match Generation Pipeline

```
User uploads resume (POST /api/resume)
   ├── Multipart file (PDF | DOCX | DOC | text)
   ├── Extracted via pdf-parse | mammoth | officeparser
   ├── Stored as Resume.rawText
   ├── Embedding generated (Gemini text-embedding-004 → 768 dims)
   └── ParsedSkill[] + ParsedExperience[] persisted

Cron: POST /api/cron/jobs (00:00 UTC daily)
   ├── For each enabled API: Adzuna, JSearch, RemoteOK, WeWorkRemotely
   ├── Pulls listings (paginated)
   ├── Dedupes by url (unique constraint)
   ├── Generates embedding per Job.description
   └── Persists to Job table

Cron: POST /api/cron/digest (09:00 UTC daily)
   ├── For each user with Resume.embedding:
   │     ├── pgvector cosine similarity:
   │     │      1 - (resume.embedding <=> job.embedding) AS score
   │     ├── Top 10 jobs unemailed → JobMatch upsert with status=new
   │     ├── React Email template rendered
   │     └── Resend.emails.send(...)
   └── emailedAt timestamp updated

User views /matches
   ├── Fetch JobMatch[] joined with Job
   ├── Sort by score desc
   ├── Toggle status (viewed/applied/rejected)
   └── Open JobDetailModal → "Generate Cover Letter" (Pro) → Apply
```

## Cron Schedule (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/jobs", "schedule": "0 0 * * *" },
    { "path": "/api/cron/digest", "schedule": "0 9 * * *" }
  ]
}
```

Both protected by `Authorization: Bearer ${CRON_SECRET}`.

## Environment Variables

**Postgres / Prisma:**

- `DATABASE_URL` — Neon Postgres connection (with pgvector enabled)

**Clerk:**

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET` (Svix)

**AI:**

- `GOOGLE_API_KEY` and/or `GEMINI_API_KEY` (currently both used — consolidate)

**Dodo Payments:**

- `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, `DODO_PAYMENTS_ENV` (test_mode|live_mode), `DODO_PRO_PRODUCT_ID`

**Email:**

- `RESEND_API_KEY`, `EMAIL_FROM` (currently `onboarding@resend.dev` — must change)

**Job APIs:**

- `ADZUNA_APP_ID`, `ADZUNA_API_KEY`
- `JSEARCH_API_KEY` (RapidAPI)

**Upstash:**

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `UPSTASH_QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`

**Cron / App / Sentry:**

- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`

**Feature flags:**

- `ENABLE_DEEP_SCRAPER`, `ENABLE_EMAIL_DIGEST`, `ENABLE_PAYMENTS`

## Current Limitations

- **Email sender is `onboarding@resend.dev`** — Resend test domain, will deliver to spam in production.
- **Same job set for all users** — `cron/jobs` doesn't filter by user preferences (no `desiredRoles` query passed to Adzuna/JSearch).
- **LinkedIn/Indeed scrapers have no proxy rotation** — Will get blocked within hours of public traffic.
- **AI rate limits commented out** — `/api/ai/cover-letter` and `/api/ai/interview-prep` allow unlimited calls per Pro user.
- **Two duplicate parse-resume endpoints** — `/api/resume/parse` and `/api/parse-resume` — pick one.
- **Two rate-limit modules** — `lib/ratelimit.ts` and `lib/rate-limit.ts` — consolidate.
- **No tests** — Zero unit, integration, or e2e tests. CI workflow is empty.
- **No pagination on `/matches`** — All matches loaded at once. Will slow down past ~200 matches.
- **No unsubscribe link on digest emails** — CAN-SPAM / GDPR liability.

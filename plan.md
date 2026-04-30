# Hirin' - Project Roadmap

> AI-powered job matching SaaS that scrapes & matches jobs to your resume

---

## 🎯 Vision

User uploads resume → We find jobs everywhere → Match with AI → Deliver via email daily/weekly

---

## 💰 Business Model

### Subscription Tiers

| Feature             | Free      | Pro       |
| ------------------- | --------- | --------- |
| **Pricing**         | $0        | $9/mo     |
| Job digest          | Weekly    | Daily     |
| Light scraper       | 3x/week   | Unlimited |
| Deep scraper        | ❌        | 2x/month  |
| Resumes             | 1         | 3         |
| AI Cover Letter     | ❌        | ✅        |
| AI Interview Prep   | ❌        | ✅        |
| Application Tracker | Basic (5) | Unlimited |
| Job match history   | 7 days    | Forever   |

### Payment: Dodo Payments (merchant-of-record, global)

---

## 🔒 Production-Ready Practices

### Code Quality

- [ ] **ESLint** - Strict TypeScript rules
- [ ] **Prettier** - Consistent formatting
- [ ] **Husky** - Pre-commit hooks (lint + format)
- [ ] **lint-staged** - Only lint changed files
- [ ] **Commitlint** - Conventional commit messages

### Project Structure

```
src/
├── app/                    # Next.js app router
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── features/           # Feature-specific components
│   └── layouts/            # Layout components
├── lib/
│   ├── api/                # API client utilities
│   ├── db/                 # Database utilities
│   ├── auth/               # Auth utilities
│   ├── email/              # Email templates & sending
│   ├── scrapers/           # Job scrapers
│   └── utils/              # General utilities
├── services/               # Business logic layer
│   ├── job.service.ts
│   ├── user.service.ts
│   ├── matching.service.ts
│   └── subscription.service.ts
├── types/                  # TypeScript types
├── hooks/                  # Custom React hooks
├── constants/              # App constants
└── config/                 # Environment configs
```

### Testing

- [ ] **Vitest** - Unit tests
- [ ] **Playwright** - E2E tests
- [ ] **MSW** - API mocking
- [ ] Minimum 70% coverage for services

### CI/CD Pipeline

- [ ] GitHub Actions workflow
- [ ] Lint + Type check on PR
- [ ] Run tests on PR
- [ ] Preview deployments (Vercel)
- [ ] Auto-deploy main to production

### Monitoring & Logging

- [ ] **Sentry** - Error tracking (free tier)
- [ ] **Axiom/Logtail** - Log aggregation (free tier)
- [ ] **Uptime Robot** - Uptime monitoring (free)
- [ ] **Plausible/Umami** - Privacy-friendly analytics

### Security

- [ ] Rate limiting (Upstash)
- [ ] Input validation (Zod)
- [ ] CORS configuration
- [ ] CSP headers
- [ ] API authentication middleware
- [ ] Secure environment variables

### Performance

- [ ] Image optimization (Next.js Image)
- [ ] Code splitting
- [ ] API response caching
- [ ] Database query optimization
- [ ] Edge functions where applicable

---

## 🏗️ Architecture

### Tech Stack (Budget-Friendly)

- **Frontend**: Next.js 15 on Vercel (free)
- **Auth**: Clerk (free tier - 10K MAU)
- **DB**: NeonDB + Prisma (free - 3GB)
- **Vector DB**: pgvector in Neon
- **Queue**: Upstash Redis + QStash (free tier)
- **Email**: Resend (3K/month free)
- **Job APIs**: Adzuna, JSearch, RemoteOK (free tiers)
- **Scraping**: Playwright on Vercel Functions

### System Flow

```
User → Upload Resume → Parse (Gemini) → Generate Embedding → Store

Cron (daily/weekly):
  → Fetch jobs from APIs
  → Light scrape job boards
  → Generate job embeddings
  → Vector similarity search
  → Send email digest
```

---

## 📋 Development Phases

### Phase 1: Core Foundation ✅ (Done)

- [x] Next.js + Tailwind + Clerk auth
- [x] Resume upload + Gemini parsing
- [x] User profile + preferences
- [x] NeonDB + Prisma schema

### Phase 2: Job Fetching ✅ (Done)

- [x] Integrate Adzuna API (free tier)
- [x] Integrate JSearch API (RapidAPI)
- [x] Create Job model in Prisma
- [x] Build `/api/jobs/fetch` endpoint
- [x] Add job listing UI `/matches`

### Phase 3: Vector Matching ✅ (Done)

- [x] Enable pgvector in Neon
- [x] Add embedding column to Resume & Job
- [x] Generate embeddings on resume save
- [x] Generate embeddings for jobs
- [x] Build similarity search query
- [x] Rank jobs by match score

### Phase 4: Light Scraper ✅ (Done)

- [x] Build scraper for RemoteOK (allows scraping)
- [x] Build scraper for WeWorkRemotely
- [x] Schedule via Vercel Cron (free)
- [x] Rate limit per user tier <!-- id: 5 -->

### Phase 5: Email Digests

- [x] Setup Resend integration
- [x] Design email template (React Email)
- [x] Weekly cron for free users
- [x] Daily cron for pro users
- [ ] Track email opens/clicks

### Phase 6: Payments + Pro Features ✅ (Done)

- [x] Integrate Dodo Payments (merchant-of-record)
- [x] Build subscription management (hosted checkout + webhook source-of-truth)
- [x] Implement tier-based rate limiting
- [x] Build AI Cover Letter (Gemini)
- [x] Build AI Interview Prep
- [x] Application tracker

### Phase 7: Deep Scraper ✅ (Done)

- [x] Setup Upstash Queue
- [x] Playwright scraper for LinkedIn (careful)
- [x] Scraper for Indeed
- [x] Job processing worker
- [x] Pro-only access control

### Phase 8: Polish & Launch

- [ ] Landing page redesign
- [ ] SEO optimization
- [ ] Analytics (Plausible/Umami - free)
- [ ] Error monitoring (Sentry free tier)
- [ ] Documentation
- [ ] Launch on ProductHunt

---

## 🔧 API Integrations

### Job APIs (Free Tiers)

| API       | Free Limit | Best For     |
| --------- | ---------- | ------------ |
| Adzuna    | 250/month  | General jobs |
| JSearch   | 500/month  | Tech jobs    |
| RemoteOK  | Unlimited  | Remote jobs  |
| Remotive  | 100/day    | Remote tech  |
| Arbeitnow | Unlimited  | EU jobs      |

### Services

| Service | Free Tier                        |
| ------- | -------------------------------- |
| Vercel  | 100GB bandwidth                  |
| NeonDB  | 3GB, 1 compute hr/day            |
| Clerk   | 10K MAU                          |
| Upstash | 10K commands/day                 |
| Resend  | 3K emails/month                  |
| Gemini  | Pay as you go (Gemini Free Tier) |

---

## 📊 Database Schema Additions

```prisma
model Job {
  id          String   @id @default(cuid())
  title       String
  company     String
  location    String?
  salary      String?
  description String?
  url         String   @unique
  source      String   // adzuna, jsearch, scraper
  embedding   Float[]  // pgvector
  scrapedAt   DateTime @default(now())

  matches     JobMatch[]
}

model JobMatch {
  id         String   @id @default(cuid())
  userId     String
  jobId      String
  score      Float    // similarity score
  status     String   // new, viewed, applied, rejected
  emailedAt  DateTime?
  createdAt  DateTime @default(now())

  user User @relation(...)
  job  Job  @relation(...)

  @@unique([userId, jobId])
}

model Subscription {
  id                   String   @id @default(cuid())
  userId               String   @unique
  plan                 String   // free, pro
  status               String   // pending, active, cancelled, expired, on_hold
  dodoSubscriptionId   String?  @unique
  dodoCustomerId       String?  @unique
  dodoProductId        String?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean  @default(false)
  createdAt            DateTime @default(now())

  user User @relation(...)
}

model Application {
  id        String   @id @default(cuid())
  userId    String
  jobId     String
  status    String   // applied, interviewing, rejected, offer
  appliedAt DateTime
  notes     String?

  user User @relation(...)
  job  Job  @relation(...)
}
```

---

## 🚀 MVP Checklist

### Must Have (Launch)

- [x] Resume parsing + storage
- [x] Job fetching from APIs
- [ ] Basic matching (keyword-based initially)
- [ ] Weekly email digest
- [ ] Free/Pro tiers
- [ ] Payment integration

### Nice to Have (Post-Launch)

- [ ] Vector embeddings
- [ ] Deep scraper
- [ ] AI cover letter
- [ ] Application tracker
- [ ] Mobile app

---

## 💡 Future Ideas

1. **Chrome Extension** - Apply to jobs directly, auto-fill forms
2. **Resume Builder** - AI-powered resume improvement
3. **Referral System** - Users refer friends, get free Pro
4. **Company Reviews** - Aggregate Glassdoor/Blind reviews
5. **Skill Gap Analysis** - What skills to learn for dream job
6. **Networking** - Connect with people at target companies

---

## 📅 Suggested Timeline

No rush! Build when you can:

| Phase                  | Effort  | Priority |
| ---------------------- | ------- | -------- |
| Phase 2: Job APIs      | 1 week  | High     |
| Phase 3: Matching      | 1 week  | High     |
| Phase 5: Email         | 3 days  | High     |
| Phase 6: Payments      | 1 week  | High     |
| Phase 4: Light Scraper | 1 week  | Medium   |
| Phase 7: Deep Scraper  | 2 weeks | Low      |
| Phase 8: Launch        | 1 week  | High     |

---

_Last Updated: Feb 2026_

# Pricing Strategy

---

## Competitor Pricing (2026)

| Product                      | Type             | Free Tier        | Paid Plans     | Notes                             |
| ---------------------------- | ---------------- | ---------------- | -------------- | --------------------------------- |
| LinkedIn Premium             | Job seeking      | None (1mo trial) | $39.99/mo      | The bar everyone compares to      |
| Sonara.ai                    | AI auto-apply    | None             | $80/mo         | Auto-applies to jobs              |
| Simplify.jobs                | Resume + tracker | Generous         | $20/mo Pro     | Browser extension, big competitor |
| Teal HQ                      | Job tracker + AI | Generous         | $9-29/mo       | Closest free-tier rival           |
| Huntr.co                     | Job tracker      | Free             | $20/mo Pro     | Pioneer of the kanban board       |
| JobScan                      | Resume optimizer | 5 scans free     | $50/mo (!)     | Overpriced ATS scoring            |
| Otta / Welcome to the Jungle | Curated jobs     | Free             | Free + premium | Editorial curation                |

**Key insight:** Hirin' competes in the **"AI digest + tracker"** niche. Closest competitors are Teal ($9-29) and Huntr ($20). Simplify is the heavyweight at $20 with millions of users.

Your differentiation:

1. **Vector matching beats keyword matching** — most competitors keyword-match
2. **Multi-source aggregation** — Teal/Huntr require browser extension; you scrape for them
3. **Inbox delivery** — most tools require you to log in; daily email is sticky
4. **AI cover letter + interview prep included in Pro** — Simplify charges $30 extra

---

## Recommended Model: Subscription with Add-Ons

The current `plan.md` has Free vs Pro at $8/mo. That's underpricing your AI features. Here's a better tiered structure.

### Free — "Searcher"

| Feature                            | Value                                            |
| ---------------------------------- | ------------------------------------------------ |
| Job digest                         | Weekly (every Monday 09:00 UTC, user's local TZ) |
| API job sources                    | RemoteOK, WeWorkRemotely (no auth required)      |
| Light scrapes (LinkedIn paste-URL) | 3/week                                           |
| Resumes                            | 1                                                |
| AI Cover Letter                    | ❌                                               |
| AI Interview Prep                  | ❌                                               |
| Application Tracker                | Basic (5 active applications)                    |
| Match history                      | 7 days                                           |
| Bookmarks                          | 10                                               |

**Purpose:** Get the user to the "aha moment" — first matched job in inbox — within 24 hours of signup. Weekly digest is enough to feel valuable, sparse enough to make Pro feel necessary.

### Pro — $9/mo (₹699/mo in India)

| Feature                                | Value                                              |
| -------------------------------------- | -------------------------------------------------- |
| Job digest                             | Daily (09:00 user local)                           |
| API job sources                        | All (Adzuna + JSearch + RemoteOK + WeWorkRemotely) |
| Light scrapes                          | Unlimited (rate-limited 5/hour)                    |
| Deep scrapes (LinkedIn search, Indeed) | 5/day                                              |
| Resumes                                | 3 (try different versions per role)                |
| AI Cover Letter                        | 20/day                                             |
| AI Interview Prep                      | 20/day                                             |
| Application Tracker                    | Unlimited                                          |
| Match history                          | Forever                                            |
| Bookmarks                              | Unlimited                                          |
| One-click "Hide company"               | ✅                                                 |
| Match explanation ("Why this match?")  | ✅                                                 |
| Email follow-up reminders              | ✅                                                 |

**Purpose:** Active job seekers. The "I'm looking for 3-6 months" customer. Below the $10 psychological barrier in USD, well below LinkedIn Premium ($40).

### Pro+ — $19/mo (₹1,499/mo in India) [PHASE 2]

| Feature                               | Value |
| ------------------------------------- | ----- |
| Everything in Pro                     | +     |
| Auto-apply (when supported by source) | ✅    |
| LinkedIn outreach templates           | ✅    |
| Salary insights / negotiation coach   | ✅    |
| Priority scrape queue                 | ✅    |
| 1:1 resume review (human, monthly)    | ✅    |

**Don't launch with this.** Wait until Pro hits 100 paying users. Use it as the "what's next" upsell.

---

## Annual Pricing (20% Discount)

| Tier | Monthly | Annual (per month) | Annual (total) |
| ---- | ------- | ------------------ | -------------- |
| Pro  | $9      | $7.20              | $86.40         |
| Pro+ | $19     | $15.20             | $182.40        |

Job-seekers in active search mode often pay annually because "I'll be looking for 6+ months" feels longer than 3 months in. Increases LTV and reduces churn.

---

## India-Specific Pricing (₹)

Use Razorpay's multi-currency support. Indian users see INR prices:

| Tier | USD | INR    |
| ---- | --- | ------ |
| Pro  | $9  | ₹699   |
| Pro+ | $19 | ₹1,499 |

INR prices are ~22% lower than USD equivalent — purchasing power parity. An Indian engineer who would never pay $9 will pay ₹699.

**Detection:** geolocate via Vercel headers (`x-vercel-ip-country`) or Clerk metadata. Default to USD elsewhere.

---

## Add-On Packs (One-Time Purchase)

For users who want to boost specific features without a subscription:

| Pack          | Price | What                                                |
| ------------- | ----- | --------------------------------------------------- |
| Resume Boost  | $5    | 5 AI cover letters + 5 interview preps              |
| Scrape Pack   | $10   | 25 deep scrapes (LinkedIn search, Indeed)           |
| Resume Review | $25   | Human-reviewed resume rewrite (post-launch, manual) |

These are great for free users who want one specific thing without a subscription. They also bridge the gap if your AI features outgrow the Pro daily limit.

---

## Revenue Projections (Conservative)

Assuming 1000 signups in first 3 months (realistic for r/jobs + r/cscareerquestions launch):

- 85% stay free = 850 users
- 12% buy Pro = 120 × $9 = **$1,080/mo**
- 3% buy Pro+ (Phase 2 only) = 30 × $19 = **$570/mo**
- Add-on packs (avg $7 × ~5% of free users) = ~$300/mo

**Month 3 MRR: ~$1,400-1,950 (Phase 1 only)**
**Month 6 MRR (with Pro+): ~$3,500+**

Conservative because you need 3-6 months for retention to settle. Job seekers naturally churn when they get hired — but they refer friends.

---

## Cost Structure

| Cost                                       | Amount           | Notes                                        |
| ------------------------------------------ | ---------------- | -------------------------------------------- |
| Vercel Pro                                 | $20/mo           | Required for cron timeout > 10s              |
| Neon Postgres                              | $0-19/mo         | Free up to 3GB; paid for production          |
| Clerk                                      | $0-25/mo         | Free up to 10K MAU                           |
| Resend                                     | $0-20/mo         | 3K free, $20/mo for 50K emails               |
| Upstash Redis                              | $0-10/mo         | Pay-per-request                              |
| Upstash QStash                             | $0-10/mo         | Pay-per-message                              |
| Adzuna API                                 | $0               | Free tier 250/mo, contact for higher         |
| JSearch (RapidAPI)                         | $0-50/mo         | $0 for 200/mo, $50 for 10K/mo                |
| Gemini API                                 | ~$5-30/mo        | text-embedding-004 + 2.5 Pro for AI features |
| Bright Data Web Unlocker (LinkedIn/Indeed) | ~$50-200/mo      | Required for production scraping             |
| Domain (hirin.app)                         | ~$30/year        |                                              |
| Sentry                                     | $0               | Free up to 5K errors/mo                      |
| **Total**                                  | **~$100-350/mo** | Scales with users                            |

At 100 paying users ($900/mo MRR), gross margin is ~60-70%. Once over 200 users, ~80%+. SaaS margins.

**Key cost driver:** Bright Data for LinkedIn/Indeed scraping. If you can avoid scraping (paste-URL only), costs drop to ~$60-100/mo.

---

## Implementation Notes

### Database Schema Changes

Update `prisma/schema.prisma`:

```prisma
model Subscription {
  id        String   @id @default(uuid())
  userId    String   @unique
  plan      Plan     @default(FREE)
  status    String   @default("inactive")
  expiresAt DateTime?

  // Razorpay subscription fields (NOT one-shot order fields)
  razorpaySubscriptionId String?  @unique @map("razorpay_subscription_id")
  razorpayPlanId         String?  @map("razorpay_plan_id")
  razorpayCustomerId     String?  @unique @map("razorpay_customer_id")
  currentPeriodEnd       DateTime? @map("current_period_end")
  cancelAtPeriodEnd      Boolean   @default(false) @map("cancel_at_period_end")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum Plan {
  FREE
  PRO
  PRO_PLUS
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

Drop `stripeCustomerId` field — unused.

### Plan Gating Logic

Single source of truth in `src/services/subscription.service.ts`:

```ts
export const PLAN_LIMITS = {
  FREE: {
    digestFrequency: 'weekly',
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
    digestFrequency: 'daily',
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
    /* phase 2 */
  },
} as const;

export function getLimits(plan: Plan) {
  return PLAN_LIMITS[plan];
}
```

Use everywhere instead of scattered `if (plan === 'PRO')` checks.

### Free → Pro Conversion Triggers

Place upgrade CTAs at the moment of friction:

1. **Free user opens 4th match this week** → "You've used 3 of 3 weekly matches. Upgrade for daily digests."
2. **Free user clicks "Generate Cover Letter"** → "Cover letters are a Pro feature. Upgrade for $9/mo or buy a 5-pack for $5."
3. **Free user adds 6th application** → "You've reached 5/5 active applications. Upgrade for unlimited."
4. **Free user pastes LinkedIn URL after 3rd scrape** → "You've used your 3 weekly scrapes. Pro = unlimited."
5. **Free user views match score** → blur "Why this match?" panel with "See match reasoning — Pro feature"

These contextual prompts convert 3-5x better than a static pricing page.

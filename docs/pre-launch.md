# Pre-Launch Checklist

Everything must be checked off before you tell anyone about Hirin'. Ordered by priority.

---

## Week 1-2: Fix Critical Issues

### Security & Payments

- [x] **Dodo Payments hosted checkout** (replaced Razorpay one-shot orders) — see [payment.md](payment.md)
- [x] **Built `/api/webhooks/dodo`** — handles `subscription.active`, `subscription.renewed`, `subscription.cancelled`, `subscription.expired`, `subscription.on_hold`, `payment.failed`
- [x] **Idempotency** — `SubscriptionEvent.webhookId` unique on Dodo `webhook-id` header
- [ ] **Uncomment AI rate limits** — `/api/ai/cover-letter`, `/api/ai/interview-prep` (20/day per Pro user)
- [ ] **Add rate limit on `/api/jobs/scrape`** — 5/day per Pro user
- [ ] **Add rate limit on `/api/payments/create-checkout`** — 10/day
- [ ] **Resume upload validation** — magic-byte check, max 5MB
- [ ] **Email custom domain** — buy `hirin.app`, set DKIM/SPF/DMARC in Resend
- [ ] **`List-Unsubscribe` header on digest emails**
- [ ] **`/unsubscribe` route** — flips `User.emailDigestEnabled`
- [ ] **Sanitize HTML in scraped job descriptions** — `sanitize-html` package
- [ ] **Delete `madio-backend-user_accessKeys.csv`** from repo (rotate keys if it had any)
- [ ] **Verify QStash signature on `/api/queue/process-job`** — `Receiver` from `@upstash/qstash`
- [ ] **Restrict `/api/cron/*` to Vercel cron source** — check `x-vercel-cron` header
- [ ] **`.gitignore` audit** — ensure `.env*` excluded

### Code Cleanup

- [ ] **Delete duplicate `/api/parse-resume/`** (keep `/api/resume/parse/`)
- [ ] **Consolidate `lib/ratelimit.ts` and `lib/rate-limit.ts`** into one
- [x] **Drop `Subscription.stripeCustomerId`** field (replaced by Dodo fields in migration)
- [ ] **Replace `console.log` calls with `log` helper** routing to Sentry breadcrumbs
- [ ] **Remove `useState<any>`** in `Onboard/`, `matches/`, `profile/`, `lib/api/remoteok.ts`
- [ ] **Pick one of `GOOGLE_API_KEY` / `GEMINI_API_KEY`** — drop the other from env

---

## Week 3-4: Build Business Layer

### Subscriptions

- [ ] Create Dodo Payments account, switch to Test Mode (no KYC for test)
- [ ] Create the Pro Product in Dodo dashboard (Subscription type, $9/mo, monthly billing); enable Adaptive Pricing if you want auto-INR
- [ ] Save Product ID to env: `DODO_PRO_PRODUCT_ID`
- [x] Update `prisma/schema.prisma` (Subscription with `dodoSubscriptionId`/`dodoCustomerId`/`currentPeriodEnd`/`cancelAtPeriodEnd` + `SubscriptionEvent.webhookId`)
- [x] Run migration: `npx prisma migrate dev --name dodo_payments`
- [x] Build `/api/payments/create-checkout` (replaced create-order)
- [x] Build `/api/payments/cancel`
- [x] Build `/api/webhooks/dodo` with Standard Webhooks verify and `webhookId` idempotency
- [x] Update Pricing page UI to redirect to Dodo's hosted checkout
- [ ] Add "Manage subscription" section on `/profile`
- [ ] Test end-to-end with `sk_test_` Dodo key + ngrok webhook (card `4242 4242 4242 4242`)
- [ ] Submit business verification for Dodo live mode (1-3 business days)

### Plan Gating

- [ ] Centralize `PLAN_LIMITS` in `subscription.service.ts` — see [pricing.md](pricing.md)
- [ ] Free user: weekly digest only, 2 sources, 3 light scrapes/wk, 1 resume, 5 active applications, 7-day match history
- [ ] Pro user: daily digest, all sources, unlimited light + 5 deep scrapes/day, 3 resumes, 20 AI/day, unlimited tracker
- [ ] Replace scattered `if (plan === 'PRO')` checks with `getLimits(plan)` lookup
- [ ] Add upgrade CTAs at friction points: 4th match this week, AI button click, 6th application

### Email Production-Readiness

- [ ] Resend custom domain verified, SPF/DKIM/DMARC pass
- [ ] `EMAIL_FROM=Hirin <hello@hirin.app>` in env
- [ ] `<List-Unsubscribe>` headers on digest
- [ ] HTML sanitization in `JobDigest.tsx`
- [ ] Cron loops chunk users (100/batch) to avoid 60s timeout
- [ ] Free vs Pro frequency enforced (weekly vs daily)

---

## Week 5-6: Make It Sellable

### Landing Page

- [ ] Rewrite hero copy: "Stop scrolling job boards. Get matched jobs in your inbox."
- [ ] Record 20-second demo video → `public/demo.mp4`
- [ ] Add live stats strip ("X jobs scraped today")
- [ ] Remove fake testimonial carousel OR replace with 1 real beta-user quote
- [ ] Reorder sections: Hero → How → Pro features → Pricing → FAQ → Footer
- [ ] Mobile-responsive hero (test on iPhone, Android)
- [ ] Pricing card on landing shows AI features prominently

### Onboarding

- [ ] Rename `/Onboard` → `/onboard`
- [ ] Strongly type `parsedResume`
- [ ] Multi-step parse progress indicator (uploading → extracting → embedding)
- [ ] Require resume upload to mark onboarding complete
- [ ] Pass user preferences to job fetch query (Adzuna/JSearch params)

### Matches Page

- [ ] Split 631-line file into `MatchesGrid`, `MatchCard`, `MatchFilters`, hook
- [ ] Format score as "73% match" with color band (green/amber/red)
- [ ] Cursor pagination, 20/page
- [ ] "Why this match?" panel with skill/location/salary overlap
- [ ] "Hide this job" / "Hide company" actions
- [ ] Filter chips: Remote, 80%+, Unviewed, By source
- [ ] Empty state for new users

### Profile

- [ ] Strongly type `savedJobs`
- [ ] "Manage subscription" section
- [ ] "Delete account" button (GDPR cascade-delete)
- [ ] Resume version manager (Pro: pick which resume drives matching)

### SEO & Polish

- [ ] Page titles + descriptions in metadata for `/`, `/pricing`, `/matches`, `/onboard`
- [ ] Open Graph tags + `og-image.png` (1200x630)
- [ ] Twitter card tags
- [ ] Replace Next.js default favicon with Hirin' logo
- [ ] Verify `robots.ts` and `sitemap.ts` include all public routes
- [ ] Ensure `noindex` on `/matches`, `/profile`, `/applications` (private)

### Legal (Dodo requires these for live-mode KYC, and the checkout page links to them)

- [ ] **Terms of Service** at `/terms`
- [ ] **Privacy Policy** at `/privacy` — explicitly mention resume PII handling, GDPR delete-on-request, scraping disclaimer
- [ ] **Refund Policy** at `/refund` — set your refund window (Dodo enforces what you publish)
- [ ] **Contact** at `/contact` with support email — Dodo requires a contact channel for buyers

### Domain & Deploy

- [ ] Buy domain (`hirin.app` or alternative)
- [ ] Vercel: production deployment, custom domain, SSL
- [ ] Set all env vars in Vercel: DATABASE_URL, CLERK_*, DODO_PAYMENTS_*, DODO_PRO_PRODUCT_ID, RESEND_*, etc.
- [ ] Verify Sentry source maps upload in CI
- [ ] Configure Vercel cron secret = `CRON_SECRET`
- [ ] Test daily cron in production (manually trigger first time)

### Analytics

- [ ] Wire Umami events: `signup`, `resume_uploaded`, `first_match_shown`, `cover_letter_generated`, `subscribe_clicked`, `subscribe_completed`
- [ ] Set up funnel report: signup → resume → first match → upgrade

---

## Week 7: Internal Testing

- [ ] Run all P0 tests from [test-cases.md](test-cases.md) (47 tests)
- [ ] Test on iPhone Safari, Android Chrome, desktop Chrome/Firefox/Safari
- [ ] Test full payment flow with real card (you, not test mode) — refund yourself after
- [ ] Test webhook delivery via Dodo dashboard's "Resend" button on a delivered event
- [ ] Recruit 5-10 beta testers (friends, indie hackers, r/cscareerquestions DMs)
- [ ] Monitor Sentry for errors during beta — fix top 3 before public launch
- [ ] Stress test cron: simulate 500 users, ensure digest cron completes in < 60s

---

## Week 8: Launch Prep + Launch

### Asset Checklist

- [ ] Logo (256x256, 512x512 PNG + SVG)
- [ ] Demo video (20-30 sec)
- [ ] Long-form demo video (2-3 min for YouTube/PH)
- [ ] 6-8 screenshots for Product Hunt
- [ ] Tagline (60 chars): "AI-matched jobs in your inbox. Daily."
- [ ] Maker bio for PH (4-6 sentences)
- [ ] Maker comment for PH (2-3 paragraphs)
- [ ] Twitter banner / pinned tweet draft

### Launch Day

- [ ] Product Hunt launch at midnight PT
- [ ] Reddit posts queued for r/SideProject, r/cscareerquestions, r/jobs
- [ ] X/Twitter launch thread + demo video
- [ ] LinkedIn post (your best channel for B2B job seekers)
- [ ] HN "Show HN" submission, Tue-Thu morning ET
- [ ] Email beta tester list, ask for feedback + share
- [ ] First 6 hours: reply to every comment within 30 min
- [ ] Have UptimeRobot alerts on phone

See [marketing.md](marketing.md) for the full playbook.

---

## Post-Launch (Ongoing)

### Daily for first 2 weeks

- [ ] Check Sentry every morning, fix top error
- [ ] Reply to every Reddit/HN/PH/X comment within 24 hrs
- [ ] DM 5-10 indie hackers / job-seekers with personal note + invite
- [ ] Post one "building in public" tweet — share metric or screenshot

### Weekly

- [ ] Review funnel in Umami: where do people drop?
- [ ] Top 3 user-reported issues → ship a fix
- [ ] Submit to one new directory (BetaList, AlternativeTo, etc.)
- [ ] Post a "weekly update" in r/SaaS or r/IndieHackers

### Monthly

- [ ] Cohort retention analysis: month 1 → month 2 conversion
- [ ] Refresh testimonials with real customer quotes
- [ ] Audit scraper health (LinkedIn changes selectors monthly)
- [ ] Review costs vs revenue, adjust pricing if needed

### Quarterly

- [ ] Plan Pro+ features (auto-apply, salary insights, 1:1 review)
- [ ] Reach out to math/career YouTubers and bloggers
- [ ] Consider HiringCafe-style aggregator partnerships

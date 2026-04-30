# Hirin' Launch Playbook

The high-level "I'm done building, what now?" flow for Hirin'.

Pair this with the per-doc breakdowns in `docs/` and `plan/`. This file is the **strategy** — when to do what, in what order, and why.

---

## Reality check first — your actual blockers

Before "launching," 7 non-negotiable things must ship (some already done):

1. **Dodo Payments subscription flow.** ✅ Already shipped — hosted checkout + webhook source-of-truth + `webhookId` idempotency. See [docs/payment.md](docs/payment.md) and [DODO_INTEGRATION_GUIDE.md](DODO_INTEGRATION_GUIDE.md). Verify the webhook endpoint is registered in the Dodo dashboard for both test and live mode.
2. **Dodo live-mode KYC.** Submit business verification in the Dodo dashboard (1-3 business days). Live API key + live webhook endpoint must be set on Vercel before launch.
3. **Email custom domain.** `onboarding@resend.dev` lands in spam. Buy `hirin.app`, set DKIM/SPF/DMARC. Takes 24-48h DNS propagation — start NOW.
4. **AI rate limits uncommented.** One abusive Pro user = $X00 Gemini bill.
5. **Production deploy.** Vercel Pro ($20/mo, required for cron > 10s).
6. **Terms / Privacy / Refund / Contact pages.** Dodo requires these for live-mode KYC and links to them from the hosted checkout.
7. **Resume upload validation.** Magic-byte check + 5MB limit. Without it, one bad file OOMs your serverless function.

If any of these aren't done, do them FIRST. Marketing on a broken funnel is worse than no marketing.

---

## The launch sequence

### Week -4 to -3 — Foundation + Domain

Run in parallel (different work streams):

**Engineering (Backend):**

- [x] Dodo Payments hosted checkout + webhook handler (already shipped — see [DODO_INTEGRATION_GUIDE.md](DODO_INTEGRATION_GUIDE.md))
- [ ] Uncomment AI rate limits, add scrape rate limit
- [ ] Resume upload validation
- [ ] Delete `madio-backend-user_accessKeys.csv` (and rotate any keys it had)

**Engineering (DevOps):**

- [ ] Buy `hirin.app` domain
- [ ] Add to Resend, set DKIM/SPF/DMARC (24-48h propagation)
- [ ] Sign up for Dodo Payments, register the webhook endpoint, submit live-mode business verification (1-3 business days)
- [ ] Sign up for Bright Data Web Unlocker if you'll do paid scraping (1-3 days KYC)

**Legal (yes, even for solo):**

- [ ] Write Terms of Service (use Termly.io free generator + customize)
- [ ] Write Privacy Policy (mention resume PII handling + GDPR delete)
- [ ] Write Refund Policy (Dodo enforces what you publish at checkout)
- [ ] Add Contact page with support email

**Marketing prep:**

- [ ] X/Twitter bio: "Building Hirin' — AI job matching from your resume to your inbox. Daily."
- [ ] LinkedIn headline: same
- [ ] Set up Tally waitlist form (free) on the landing page

**Goals this week:**

- Domain bought, DNS propagating
- Dodo live-mode business verification submitted
- Critical security fixes shipped
- Waitlist live

### Week -3 to -2 — Build in Public + Frontend Polish

**Engineering (Frontend):**

- [ ] Rewrite landing hero ([plan/frontend-refactor.md](plan/frontend-refactor.md) Phase 1)
- [ ] Record 20-30 sec demo video
- [ ] Live stats strip
- [ ] Remove fake testimonials
- [ ] Rename `/Onboard` → `/onboard`, type the parsed resume
- [ ] Multi-step parse progress indicator
- [ ] Pricing page: INR/USD toggle, annual toggle

**Marketing:**

- [ ] Post 3-5x/week on X. Every post = build-in-public update + screenshot
- [ ] Sample tweets:
  - "Cosine similarity on resume embeddings actually works embarrassingly well"
  - "First daily digest sent. 5 users. 47 matches. Email open rate: 80%."
  - "Indian devs prefer ₹699 over $9 even though they're equivalent. Pricing is a feeling."
- [ ] Tag 1-2 career creators per week (no DM yet, just reply with helpful comment)
- [ ] Goal: 100+ X followers, 50+ waitlist signups

### Week -2 to -1 — Tests + Polish + Outreach Begins

**Engineering:**

- [ ] Vitest installed, first 10 tests written
- [ ] Playwright installed, 4 critical-path tests
- [ ] GitHub Actions CI gating PRs
- [ ] Sentry captures wired into webhook + cron + AI failures
- [ ] UptimeRobot monitoring `/api/health`
- [ ] All `console.log` → `log` helper
- [ ] Strip remaining `any` types

**Marketing:**

- [ ] Reach out to 5 mid-tier career YouTubers (10K-100K subs)
- [ ] DM template:

  ```
  Hi [Name],

  I built Hirin' (hirin.app) — uses AI to match resumes to jobs across
  6 sources, daily inbox digest. ₹699 / $9 a month for Pro.

  Would love to give you Pro free for 3 months in exchange for honest
  feedback (no expectation of mention). Your subscribers might find it
  useful for their job search content.

  No pressure — happy to send a guest invite link if you want to try it.

  Sanatan
  ```

- [ ] Submit to BetaList, AlternativeTo, There's An AI For That, ProductHunt Alternatives
- [ ] Create Product Hunt maker profile, engage 4+ weeks before launch

### Week -1 — Final Polish + Beta Test

- [ ] Run all P0 test cases ([docs/test-cases.md](docs/test-cases.md))
- [ ] Test full payment flow with real card (refund yourself after)
- [ ] Test webhook delivery (Dodo dashboard "Resend" on a delivered event → handler returns `{ ok: true, duplicate: true }`)
- [ ] Recruit 5-10 beta testers (friends, X followers, r/cscareerquestions DM)
- [ ] Monitor Sentry, fix top 3 errors
- [ ] Compose launch tweet + demo video
- [ ] Compose Show HN post (with comment ready to post immediately as author)
- [ ] Compose Reddit posts for: r/SideProject (Day 1), r/cscareerquestions (Day 3), r/developersIndia (Day 5)
- [ ] Schedule Product Hunt for Wednesday or Thursday midnight PT

### Day 0 — Launch

**Morning (US time):**

1. Final smoke test: signup → resume upload → matches → upgrade → cancel
2. Check Sentry, UptimeRobot, all green
3. Check Dodo live-mode env is set on Vercel: `DODO_PAYMENTS_API_KEY=sk_live_...`, `DODO_PAYMENTS_ENV=live_mode`, `DODO_PAYMENTS_WEBHOOK_KEY=<live whsec>`, `DODO_PRO_PRODUCT_ID=<live product id>`

**Launch tweet (8-10am ET):**

```
After [N] weeks of building solo, I shipped Hirin'.

Upload your resume. AI finds and ranks jobs from 6 sources daily.
Email digest in your inbox.

$9/mo (₹699 in India) — beats LinkedIn Premium ($40) and is friendlier
than Indeed.

Free tier: weekly digest forever.

[demo video]

hirin.app
```

**Then in order (over 3 hours):**

- Post Show HN (Tue-Thu morning ET)
- Post r/SideProject
- LinkedIn post
- Email beta testers + early waitlist
- Cross-post to 3-5 Discord/Slack groups you're in
- DM 30 personal contacts

**For 48 hours:**

- Reply to every comment within 30 minutes (first 6 hrs) and 2 hours (rest)
- Phone on you at all times
- Have UptimeRobot SMS alerts on
- Watch Sentry dashboard

### Day 1-7 — Reddit + Sustained X

- Day 2: r/cscareerquestions post (story-driven, 200-application meta-narrative)
- Day 3: HN follow-up if launch was strong
- Day 4: r/developersIndia post (INR pricing angle)
- Day 5: Career-newsletter outreach (Pragmatic Engineer, Lenny's, smaller ones)
- Day 6-7: r/jobs, r/EntrepreneurRideAlong (build journey)

Continue 1 X post per day with metric updates.

### Week 2 — Content Flywheel

- [ ] Publish blog: "How I built an AI job matcher with Next.js + pgvector + Dodo Payments (MoR)"
- [ ] Cross-post to Dev.to, Medium, Hashnode
- [ ] Submit blog to HN (if launch HN was OK)
- [ ] Long-form YouTube demo (3-5 min, "How to build vector search for jobs")
- [ ] Submit to 21 directories (BetaList, SaaSHub, etc.)
- [ ] DM 5-10 more career creators

### Month 2+ — Sustained Growth

Anytime you hit a milestone, post about it:

- "100 signups in 24 hrs"
- "First paying user (Pro tier)"
- "$100 MRR"
- "1000 jobs matched this week"

Continue:

- Partnership outreach (5-10/week)
- Reply to every email/DM within 24h
- Ship one user-requested feature per week
- Weekly "building in public" tweet

---

## The mental model

You're not doing 50 things. You're doing **4 things in 4 phases:**

1. **Foundation** (weeks -4 to -1): make every surface someone might land on already say the right thing — landing, pricing, payment, email
2. **Warm-up** (weeks -3 to -1): build a small audience that's ready to engage when you launch — X followers, waitlist, beta testers
3. **Launch sprint** (Day 0 + 7 days): coordinated burst across Reddit, HN, PH, X, LinkedIn — reply relentlessly
4. **Flywheel** (Week 2+): keep the algorithm fed, keep the funnel filling, keep shipping

The goal isn't to "go viral." It's to be the kind of product that one career-creator with 50K followers naturally wants to share — and to be ready when they do.

---

## What to do in the next 24 hours

If you want immediate forward motion right now:

1. Buy the domain (`hirin.app` or alternative). Costs $12-30. 30 minutes.
2. Add it to Resend. Set DKIM/SPF/DMARC records. 30 minutes (then wait 24-48h).
3. Sign up for Dodo Payments. Create the Pro product. Submit live-mode business verification. 30 minutes (then wait 1-3 days).
4. Delete `madio-backend-user_accessKeys.csv` from the repo. Rotate any keys in it. 15 minutes.
5. Read [docs/audit.md](docs/audit.md) end-to-end. Make a mental list of the top 5 things scaring you most.

That's the next 2 hours of work. The Dodo Payments migration is already done — tomorrow start on the remaining backend hardening (AI rate limits, resume validation). The rest is just compounding.

---

## Quick command reference

```bash
# Install new deps for production hardening
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
npm init playwright@latest
npm install file-type sanitize-html @types/sanitize-html
npm install @tanstack/react-query
npm install @upstash/qstash  # for signature verification

# Apply schema changes
npx prisma migrate dev --name dodo_payments

# Run tests
npm test
npx playwright test

# Build
npm run build

# Find places that need cleanup
rg "console\.(log|warn|error)" src/ -l
rg "any\b" src/ -l
rg "Onboard" src/ -l
rg "GEMINI_API_KEY" src/ -l
```

---

## Files to read in order

1. `docs/INDEX.md` — overview of all docs
2. `docs/architecture.md` — what exists today
3. `docs/audit.md` — what's broken
4. `docs/security.md` — what to fix first
5. `docs/payment.md` — Dodo Payments setup, webhook contract, and end-to-end flow (paired with the operational [DODO_INTEGRATION_GUIDE.md](DODO_INTEGRATION_GUIDE.md))
6. `docs/pricing.md` + `docs/audience.md` — go-to-market alignment
7. `plan/INDEX.md` → `backend-refactor.md` → `frontend-refactor.md` → `production-hardening.md`
8. `docs/test-cases.md` — gates for "ready to ship"
9. `docs/pre-launch.md` — checklist
10. `docs/marketing.md` — launch playbook detail

This `LAUNCH_PLAYBOOK.md` you're reading is the high-level conductor. The detail is in the docs and plan.

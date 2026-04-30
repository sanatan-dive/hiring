# Refactoring Plan — Index

Three detailed plans covering the full Hirin' codebase refactor. Do in order: backend → frontend → production hardening.

## Order of Execution

### 1. [Backend Refactor](backend-refactor.md)

**Do this first.** Security fixes (Razorpay subscriptions, webhook handler, AI rate limits, resume validation), architecture cleanup (delete duplicates, consolidate rate-limit modules, drop dead Stripe field), SaaS infrastructure (plan gating helper, scraper hardening). Every change mapped to exact files and line numbers.

### 2. [Frontend Refactor](frontend-refactor.md)

**Do this second.** Landing page rewrite (real demo video, live stats, drop fake testimonials), `/onboard` rename + typing fixes, matches page split into smaller components, pricing page INR/USD toggle, profile page subscription management.

### 3. [Production Hardening](production-hardening.md)

**Do this third.** Vitest + Playwright tests, GitHub Actions CI, Sentry source maps, structured logging, Resend domain verification, UptimeRobot, Vercel cron chunking. Takes you from 4/10 to 9/10 production-ready.

## Time Estimate

| Phase            | What                                                               | Effort         |
| ---------------- | ------------------------------------------------------------------ | -------------- |
| Backend Phase 1  | Razorpay subscriptions + webhook + idempotency                     | 1.5 days       |
| Backend Phase 2  | AI rate limits + resume validation + cron hardening                | 1 day          |
| Backend Phase 3  | Code cleanup (duplicates, console.log, types) + plan gating helper | 1 day          |
| Backend Phase 4  | Scraper hardening + per-user job fetching                          | 1-2 days       |
| Frontend Phase 1 | Landing page rewrite + demo video + remove fake testimonials       | 1-2 days       |
| Frontend Phase 2 | Onboarding rename + typing + progress steps                        | 1 day          |
| Frontend Phase 3 | Matches page split + pagination + filters + explanations           | 1-2 days       |
| Frontend Phase 4 | Pricing INR/USD + Profile management                               | 1 day          |
| Production       | Tests, CI, Sentry, structured logging, Resend domain               | 2-3 days       |
| **Total**        |                                                                    | **10-14 days** |

This assumes single dev, full-time focus. Stretch to 3-4 weeks if you're working evenings/weekends.

## Dependency Notes

- Backend Phase 1 (Razorpay subs) **must** be done before any payment-related frontend work
- Resend domain verification (Production phase) takes 24-48 hours of DNS propagation — start it on Day 1 even if you're not done with the rest
- Bright Data / proxy setup for scrapers — sign up early (KYC takes 1-3 days)

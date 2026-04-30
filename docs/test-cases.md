# Test Cases

Priority levels:

- **P0** — Must pass before launch. Failure = broken product, data loss, or security hole.
- **P1** — Should pass before launch. Failure = bad user experience.
- **P2** — Nice to have. Fix post-launch.

---

## Critical Path Tests (P0)

| #   | Test Case                    | Steps                                             | Expected Result                                                                                                               |
| --- | ---------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sign up + Clerk webhook sync | Sign up via Clerk on `/sign-up`                   | User row created in DB via `/api/webhooks/clerk` (Svix-verified), redirected to `/Onboard`                                    |
| 2   | Resume upload (PDF)          | Upload a 1-page PDF on Onboard step 1             | File stored, `Resume.rawText` populated, `embedding` populated (768 floats), `ParsedSkill[]` and `ParsedExperience[]` created |
| 3   | Resume upload (DOCX)         | Upload .docx via mammoth                          | Same result as PDF                                                                                                            |
| 4   | Resume upload (oversized)    | Upload 10MB PDF                                   | 413 error: "Max 5MB"                                                                                                          |
| 5   | Resume upload (wrong type)   | Rename .exe to .pdf and upload                    | 415 error: "Only PDF/DOC/DOCX allowed" (magic-byte validation)                                                                |
| 6   | Onboarding completion        | Complete all 4 steps                              | `/Onboard` redirects to `/matches`, profile shows skills + experience                                                         |
| 7   | First match generation       | New user with embedded resume + cron triggered    | `JobMatch` rows created, top 10 shown on `/matches`, scores between 0 and 1                                                   |
| 8   | Daily digest email           | Trigger `/api/cron/digest` with valid CRON_SECRET | Email sent via Resend, contains top 10 matches, `JobMatch.emailedAt` updated                                                  |
| 9   | Cron auth                    | Hit `/api/cron/digest` without bearer token       | 401 / 403                                                                                                                     |
| 10  | Cron auth (forged)           | Hit `/api/cron/digest` with wrong CRON_SECRET     | 401 / 403                                                                                                                     |
| 11  | Job fetch dedupe             | Fetch jobs twice from same source                 | No duplicate `Job` rows (unique `url` constraint)                                                                             |
| 12  | Vector search results        | Resume mentions "React, Node, Postgres"           | Top match has overlapping tech in description                                                                                 |
| 13  | Match status update          | User clicks "Applied" on a match                  | `JobMatch.status = 'applied'`, `Application` row created with `unique [userId, jobId]`                                        |
| 14  | Bookmark + unbookmark        | Save a job, then unsave                           | Toggle correctly, no duplicate `Bookmark` rows                                                                                |
| 15  | Sign out                     | Click sign out                                    | Redirected to landing, session cleared                                                                                        |

## Payment & Subscription Tests (P0)

| #   | Test Case                                     | Steps                                                       | Expected Result                                                 |
| --- | --------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| 16  | Dodo checkout session creation                | Click "Upgrade Pro"                                         | Dodo checkout session created, browser redirects to checkout URL |
| 17  | Subscription activation via webhook           | Pay test card → Dodo sends `subscription.active`            | DB: `plan=PRO, status=active, currentPeriodEnd` set             |
| 18  | Webhook signature validation                  | Send webhook with bad `webhook-signature` header            | 400, no DB write                                                |
| 19  | Webhook idempotency                           | Replay same webhook (same `webhook-id`) twice               | Second call returns `{ duplicate: true }`, DB unchanged         |
| 20  | Recurring charge                              | Trigger `subscription.renewed` event                        | `currentPeriodEnd` extended by 1 month                          |
| 21  | Cancel subscription                           | User clicks "Cancel" on profile                             | `cancelAtPeriodEnd=true`, plan stays PRO until period end       |
| 22  | Subscription expires                          | `subscription.expired` event after period end               | `plan=FREE, status=expired`, user loses Pro features            |
| 23  | Payment failed                                | `payment.failed` event                                      | Logged; user stays PRO during Dodo's retry/grace window         |
| 24  | INR vs USD pricing                            | Indian user vs US user opens `/pricing`                     | Indian sees localized INR (Dodo Adaptive Pricing), US sees $9/mo |
| 25  | Plan gating: free user clicks AI cover letter | Free plan + click "Generate Cover Letter"                   | 403 with upgrade CTA                                            |
| 26  | Plan gating: free user weekly limit           | Free user fetches jobs 4× in a week                         | 4th call returns 429                                            |
| 27  | Plan gating: pro user daily limit             | Pro user calls AI cover letter 21× in a day                 | 21st call returns 429                                           |

## Security Tests (P0)

| #   | Test Case                            | Steps                                                            | Expected Result                                   |
| --- | ------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------- |
| 28  | Auth on protected routes             | Hit `/api/matches` with no Clerk session                         | 401                                               |
| 29  | IDOR on bookmarks                    | User A tries DELETE `/api/bookmarks/<user_b_bookmark_id>`        | 404 (or 403); not deleted                         |
| 30  | IDOR on application                  | User A tries to GET User B's application                         | 404 / 403                                         |
| 31  | XSS via job description              | Scrape a job with `<script>alert('xss')</script>` in description | Sanitized in `/matches` modal AND in email render |
| 32  | SQL injection via search             | Search query: `'; DROP TABLE jobs;--`                            | Prisma parameterizes — no injection               |
| 33  | Resume PII in logs                   | Upload resume, check Vercel logs                                 | No raw resume text or email in logs               |
| 34  | Webhook replay attack                | Save a real Dodo webhook payload, replay it 1 hour later         | Idempotency check (`webhookId` unique) blocks duplicate processing |
| 35  | Clerk webhook spoofing               | POST to `/api/webhooks/clerk` with bad Svix signature            | 400, no DB write                                  |
| 36  | QStash worker spoofing               | POST to `/api/queue/process-job` without Upstash signature       | 400                                               |
| 37  | Rate limit on payment order creation | Create 11 subscriptions in 1 day                                 | 11th returns 429                                  |
| 38  | Rate limit on AI cover letter        | Pro user calls AI 21× in 1 day                                   | 21st returns 429                                  |
| 39  | Rate limit on scrape                 | Pro user triggers 6 scrapes in 1 day                             | 6th returns 429                                   |

## UI/UX Tests (P0-P1)

| #   | Test Case                          | Steps                                           | Expected Result                                                     | Priority |
| --- | ---------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- | -------- |
| 40  | Mobile landing page                | Open `/` on iPhone Safari                       | Hero readable, CTA visible above fold, no horizontal scroll         | P0       |
| 41  | Mobile onboarding                  | Complete `/Onboard` on Android Chrome           | All 4 steps usable, file picker works, keyboard doesn't cover input | P0       |
| 42  | Mobile matches                     | Open `/matches` on phone                        | Cards stack vertically, modal usable, filters accessible            | P0       |
| 43  | Onboarding skip prevention         | Try to skip step 1 (resume)                     | Cannot proceed; "Resume required" error                             | P0       |
| 44  | Pricing page on mobile             | Open `/pricing` on iPhone                       | All tiers visible, CTAs tappable                                    | P0       |
| 45  | Match score display                | View matches                                    | Shown as "73% match" not `0.7234`; color-coded                      | P1       |
| 46  | Match explanation                  | Hover/tap a match                               | Shows top 3 overlapping signals (skills, location, salary)          | P1       |
| 47  | Hide a match                       | Click "Hide this job"                           | Match removed from view, `status='hidden'` persisted                | P1       |
| 48  | Pagination on /matches             | User has 200+ matches                           | Loads 20 at a time, "Load more" works                               | P1       |
| 49  | Empty state on /matches            | New user before first cron                      | Shows "Your first matches arrive within 24 hours"                   | P1       |
| 50  | Filter by location                 | Apply "Remote only" filter                      | Only remote jobs shown                                              | P1       |
| 51  | Search box debounce                | Type in search box                              | 500ms debounce before query fires                                   | P1       |
| 52  | Browser back/forward in onboarding | Go to step 3, back to step 1, forward to step 3 | State preserved, no duplicate submissions                           | P2       |
| 53  | Keyboard nav in modal              | Tab through JobDetailModal                      | Focus order logical, ESC closes                                     | P2       |
| 54  | Dark mode toggle                   | If dark mode wired                              | Theme persists across reload                                        | P2       |

## Email Tests (P0-P1)

| #   | Test Case                     | Steps                                  | Expected Result                                                                     | Priority |
| --- | ----------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| 55  | Sender domain                 | Receive a digest email                 | From `Hirin <hello@hirin.app>`, NOT `onboarding@resend.dev`                         | P0       |
| 56  | DKIM/SPF authentication       | Inspect email headers                  | `dkim=pass`, `spf=pass`, `dmarc=pass`                                               | P0       |
| 57  | Unsubscribe link              | Click unsubscribe in email             | Lands on `/unsubscribe?token=...`, flips `emailDigestEnabled=false`, no more emails | P0       |
| 58  | `List-Unsubscribe` header     | Inspect raw email                      | Header present and valid                                                            | P0       |
| 59  | One-click unsubscribe         | Gmail's one-click unsubscribe          | Resend processes correctly                                                          | P0       |
| 60  | HTML stripping in description | Job with embedded HTML                 | Email renders text only, no broken markup                                           | P1       |
| 61  | Free vs Pro digest cadence    | Free user (weekly) vs Pro user (daily) | Free gets email Monday only; Pro gets daily                                         | P1       |
| 62  | Email failure logged          | Resend returns 500 for one user        | Sentry captures error, cron continues for others                                    | P1       |
| 63  | No email if no new matches    | User has zero unemailed matches        | No empty email sent                                                                 | P1       |
| 64  | Personalization               | Email starts with user's first name    | "Hi Sanatan, here are your matches today..."                                        | P2       |

## Job Fetching & Scraping Tests (P0-P1)

| #   | Test Case                   | Steps                                 | Expected Result                                                                       | Priority |
| --- | --------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- | -------- |
| 65  | Adzuna fetch                | Trigger fetch with valid API key      | Jobs returned, embedded, persisted                                                    | P0       |
| 66  | Adzuna fetch (key missing)  | Run fetch with no `ADZUNA_API_KEY`    | Logs warning, falls back to other sources, no crash                                   | P0       |
| 67  | JSearch fetch               | Trigger fetch with valid RapidAPI key | Jobs returned, embedded, persisted                                                    | P0       |
| 68  | RemoteOK fetch              | Trigger fetch (no auth needed)        | Jobs returned                                                                         | P0       |
| 69  | LinkedIn paste-URL scrape   | Pro user pastes LinkedIn job URL      | Single job scraped, embedded, persisted                                               | P1       |
| 70  | LinkedIn search scrape      | Pro user runs deep search scrape      | Async via QStash → worker → 10-25 jobs persisted                                      | P1       |
| 71  | Indeed scrape (Cloudflare)  | Trigger Indeed scrape                 | Either succeeds via unblocker OR returns clear "Indeed temporarily unavailable" error | P1       |
| 72  | Cron `/api/cron/jobs`       | Trigger daily fetch                   | Pulls from all enabled sources, dedupe by URL hash, persists                          | P0       |
| 73  | Job dedupe across UTM tags  | Same job URL with `?utm_source=...`   | Treated as duplicate (hash on title+company+location), not 2 rows                     | P1       |
| 74  | Embedding fails for one job | Gemini API errors mid-batch           | That job skipped, others persist, error logged to Sentry                              | P1       |

## Resilience & Error Handling (P1-P2)

| #   | Test Case                   | Steps                                             | Expected Result                                           | Priority |
| --- | --------------------------- | ------------------------------------------------- | --------------------------------------------------------- | -------- |
| 75  | DB down                     | Stop Postgres, hit `/api/matches`                 | 503, no crash                                             | P1       |
| 76  | Redis down                  | Stop Upstash Redis, trigger rate-limited endpoint | Fail open or 503, configurable                            | P1       |
| 77  | Resend down                 | Resend returns 500                                | Cron logs to Sentry, retries once, then continues         | P1       |
| 78  | Dodo down                   | Dodo API returns 503                              | Pricing page shows "Payments temporarily unavailable"     | P1       |
| 79  | Gemini quota exceeded       | API returns 429                                   | Cover letter modal shows "Try again in a few minutes"     | P1       |
| 80  | Cron timeout                | 5000 users, cron > 60s                            | Function chunked or queued via QStash, no silent failures | P0       |
| 81  | Concurrent webhook delivery | Dodo sends 2 events at same instant               | DB transactions ordered correctly via `updated_at` check  | P1       |

## Account & Data Tests (P0-P1)

| #   | Test Case                | Steps                                        | Expected Result                                                                                    | Priority |
| --- | ------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| 82  | Delete account           | Click "Delete account" on profile            | All resumes, embeddings, matches, applications, bookmarks deleted via cascade                      | P0       |
| 83  | Re-upload resume         | Replace existing resume                      | Old `Resume` row cascade-deleted with `ParsedSkill`, `ParsedExperience`. New embedding regenerated | P0       |
| 84  | Re-onboard               | Go through `/Onboard` again as existing user | Updates existing rows, doesn't create duplicates                                                   | P1       |
| 85  | Concurrent resume upload | User uploads twice rapidly                   | Last-write-wins or first-success, no race                                                          | P1       |

---

## Test Summary

| Priority  | Count  | Status                    |
| --------- | ------ | ------------------------- |
| P0        | 47     | Must pass before launch   |
| P1        | 28     | Should pass before launch |
| P2        | 10     | Fix post-launch           |
| **Total** | **85** |                           |

---

## How to Run These

Currently **zero tests exist**. See [plan/production-hardening.md](../plan/production-hardening.md) for setting up:

- **Vitest** for unit tests (services, lib/, helpers)
- **Playwright** for e2e (`/sign-up` → `/Onboard` → `/matches` flow)
- **MSW** for mocking external APIs (Adzuna, Dodo Payments, Resend)

Minimum CI gate before merging to main:

```yaml
- npm run typecheck
- npm run lint
- npm run test # Vitest unit tests
- npm run test:e2e # Playwright critical path
```

The first 15 P0 tests (critical path) are non-negotiable for launch.

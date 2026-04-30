# Hirin' Runbook

Operational reference: how to deploy, rotate secrets, debug production
incidents, and recover from common failures.

---

## Deploy

| Branch | Auto-deploys to | Notes |
|---|---|---|
| `main` | Vercel production (https://hirin.app) | Trigger: push to main |
| `feat/*` | Vercel preview URLs | Trigger: push to branch + open PR |

### Manual deploy

```bash
git push origin main          # Vercel rebuilds + deploys
```

### Rollback

```bash
# In Vercel dashboard → Deployments → click the previous green deploy
# → "Promote to production"
# OR via CLI:
vercel rollback <deployment-url>
```

---

## Required environment variables

| Var | Required | Used in | What |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Prisma | Neon Postgres connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk client | Public auth key |
| `CLERK_SECRET_KEY` | ✅ | Clerk server | Server auth key |
| `CLERK_WEBHOOK_SECRET` | ✅ | `/api/webhooks/clerk` | Svix signing key |
| `GOOGLE_API_KEY` | ✅ | `@/lib/ai/google` | Gemini API key for embeddings + AI |
| `RESEND_API_KEY` | ✅ | `@/services/email.service` | Resend API |
| `EMAIL_FROM` | recommend | digest emails | `Hirin <hello@hirin.app>` once domain verified |
| `DODO_PAYMENTS_API_KEY` | ✅ for payments | Dodo client | `sk_live_*` |
| `DODO_PAYMENTS_WEBHOOK_KEY` | ✅ for payments | `/api/webhooks/dodo` | Standard Webhooks signing key |
| `DODO_PAYMENTS_ENV` | ✅ for payments | Dodo client | `live_mode` or `test_mode` |
| `DODO_PRO_PRODUCT_ID` | ✅ for payments | checkout creation | From Dodo dashboard |
| `ADZUNA_APP_ID` + `ADZUNA_API_KEY` | optional | job fetch | Otherwise Adzuna disabled |
| `JSEARCH_API_KEY` | optional | job fetch | RapidAPI key, otherwise JSearch disabled |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | ✅ | rate limiting | Both required |
| `QSTASH_TOKEN` | optional | deep scrape queue | Otherwise scrapes run synchronously locally |
| `QSTASH_CURRENT_SIGNING_KEY` + `QSTASH_NEXT_SIGNING_KEY` | ✅ if QStash | webhook verify | Both required |
| `CRON_SECRET` | ✅ | cron auth fallback | For manual cron triggers (Vercel sets `x-vercel-cron` automatically) |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | Sentry init | Without it, Sentry is disabled entirely |
| `SENTRY_AUTH_TOKEN` | optional | source-map upload | Without it, build still succeeds (no maps uploaded) |
| `SENTRY_ORG` + `SENTRY_PROJECT` | ✅ if Sentry DSN | source-map upload | Org/project slug |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | optional | analytics | Without it, `<script>` not injected |
| `NEXT_PUBLIC_APP_URL` | ✅ | many places | E.g. `https://hirin.app`. Used in checkout return URL, unsubscribe URL, OG canonical |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | optional | `/contact` page | Defaults to `support@hirin.app` |

---

## Common operations

### Manually trigger the daily job-fetch cron

```bash
curl -X GET "https://hirin.app/api/cron/jobs" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Returns `{ count, failures, plan }`. The `plan` shows which (query, location)
pairs were fetched per-user.

### Manually trigger the digest email cron

```bash
curl -X GET "https://hirin.app/api/cron/digest" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Returns `{ usersSeen, usersEligible, emailsSent, errors }`.

### Test the webhook signing

Send a Razorpay-style replay from Dodo dashboard → Webhooks → your endpoint
→ "Send test event". The handler should respond `200 { ok: true }` first
time and `200 { duplicate: true }` on replay.

### Force-resync a single user's matches

```sql
DELETE FROM job_matches WHERE "userId" = '<user_id>';
-- Then trigger the next digest cron — matches will regenerate
```

### Reset a user's email digest opt-out

```sql
UPDATE users SET email_digest_enabled = true WHERE email = '...';
```

### Bulk-clean stale jobs (> 30 days)

```sql
DELETE FROM jobs
WHERE "scrapedAt" < NOW() - INTERVAL '30 days'
  AND id NOT IN (SELECT "jobId" FROM applications)
  AND id NOT IN (SELECT "jobId" FROM bookmarks);
```

---

## Incident response

### "Daily digest didn't go out"

1. Check Sentry for recent `digest user failed` errors
2. Check Resend dashboard → Domains → ensure DKIM/SPF/DMARC still pass
3. Check `subscription_events` table for any unprocessed Dodo events that
   might have left users in a stuck state
4. Manually trigger: `curl /api/cron/digest -H "Authorization: Bearer $CRON_SECRET"`
5. Inspect response: if `usersEligible: 0`, check `email_digest_enabled`
   flag is set + frequency gate (Mondays only for free)

### "Payments succeeded but user still on free"

1. Find the Dodo subscription event in dashboard → Webhooks → recent
2. Click "Resend" — our handler should re-process
3. If still stuck, check `subscription_events` table — was the `webhook_id`
   recorded? If yes, idempotency blocked it; check the Subscription row
   manually
4. Last resort: manually update the Subscription row:

```sql
UPDATE subscriptions
SET plan = 'PRO',
    status = 'active',
    "current_period_end" = NOW() + INTERVAL '30 days',
    "dodo_subscription_id" = '<from-dodo-dashboard>'
WHERE "userId" = '<user_id>';
```

### "Scraper started failing"

1. Check Sentry for `scrapeLinkedInJobUrl failed` errors with frequency
2. LinkedIn changed their selectors — open the scraper file, update them
3. Quick mitigation: disable the source temporarily by removing it from
   `PLAN_LIMITS.PRO.apiSources` (in `subscription.service.ts`)
4. Long-term fix: switch to Bright Data Web Unlocker (requires sign-up)

### "Vercel build failing"

1. Check `gh run view <run-id>` for the GitHub Actions error if applicable
2. Most common: missing env var (Sentry, DATABASE_URL placeholder for build)
3. Sentry source-map upload failing → ensure `SENTRY_AUTH_TOKEN` is set
   in Vercel env (or unset all Sentry vars to disable entirely)

### "Rate limit cluster down"

If Upstash Redis goes down:

1. Errors will surface in the rate-limited routes
2. By default `@upstash/ratelimit` fails CLOSED — users see 429
3. To fail open, edit `src/lib/ratelimit.ts` and add `analytics: false,
   ephemeralCache: new Map()`
4. Re-deploy

---

## Secret rotation

When a key leaks (committed to git, shared in error log, etc.):

1. **Generate new key** in the relevant dashboard (Clerk / Resend / Dodo / etc.)
2. **Update Vercel env** — production deploy automatically restarts
3. **Verify** with a test request
4. **Revoke old key** in the dashboard
5. **Audit git history**: `git log -p | grep <leaked-key>` — if found,
   force-push a redacted history (carefully) and rotate every key that
   was in the same commit

---

## Backups

Neon takes automated point-in-time backups (free tier: 7 days, paid: 30+).

**Restore drill** (do this once before launch):

1. Neon dashboard → Branches → "Branch from point in time" → 24h ago
2. Connect to the branch via psql, run a sanity SELECT
3. If clean: revert (no need to swap into prod, just confirm it works)

**Manual export**:

```bash
pg_dump $DATABASE_URL > hirin-$(date +%Y%m%d).sql
```

---

## Useful queries

### Top match scores in the last week

```sql
SELECT u.email, j.title, j.company, jm.score
FROM job_matches jm
JOIN users u ON u.id = jm."userId"
JOIN jobs j ON j.id = jm."jobId"
WHERE jm."createdAt" > NOW() - INTERVAL '7 days'
ORDER BY jm.score DESC
LIMIT 20;
```

### Daily new signups

```sql
SELECT DATE("createdAt") as day, COUNT(*) as signups
FROM users
WHERE "createdAt" > NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;
```

### Free → Pro conversion rate

```sql
SELECT
  COUNT(*) FILTER (WHERE s.plan = 'PRO' AND s.status = 'active') AS pro,
  COUNT(*) FILTER (WHERE s.plan = 'FREE' OR s.plan IS NULL)        AS free,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE s.plan = 'PRO' AND s.status = 'active')
    / NULLIF(COUNT(*), 0), 2
  ) AS pct_pro
FROM users u
LEFT JOIN subscriptions s ON s."userId" = u.id;
```

### Scraper health (jobs added per source per day)

```sql
SELECT
  DATE("scrapedAt") AS day,
  source,
  COUNT(*) AS jobs
FROM jobs
WHERE "scrapedAt" > NOW() - INTERVAL '7 days'
GROUP BY day, source
ORDER BY day DESC, source;
```

If any source drops to zero for 2+ days, it's broken.

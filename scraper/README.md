# Hirin Scraper Service

A standalone Playwright microservice. Lives outside Vercel because Vercel functions don't ship with Chromium and cold-starts make Playwright unstable on serverless.

## Deploy to Railway

1. `cd scraper`
2. Create a Railway project: `railway login && railway init` (choose "Empty Project")
3. Link this directory: `railway link`
4. Set env vars in the Railway dashboard:
   - `SCRAPER_AUTH_TOKEN` — long random string; shared with the Next.js app's `SCRAPER_AUTH_TOKEN` env
   - `CALLBACK_URL` — `https://hirin.app/api/webhooks/scraper-callback`
   - `CALLBACK_SECRET` — long random string; shared with the Next.js app's `SCRAPER_CALLBACK_SECRET` env
5. Deploy: `railway up`
6. Note the public URL (e.g. `https://hirin-scraper.up.railway.app`) and set `SCRAPER_URL=<that>` in the Next.js app's env.

## Local dev

```bash
npm install
npm run dev
```

POST a job to `http://localhost:3001/scrape` with `Authorization: Bearer <SCRAPER_AUTH_TOKEN>`:

```json
{
  "url": "https://www.linkedin.com/jobs/view/1234567890",
  "jobRequestId": "test-1",
  "userId": "user_abc"
}
```

## How the Next.js app calls it

The Next.js app's `/api/jobs/scrape` route enqueues a QStash message that hits this service. This service responds 202 immediately, scrapes asynchronously, and POSTs the result to `/api/webhooks/scraper-callback` (HMAC-signed).

That route is implemented in `src/app/api/webhooks/scraper-callback/route.ts` (created in the same overnight pass).

## Endpoints

- `GET /health` — `{ ok: true, ts: ... }`
- `POST /scrape` — auth required, body `{ url, jobRequestId, userId }`. Returns 202.

## Failure modes

- **Bad URL** → 400 with Zod error details.
- **Bad auth** → 401.
- **Browser crash / timeout** → 200 (already returned 202) but callback fires with `{ result: null, error: "..." }`.
- **Callback URL down** → logged, message lost. Add a queue / retry layer if this becomes a real issue.

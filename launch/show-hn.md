# Show HN

**Title:** `Show HN: Hirin – AI-matched jobs in your inbox, daily`

**URL:** `https://hirin.app`

**First comment** (post immediately as author, within 30 seconds of submitting):

```
Hi HN! I built Hirin because the existing job boards optimize for recruiter
discovery, not job-seeker fit. So I'm sending 100s of applications and
hearing back from 4. I figured the matching algo was the problem.

Vector embeddings on the resume + every job description (Gemini's
text-embedding-004), cosine similarity, top 10 mailed daily. It's actually
shockingly more relevant than keyword search — 80%+ similarity scores really
do correlate with "yes I'd apply to that."

Stack: Next.js 15 + Postgres with pgvector + Clerk + Gemini. Daily Vercel
cron pulls from 6 APIs (Adzuna, JSearch, RemoteOK, WeWorkRemotely + 2
scrapers), dedupes by sha256(title|company|location), embeds each new
listing, then matches per-user via cosine similarity. The cron iterates
JobPreferences in chunks (≤25 unique queries to stay inside free-tier API
quotas).

Dodo Payments (merchant-of-record) for billing — Indian founder targeting
global, and Dodo handles the tax compliance. $9/mo Pro, weekly digest free
forever.

Honest about the limits:
 - LinkedIn / Indeed are paste-URL only — bulk scraping is a legal grey
   zone and breaks weekly when they change selectors
 - Match quality depends on resume quality (garbage in → garbage out)
 - AI cover letters are good, not magical — 5 min of editing still required

Would love feedback on:
 - vector matching accuracy in your specific niche (do non-tech roles
   embed well?)
 - pricing sweet spot for non-US/non-India markets
 - what other sources to add — what would 10x your job search?

Source is currently closed but happy to chat about the architecture in the
comments.
```

## HN engagement playbook

- **First 2 hours**: reply to every comment within 5-15 minutes. Even a
  short "thanks for trying it!" beats silence.
- **Honest about flaws**: HN respects "yes that's broken, here's why" more
  than defensive answers.
- **Avoid marketing phrases**: "revolutionary AI", "10x", "game-changing"
  → instant downvote.
- **Show technical depth in replies**: if someone asks about embedding
  dimensionality, give the actual answer (768 dims for text-embedding-004).
- **Don't argue with commenters**: even when they're wrong, "fair point,
  let me look at that" wins more upvotes than being right.

## What to monitor

- HN front page rank (refresh every 5-10 min for first hour)
- Click-through to hirin.app (Umami referrer breakdown)
- Sign-up conversion from HN traffic specifically

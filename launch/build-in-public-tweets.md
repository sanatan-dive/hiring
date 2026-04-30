# Build-in-Public Tweets

Pre-launch warm-up content. Post 3-5 of these per week from now until
launch day. Goal: build a small audience that's primed to engage when
you launch.

## Tweet bank (rotate these)

### Progress / metrics

```
Day 1 of building Hirin. Vector embeddings on resumes actually work
shockingly well. Cosine similarity > keyword search every time.

Excited to ship.
```

```
First user got matched to a job they actually applied to.

This is the moment every solo SaaS founder remembers.

[redacted screenshot]
```

```
Weekly stats:
— 47 new signups
— 312 daily digest emails sent
— 2,341 jobs scraped, 14 duplicates collapsed
— 1 paid Pro user

Slow and steady > fast and broken.
```

### Tech wins

```
Postgres + pgvector for AI job matching. 200ms cosine similarity over
12K job embeddings.

Why I love this stack: vectors, full-text search, ACID transactions, all
in one Neon-hosted Postgres. No separate Pinecone, no separate
Elasticsearch.
```

```
Today I migrated from Razorpay to Dodo Payments.

Razorpay needed manual GST + tax filing. Dodo is merchant-of-record =
they handle global tax for me.

Higher fees (4% vs 2%) but I get back 10 hours/month of compliance.
Worth it.
```

```
Refactored matches/page.tsx from 642 lines into 6 focused components +
a hook.

Original was unmaintainable. Now changing one thing doesn't break three.

The boring stuff matters.
```

### Failure / lessons

```
Tried bulk-scraping LinkedIn job search.

Got IP-banned in 4 hours.

Pivoted to "user pastes a LinkedIn URL, we scrape that one page". Lower
volume, lower legal risk, much more reliable.

Sometimes the constraint is the feature.
```

```
First Vercel deploy failed.

Sentry source-map upload required SENTRY_AUTH_TOKEN that I hadn't set.

Fix: gate the upload on the token's presence. Build now succeeds even
without Sentry configured.

Defensive defaults > "should work in production".
```

### Behind-the-scenes

```
The full Hirin stack:

Frontend: Next.js 15, Tailwind, Framer Motion
Auth: Clerk
DB: Postgres on Neon (with pgvector)
AI: Gemini text-embedding-004 + 2.0 Pro
Email: Resend (with custom domain)
Payments: Dodo (merchant of record)
Queue: Upstash QStash
Cache/RL: Upstash Redis
Errors: Sentry
Analytics: Umami
```

```
What scrapers actually look like in 2026:

— Rotate user agents per request
— Randomize viewport sizes
— Set en-US locale
— Random delays between actions
— Run on residential IPs (Bright Data) for production scale
— Always have a fallback when selectors break

It's an arms race. Expect monthly maintenance.
```

### CTA / waitlist nudge

```
Hirin' launches in [N] weeks.

Resume in. AI ranks jobs from 6 sources daily. Inbox digest. $9/mo Pro,
free forever tier.

Waitlist: hirin.app — first 100 get a free Pro month.
```

## Post cadence

- Mon/Wed/Fri = progress / metric tweet
- Tue/Thu = tech win or learning
- Weekend = behind-the-scenes / personal

## Tag wisely

- Once or twice a week tag relevant accounts (@gergelyorosz, @SaraPMcKenna)
- Use #buildinpublic, #indiehackers, #saas, #careersearch
- Don't spam — algorithm penalizes link-heavy + tag-heavy posts

# r/SideProject

Most permissive sub for self-promo — they expect it. Day 1 of launch.

## Title

```
Hirin' — AI matches your resume to jobs from 6 sources, daily inbox digest
```

## Body

```
What it is: you upload your resume, we use Gemini to generate a vector
embedding, then match it against jobs scraped from Adzuna, JSearch, RemoteOK,
WeWorkRemotely, plus optional LinkedIn paste-URL scrapes. Daily email digest
with the top 10.

Why I built it: was tired of scrolling LinkedIn and Indeed showing me the
same 100 jobs every search, none of them right.

Free tier: weekly digest, 1 resume, 5 active applications, 7-day history
Pro ($9/mo, ₹699 in India): daily digest, 3 resumes, AI cover letter, AI
interview prep, unlimited tracker

Stack: Next.js 15 + Postgres with pgvector + Clerk + Gemini + Dodo
Payments + Resend + Upstash + Sentry

Live: https://hirin.app

Honest open questions for fellow builders:
 - I'm worried about scraper sustainability (LinkedIn changes selectors
   monthly). Anyone solved this elegantly?
 - Email digest as a primary loop — does this work past the honeymoon
   period or do users tune it out?
 - Pricing: $9/mo for global, ₹699 for India. Should I also do annual
   ($86 = save 20%) or wait until I have signal?

Feedback welcome.
```

## Comment plan

- "What does the AI do exactly?" → Explain text-embedding-004, cosine
  similarity, why it beats keyword search
- "How do you handle LinkedIn?" → Be honest about the legal grey zone,
  explain paste-URL only flow
- "Why not Stripe?" → Indian founder, Dodo handles tax/global cards,
  Stripe doesn't onboard Indian businesses easily
- "Is this open source?" → "Closed for now, may open core later" (or
  whatever your actual plan is)

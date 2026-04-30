# Product Hunt Launch

## Tagline (60 chars)

`AI-matched jobs in your inbox. Daily.`

## Description (260 chars)

```
Stop scrolling job boards. Upload your resume, and Hirin uses AI to match
it against jobs from 6 sources (LinkedIn, Indeed, Adzuna, JSearch, RemoteOK,
WeWorkRemotely). Daily digest of the top 10 matches in your inbox. Free
forever. $9/mo Pro.
```

## Topics

- AI
- Productivity
- Career
- Job Search
- SaaS

## Maker Comment (post immediately when launch goes live)

```
Hey Product Hunt! I'm Sanatan, and I built Hirin because I was tired of
sending 200 applications and getting 4 callbacks. The boards weren't
matching me to actually relevant roles.

The fix: vector embeddings. Gemini's text-embedding-004 generates a
768-dimensional embedding of your resume; same for every job we scrape.
Cosine similarity ranks the top 10 each day, delivered to your inbox.

What's in it:
 ✓ Daily AI-ranked digest (or weekly on free)
 ✓ 6 sources: Adzuna, JSearch, RemoteOK, WeWorkRemotely + Pro-only
   LinkedIn paste-URL scrapes
 ✓ AI cover letter + AI interview prep (Pro)
 ✓ Application tracker
 ✓ "Why this match?" panel showing skill/location/salary overlap

Free forever: weekly digest, 1 resume, 5 active applications.
Pro $9/mo (₹699 in India): everything daily, 3 resumes, all AI features.

Built solo over [N] weeks. Stack: Next.js 15 + Postgres+pgvector + Clerk
auth + Gemini AI + Dodo Payments + Resend + Upstash + Sentry. CI on
GitHub Actions, source maps to Sentry on every deploy.

This is my first SaaS launch. I'd love feedback on:
 - Match quality in your specific industry/role
 - The Pro features that would make you upgrade vs ones that miss
 - Pricing — does $9 feel right for what you get?

Free Pro for the first 25 hunters who comment what role they're searching.

Thanks for trying it!
```

## Assets to upload

| File | Spec | What |
|---|---|---|
| Logo | 240×240 PNG | Hirin H mark on dark background |
| Gallery 1 | 1270×760 | Landing page hero with "Stop scrolling" headline |
| Gallery 2 | 1270×760 | Matches dashboard with filter chips + match scores |
| Gallery 3 | 1270×760 | Email digest screenshot |
| Gallery 4 | 1270×760 | Why-this-match panel close-up |
| Gallery 5 | 1270×760 | AI cover letter modal |
| Gallery 6 | 1270×760 | Pricing page |
| Demo video | < 90s | Sign up → resume upload → first email arriving |

## Launch day timing

- **Midnight PT (12:30pm IST)** — Schedule launch
- **First 6 hours critical** — target 200+ upvotes, 30+ comments
- **DM 30 friends** with personalized note (not copy-paste)
- **Reply to every comment within 30 min**
- **Don't say "please upvote"** — PH algo penalizes this
- **Have someone in EU + US time zone supporting you** so coverage doesn't
  drop while you sleep

## Hunters to DM (in advance, not day-of)

Look for hunters who recently launched career/AI/productivity products.
Ask politely if they'd hunt yours. Don't spam.

## Post-launch

- Day 1 end-of-day: post a "what we learned" thread on X
- Week 1: write a Dev.to retrospective
- Resubmit to relevant directories (BetaList, AlternativeTo, There's An AI For That)

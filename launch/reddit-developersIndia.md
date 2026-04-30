# r/developersIndia

Strong sub for Indian dev audience. INR pricing is your hook.

## Title

```
Built an AI job matcher — ₹699/mo for Indian devs, supports international remote roles
```

## Body

```
TL;DR: hirin.app — upload resume, AI matches against jobs from 6 sources,
daily inbox digest. Free tier weekly, Pro ₹699/mo daily. UPI works.

Why I built it: spent 4 months on Naukri/LinkedIn/Indeed when switching
roles last year. Got 80% irrelevant matches. The good roles came from
referrals, not platforms.

How it actually works:
 1. Upload your resume → Gemini parses skills + experience, generates a
    768-dim vector embedding
 2. Daily cron scrapes Adzuna (which has good India coverage), JSearch,
    RemoteOK (so many international remote roles), WeWorkRemotely
 3. Cosine similarity ranks jobs against your resume embedding
 4. Top 10 matches in your inbox at 9am IST every day

Why this is better than what's out there:
 - No "10000 jobs found" with 50 actually relevant
 - Cross-platform — you don't have to log into 5 sites
 - Vector matching > keyword matching for transferable skills (e.g.
   "React developer" still matches roles that say "frontend engineer")
 - International remote jobs surface naturally — you don't have to
   filter by company size or location

Pricing:
 - Free: weekly digest, 1 resume, 5 active applications
 - Pro ₹699/mo: daily digest, 3 resumes, AI cover letter, AI interview
   prep, unlimited tracking, LinkedIn URL scrapes

Built with Next.js, Postgres + pgvector, Gemini API, Dodo Payments.

Looking for beta testers from this sub. Comment what kind of role
you're hunting and I'll DM a free Pro month.

Roast it.
```

## Why this works for r/developersIndia

- **INR pricing up front** — no $9 USD that requires mental math
- **Naukri reference** — establishes credibility (you've used the local
  alternatives)
- **International remote angle** — high desirability for this audience
- **UPI mention** — payment friction killer
- **Beta tester offer** — gives commenters a reason to engage

## Common questions to be ready for

- "Why not just use Naukri?" → Naukri is great for India-only roles, but
  for remote international jobs Adzuna/RemoteOK have better coverage. We
  aggregate both.
- "FAANG referrals/leetcode questions?" → That's not what this is for.
  This finds you the role; you still have to interview.
- "How is this different from Cutshort?" → Cutshort is recruiter-driven
  (companies post). We aggregate from public sources + your resume drives
  matching.
- "Refund policy?" → 14-day if you don't use Pro features. /refund page
  has details.

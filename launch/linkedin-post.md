# LinkedIn Launch Post

LinkedIn rewards earnestness and length. Don't be afraid to be a little
cringe — it's literally the platform's culture.

## Post

```
After 200 applications and 4 callbacks, I built my own job matcher.

Last year I switched roles. The process was demoralizing — I spent hours
every day scrolling LinkedIn, Indeed, and RemoteOK. The same 100 irrelevant
jobs would show up. The good roles came from people I knew, not the
platforms.

I kept thinking: the algorithm is the problem. These boards optimize for
recruiter discovery, not for me.

So I built Hirin (https://hirin.app).

How it works:
✓ You upload your resume
✓ AI generates a 768-dimensional vector embedding of your skills + experience
✓ Daily cron pulls jobs from 6 sources (Adzuna, JSearch, RemoteOK,
  WeWorkRemotely, plus your LinkedIn paste-URL scrapes)
✓ Cosine similarity ranks the top 10
✓ They land in your inbox at 9am, every day

What changed for me when I started using it:
— I stopped opening LinkedIn job search
— My inbox became my job board
— I had time to actually tailor cover letters because I wasn't scrolling
— I applied to fewer roles, but the right ones

Free tier is weekly digest, 1 resume, 5 active applications.
Pro is $9/mo (₹699 in India): daily digest, 3 resumes, AI cover letter,
AI interview prep, unlimited tracker.

Built with Next.js, Postgres + pgvector, Gemini, Dodo Payments. Solo dev,
12 weeks of nights and weekends.

It launches today. If you're job-hunting (or know someone who is), I'd
love feedback. The first 25 people who message me get free Pro for 3
months.

Roast it. Find the bugs. Tell me what would make this useful for you.

#jobsearch #careersearch #ai #saas #buildinpublic #softwareengineering
```

## Why LinkedIn-specific copy works

- **Long-form is rewarded** — 1500-2500 chars is the sweet spot
- **Personal pain narrative** at the top
- **Bullet checkmarks** — high engagement on LinkedIn
- **Concrete numbers** (200/4, 768-dim, 6 sources, $9/₹699)
- **"Roast it" CTA** — invites comments, which boosts the post in feed
- **Tag yourself with #buildinpublic** — surfaces you to the indie hacker community

## After posting

- Engage with every comment within 1 hour
- Repost it from your work account if you have one (different audience)
- DM 10 connections with personalized "would love your honest feedback"
- Don't repost or boost paid — organic LinkedIn outperforms paid for B2B

## Reply hooks

- "Did you try Naukri/Cutshort/etc?" → Yes, complementary not competing
  (we aggregate, they're recruiter-platforms)
- "Open source?" → Closed for now
- "How does the AI work specifically?" → Brief tech explainer + link to /
- "Can my company use this for our grads?" → Yes, contact me — bulk
  pricing available

# $0 Marketing Playbook

You have no budget. You have a product that solves the most painful, most universal problem on the internet: finding a job. **Job-seeker subreddits and forums are the cheapest, highest-converting places on the planet.** Use them surgically.

---

## The Growth Engine: Daily Email Hits Inbox = Daily Brand Reminder

```
User signs up → Resume parsed → Daily digest hits inbox at 9am
    ↓
User opens email even when not actively searching
    ↓
Brand recall: "Oh right, Hirin found me jobs while I slept"
    ↓
User refers friend who's also job-hunting (everyone has a job-hunting friend)
    ↓
Repeat → compound growth
```

This is how Morning Brew ($75M acquisition) and Substack grew. Email > app. **Make every email so good people forward it.**

The watermark equivalent for Hirin: every email footer says "Want this for free? Try Hirin → hirin.app" with a referral code.

---

## Phase 1: Pre-Launch (4 weeks before)

### Build in Public on X/Twitter

Post 3-5x per week:

- Day 1: "Building an AI job-matching tool. Day 1." + screenshot of empty matches page
- Day 3: "Vector embeddings on resumes are a beautiful thing. Cosine similarity > keyword search." + diagram
- Day 7: "First user got matched to a job they actually applied to. This is the moment." + redacted email
- Ongoing: share progress, scraper wins, funny LLM mistakes

**Hashtags:** #buildinpublic #indiehackers #saas #careers #jobsearch #AI

**Tag:** big career-influencer accounts occasionally — @gergelyorosz (Pragmatic Engineer), @SaraPMcKenna (Career Code), @lennysan (Lenny's Newsletter). Even one repost = thousands of impressions.

### Build a Waitlist

- Tally form (free) on landing page
- Goal: 400+ signups before Product Hunt launch (3-5x more likely to hit top 5)
- Convert waitlist to free signups week of launch

### Create a Product Hunt Maker Profile

- Sign up, complete profile with real photo + bio
- Engage on PH for 4+ weeks: upvote, comment, read launches
- Don't just lurk — comment thoughtfully on 3-5 launches per week
- Builds algorithm credibility before your launch

### Soft Launch to Inner Circle

Week -2: post in your personal LinkedIn + WhatsApp circles. Friends, ex-colleagues, college groups. Goal: 20-30 free signups before public launch. They become your testimonial pool.

---

## Phase 2: Reddit Strategy

### Target Subreddits (ordered by conversion potential)

| Subreddit               | Size  | Post Angle                                                                                 | Notes                                                     |
| ----------------------- | ----- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| r/cscareerquestions     | ~1.4M | "I built a tool that emails me daily AI-matched jobs"                                      | **Your goldmine.** SWE job seekers, willing to pay $9/mo. |
| r/jobs                  | ~3.2M | "Tired of LinkedIn algorithm — built my own job aggregator"                                | Wider audience, lower paying-conversion but high volume   |
| r/SideProject           | ~250K | "Hirin' — AI matches resume to jobs across 6 sources, daily digest"                        | Standard launch post, expected self-promo                 |
| r/SaaS                  | ~50K  | "Launched a $9/mo job matching SaaS — Day 1 lessons"                                       | Journey post, share metrics                               |
| r/EngineeringResumes    | ~210K | "Built a tool that matches your resume to jobs — beta tester needed"                       | High intent, exact ICP                                    |
| r/recruitinghell        | ~900K | "After 200 applications I built my own matching tool"                                      | Story-driven, narrative resonates                         |
| r/IndiaJobSeeker        | ~50K  | "Job aggregator for Indian developers — INR pricing"                                       | Regional, less competition                                |
| r/developersIndia       | ~600K | "Built a job-matching tool, ₹699/mo for Indian devs"                                       | Price localization angle                                  |
| r/EntrepreneurRideAlong | ~250K | "Trying to bootstrap a job-matching SaaS to $1K MRR — follow along"                        | Build-in-public format                                    |
| r/forhire / r/freelance | ~250K | Mention as a tool freelancers can use to find contract work                                | Soft mention only                                         |
| r/remotework            | ~140K | "Tool I built to find remote jobs across RemoteOK + WeWorkRemotely + Adzuna in one digest" | Remote angle                                              |
| r/learnprogramming      | ~4M   | Don't promote here directly — comment helpfully on resume threads, link in profile         | Long game                                                 |
| r/cscareerquestionsEU   | ~110K | EU job-search angle, mention Adzuna EU coverage                                            | Regional                                                  |
| r/careerguidance        | ~3M   | Story-driven post about your job search experience                                         | Soft sell                                                 |

### Reddit Rules (Will Get You Banned If Ignored)

1. **Don't post to more than 2 subreddits per day.** Space over 2-3 weeks.
2. **Never say "check out my product."** Tell a story. The product is incidental.
3. **Karma matters.** Have 500+ karma before launch posts. Spend a week genuinely commenting.
4. **Read each subreddit's rules.** r/cscareerquestions has strict self-promo rules — read them. Wait 90 days from account creation in some.
5. **Reply to every comment within 2 hours.** Reddit rewards engagement.
6. **If a post flops, don't repost.** Try different angle, different sub. Stay >2 weeks between attempts.
7. **Use throwaway accounts at your peril.** Mods detect, brigades happen, domain bans are real and permanent.

### High-Converting Reddit Post Format

```
Title: After 6 months of applying to 200 jobs and hearing back from 4, I built my own AI job matcher

Body:
I'm a [grad / SWE laid off / career switcher]. Spent 6 months on LinkedIn,
Indeed, RemoteOK — applying through job boards that show me 100+ irrelevant
jobs every search.

So I built [Hirin](https://hirin.app) for myself. Upload resume, AI ranks
matches by semantic similarity (not keywords), daily email digest with the
top 10. Pulls from 6 sources so I'm not stuck in LinkedIn's algorithm.

Tech: Next.js + pgvector + Gemini embeddings + Dodo Payments
Free tier: weekly digest, 1 resume
Pro: $9/mo (Dodo handles INR/UPI for India via adaptive pricing), daily digest + AI cover letters

Looking for beta testers. Roast it.
```

That post format hits hard because:

- Personal pain story (everyone relates)
- Concrete numbers (200 jobs, 4 callbacks)
- Tech transparency (devs upvote tech disclosure)
- Self-deprecating ("Roast it") = invites engagement
- Pricing disclosed up-front (no bait)

---

## Phase 3: Product Hunt Launch

### Preparation (4-6 weeks before)

1. **Assets:**
   - Logo (256x256 minimum)
   - 6-8 screenshots: landing, onboarding, matches, email digest, AI cover letter modal, pricing
   - Demo video (under 2 min) — type prompt → animation appears
   - Tagline (60 chars max): "AI-matched jobs in your inbox. Daily."
   - Topics: AI, Productivity, Career, Job Boards

2. **Maker comment** (write in advance):

```
Hey Product Hunt! I'm Sanatan, and I built Hirin' because I was tired of
scrolling through 100 irrelevant jobs every day on LinkedIn.

Hirin' uses vector embeddings (Gemini text-embedding-004) on your resume
and on every job we scrape, then ranks matches by semantic similarity.
You get a daily email with the top 10. We pull from Adzuna, JSearch,
RemoteOK, WeWorkRemotely, and (Pro only) light scrapes of LinkedIn jobs
you paste in.

Free tier: weekly digest, 1 resume, basic tracker.
Pro: $9/mo ($7.20 annual) — daily digest, AI cover letters, AI interview
prep, unlimited tracker. Dodo's adaptive pricing localizes for India (₹).

Built solo over [N] weeks. Dodo Payments for billing — they're merchant
of record so they handle global tax (GST, EU VAT) for me. This is my
first SaaS — I'd love your honest feedback. What jobs would you want to find?
```

### Launch Day

1. **Launch at midnight PT** (PH day starts)
2. **First 6 hours are critical** — 200+ upvotes, 30+ comments
3. **Cross-post simultaneously:**
   - X/Twitter: launch tweet with demo video
   - Reddit: r/SideProject + 1 niche sub (don't blast everywhere day 1)
   - LinkedIn: full post with personal story
   - Discord/Slack groups you're in
   - DM 30 people with personalized note
4. **Reply to every PH comment within 30 minutes**
5. **Don't say "please upvote"** — PH algorithm penalizes this
6. **Have someone in EU + US time zone supporting you** (parents, friends, partner)

---

## Phase 4: Hacker News

### "Show HN" Post

**Title:** "Show HN: Hirin' – AI-matched jobs in your inbox, daily"

**Best time:** Tuesday-Thursday, 8-10am ET

**First comment** (post immediately as author):

```
Hi HN! I built Hirin' because the existing job boards optimize for
recruiter discovery, not job-seeker fit. Vector matching turned out to
work surprisingly well — 80%+ similarity scores actually correlate with
"yes this looks relevant."

Stack: Next.js 15 + Postgres with pgvector + Clerk + Gemini text-embedding-004.
Daily Vercel cron pulls from 6 APIs, dedupes, embeds, then matches against
each user's resume embedding via cosine similarity.

Dodo Payments for billing (merchant-of-record so I don't deal with
global tax compliance). $9/mo Pro, weekly digest free forever.

Honest about limits:
- LinkedIn / Indeed are paste-URL only (compliance concerns with bulk scraping)
- Match quality depends on resume quality (garbage in, garbage out)
- AI cover letters are good, not magical — still need 5 min of editing

Would love feedback on: vector matching accuracy, pricing for non-US/India
markets, what other sources to add.
```

HN loves:

- Technical depth in first comment
- Honest admission of limitations
- Solo founder, real problem
- No marketing buzzwords

HN hates:

- "Revolutionary AI"
- Vague tech stack
- Hidden pricing
- AI features without showing the prompts/output

---

## Phase 5: Content Flywheel (Ongoing)

### YouTube

- 3-5 min demo: "How I built an AI job matcher with Next.js + pgvector"
- Targets developer audience that wants to build similar
- SEO keywords: "vector embeddings tutorial", "job matching AI", "pgvector example"
- Long tail: people search this every day

### TikTok / Reels / Shorts

- 15-30 sec clips: "POV: you upload your resume and 5 minutes later you get matched jobs"
- Show the magic moment (email arriving)
- Job seekers are emotional. These resonate.

### Dev.to / Medium / Hashnode

- "How I built an AI job matcher with Next.js, pgvector, and Dodo Payments" — technical post
- Cross-post everywhere
- Gets indexed by Google for years

### LinkedIn (Underrated)

- LinkedIn has more job seekers than anywhere
- Post 2x/week: stories, screenshots, mini-case-studies
- Tag career coaches and recruiters — they reshare
- Don't be afraid to be cringe — LinkedIn rewards earnestness

### Free Startup Directories

Submit to ALL (2-3 hour batch):
BetaList, AlternativeTo, SaaSHub, G2, Capterra, There's An AI For That, AI Tool Directory, FutureTools, TopAI.tools, ToolPilot.ai, SaaSWorthy, GetApp, Launching Next, StartupStash, BetaPage, F6S, TechPluto, StartupRanking, KillerStartups, StartupBuffer, ProductHunt Alternatives, Indie Hackers Products

### Discord/Slack Communities

Join and participate (genuinely):

- Indie Hackers Slack
- r/cscareerquestions Discord
- Levels.fyi Discord (high-intent SWE audience)
- Tech Twitter Discord clones
- LeetCode discords

Be helpful. Mention Hirin' only when relevant. People notice the helpful person and check their profile.

---

## Phase 6: Partnerships (Month 2+)

### Career Coaches

Reach out to small/mid career coaches (1K-50K followers):

- "I built a tool that auto-finds and ranks jobs from a resume. Want to try it free for 6 months and tell your audience?"
- They share = high-intent traffic
- Start small — coaches with 5-20K LinkedIn followers respond more

### Bootcamps

Coding bootcamps have 500-2000 grads/year, all job hunting at the same time. Contact career services teams:

- "Free Pro for your grads for 90 days"
- They mention you in cohort welcome emails
- Lifetime customer pool

### Career Newsletters

- The Pragmatic Engineer (Gergely Orosz) — too big, but worth a shot
- Lenny's Newsletter — same
- Smaller career newsletters: TechWorld with Milan, Refactoring (Luca Rossi), High Growth Engineer
- Pitch as a "tool worth featuring" not a sponsor (you have no budget)

### r/cscareerquestions Mods

Don't bribe. But if you build something genuinely useful, after 3-6 months of being a known good actor, you might get sticky-thread-ed.

### LinkedIn / Twitter Influencers

Reach out to mid-tier career creators (10K-100K followers):

- "I'd love to give you Pro+ for life in exchange for honest feedback (not a paid post)"
- They post organically when they find something useful
- Way more credible than sponsored posts

---

## Metrics to Track

| Metric                         | Tool               | Target (Month 1)        |
| ------------------------------ | ------------------ | ----------------------- |
| Website visitors               | Umami              | 5,000+                  |
| Signups                        | Clerk dashboard    | 500+                    |
| Resumes uploaded (activation)  | Umami event        | 350+ (70% of signups)   |
| First-match-shown (aha moment) | Umami event        | 280+ (80% of activated) |
| Free → Pro conversion          | Subscription rows  | 5-12%                   |
| MRR                            | Dodo dashboard     | $200-800                |
| Daily email open rate          | Resend dashboard   | 30%+ (industry avg 25%) |
| Click-through to apply         | Job URL clicks     | 15%+                    |

---

## What NOT to Do

1. **Don't buy ads.** At this stage, paid acquisition before product-market fit is burning money. Wait until conversion is proven organic.
2. **Don't hire a marketing agency.** They don't understand your product or ICP. You can't afford one anyway.
3. **Don't spam.** One bad Reddit post = subreddit ban. Many = domain ban.
4. **Don't wait until it's perfect.** Ship at the quality of "embarrassing but functional." Launch with weekly digest only if necessary; ship daily later.
5. **Don't ignore negative feedback.** Every "this missed the job I wanted" is a feature request.
6. **Don't compare yourself to LinkedIn or Simplify.** You're not competing on features. You're competing on **inbox vs. browser tab**. Stay focused.
7. **Don't promise more than you ship.** "AI auto-applies for you" is a Pro+ feature for later. Don't tease it on launch.
8. **Don't copy-paste your launch text across every channel.** Customize tone per audience: HN = technical, Reddit = personal story, LinkedIn = professional, X = punchy.

---

## The One Thing That Changes Everything

All of the above is noise compared to this:

**If one career-coach with 50K+ followers tries Hirin', loves it, and posts about it organically — you get more signups in a day than 30 Reddit posts combined.**

Your strategy should make it easy for one such moment to happen:

1. Build something genuinely useful (vector matching > keyword)
2. Make the daily email so good people forward it
3. Make Pro features feel like a steal at $9 (vs LinkedIn Premium at $40)
4. Reach out to 5-10 micro-creators per week with a real, no-pitch invite

The email is the product. The product is the marketing. The marketing is the network.

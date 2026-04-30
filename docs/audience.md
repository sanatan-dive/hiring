# Target Audience — Who Pays, Who Doesn't

---

## The Brutal Truth About Your Audience

You have four potential audiences. Two will reliably pay you money, one will be your marketing army, one is a long-term play. Here's the breakdown.

---

## Segment 1: Active Job-Switching Software Engineers (YOUR MONEY AUDIENCE #1)

### Profile

- Age: 22-40
- Experience: 1-10 years
- Location: US, EU, India, SE Asia
- Income: Already earning $50K-200K — paying $9/mo is a rounding error
- Use case: "I'm looking, but passively. I want jobs to come to me, not the other way around."
- Where they hang out: r/cscareerquestions, r/ExperiencedDevs, Levels.fyi, LinkedIn, Blind, Tech Twitter

### Will They Pay?

**Yes — this is your primary revenue segment.** A senior engineer paying $9/mo to never miss a relevant role is a no-brainer. The cost of a missed $20K raise dwarfs the subscription.

### What They Need

| Need                                  | Current State               | Required Change                                                    |
| ------------------------------------- | --------------------------- | ------------------------------------------------------------------ |
| High-quality matches (no spam)        | Vector matching ✓           | Tighten — add company filters, role-level filters                  |
| Filter by salary band                 | Backend has it; not exposed | Wire to UI                                                         |
| Filter by company size, funding stage | Not in scrape data          | Add to scraping pipeline (Crunchbase enrichment for Pro+)          |
| Daily but not noisy                   | Daily digest ✓              | Cap at 10 matches even if more found, allow user to set preference |
| LinkedIn integration                  | Manual paste only           | Browser extension to capture saved jobs                            |
| Salary insight ("is $X fair?")        | Not built                   | Levels.fyi-style data overlay (Pro+ feature)                       |
| Mobile-friendly                       | Not yet                     | Responsive `/matches`, eventual native app                         |

### Conversion Path

```
Engineer hears about Hirin from r/cscareerquestions or X
    ↓
Signs up, uploads resume in 2 minutes
    ↓
First weekly digest arrives in 3 days
    ↓
Sees a $200K Senior Backend role they didn't know about
    ↓
Realizes weekly is too slow, upgrades to Pro for daily
    ↓
Pays $9/mo for 6 months while job-hunting
    ↓
Lands a job → cancels OR stays subscribed for "next time"
```

Engineers churn naturally when they get hired. Goal: get them to come back next time they're looking. Annual subscriptions help retain.

### How to Reach

1. **r/cscareerquestions** — story-driven posts (your single highest-conversion channel)
2. **Levels.fyi forums** — high-intent SWE audience
3. **LinkedIn posts** tagged with #careersearch #softwareengineering
4. **Show HN** for technical legitimacy
5. **Career YouTubers** — Travis Media, ForrestKnight, Mayuko (smaller channels respond)

---

## Segment 2: Indian Software Engineers (YOUR MONEY AUDIENCE #2)

### Profile

- Age: 21-32
- Experience: 0-8 years
- Location: India (Bengaluru, Hyderabad, Pune, Delhi NCR, Chennai, remote)
- Income: ₹5L - ₹50L+ INR
- Use case: "I want product-based companies / international remote jobs / better compensation"
- Where they hang out: r/developersIndia, r/IndiaJobSeeker, LinkedIn India, Twitter, LeetCode India Discord

### Will They Pay?

**Yes — at INR pricing.** Indian engineers will pay ₹699/mo (~$8.50) without hesitation. They will NOT pay $9 USD. Same number, different psychological frame.

### What They Need

| Need                                             | Current State     | Required Change                                             |
| ------------------------------------------------ | ----------------- | ----------------------------------------------------------- |
| INR pricing                                      | Not implemented   | Geo-detect via `x-vercel-ip-country`, show ₹                |
| UPI as payment method                            | Razorpay supports | Just enable in Razorpay dashboard                           |
| Indian job sources (Naukri, Instahyre, Cutshort) | None integrated   | Add at least Cutshort (has API), maybe Naukri scraper       |
| International remote jobs (RemoteOK ✓)           | Already have      | Promote this — it's a major draw                            |
| Filter by visa-friendly companies                | Not built         | Tag jobs that say "H1B sponsorship" or "Visa support"       |
| FAANG / product company filter                   | Not built         | Add company tier list (FAANG, Big 4, Indian startups, MNCs) |

### Conversion Path

```
Indian dev sees post in r/developersIndia
    ↓
Lands on Hirin, sees "₹699/mo" instead of "$9"
    ↓
Signs up, uploads resume
    ↓
Gets matched to international remote roles + Indian product companies
    ↓
Pays ₹699 (UPI in 10 seconds)
    ↓
Refers 3 friends from college WhatsApp group (Indian devs share constantly)
```

Indian referral network is your secret weapon. Implement a referral system early.

### How to Reach

1. **r/developersIndia** — single largest Indian dev community
2. **r/IndiaJobSeeker, r/indiansinusa**
3. **LinkedIn India** — Indian devs are heavy LinkedIn users
4. **WhatsApp groups** — once one user shares in their college/company group, viral
5. **YouTube India** — Hitesh Choudhary, Striver (DSA), CodeWithHarry. Try smaller (10-100K subs) first

---

## Segment 3: Recent Grads & Bootcamp Grads (THE VOLUME AUDIENCE)

### Profile

- Age: 20-26
- Experience: 0-2 years (often "tutorial-hell" or freshly bootcamped)
- Income: $0 (often student)
- Use case: "I'm sending 100s of applications, hearing back from nobody, please make it stop"
- Where they hang out: r/learnprogramming, r/cscareerquestions, Discord servers (TheNetNinja, FreeCodeCamp), bootcamp Slack channels

### Will They Pay?

**Mostly no.** They're broke. But they will:

- Use the free tier heavily
- Share with EVERY peer in their bootcamp cohort
- Become paying customers in 1-2 years when they're employed and switching jobs
- Become evangelists if it actually helps them land their first job

### What They Need

- Generous free tier (the weekly digest is enough)
- Help with resume quality (their resume is the bottleneck)
- "Junior friendly" filters
- Tutorials / blog content on "how to write a resume that beats ATS"
- Confidence boost: "see, you ARE matched to real jobs"

### Strategy

**Don't try to convert them.** Use them as a marketing army. Make the free tier useful enough that they share it with every cohort-mate. Eventually some convert.

Add a referral system: "Get 1 month Pro free for every friend who upgrades."

### How to Reach

1. **r/learnprogramming** — comment helpfully on resume threads
2. **Bootcamp partnerships** — Lambda School, Springboard, Hack Reactor, App Academy
3. **CS subreddits at universities** (r/uchicago, r/uwaterloo, r/iitkgp etc.)
4. **YouTube channels for beginners** — FreeCodeCamp, Net Ninja, Traversy Media
5. **Discord servers** for new devs — be the helpful person, not the salesperson

---

## Segment 4: Career Switchers / Mid-Career Pivot (NICHE WITH HIGH VALUE)

### Profile

- Age: 28-50
- Experience: 5-20 years in another field (finance, marketing, design, ops)
- Use case: "I'm switching to product management / data / dev. I have transferable skills but resumes get ignored."
- Income: Mid-high earners, will pay if they perceive ROI
- Where they hang out: LinkedIn (heavy), r/careerguidance, career coach communities, Substack newsletters

### Will They Pay?

**Yes — and they'll pay annually upfront.** Career switchers are committed. They've already invested in coursework, a coach, etc. $9/mo is nothing.

### What They Need

- Resume parsing that highlights transferable skills (current Gemini prompt doesn't emphasize this)
- "Experience equivalence" matching ("5 years in marketing analytics ~ entry-level data analyst")
- AI cover letter that bridges the narrative ("Why I'm switching from finance to PM")
- Encouragement / niche role suggestions

### How to Reach

1. **LinkedIn** (their primary channel)
2. **Career coach partnerships** (they often work with switchers)
3. **Substack newsletters on career change**
4. **Reddit: r/careerguidance, r/careerchange, r/PMCareers**

---

## Revenue Model by Segment

| Segment             | % of Users | % of Revenue | Plan                                 |
| ------------------- | ---------- | ------------ | ------------------------------------ |
| Active SWEs (US/EU) | 25%        | 45%          | Pro $9/mo (annual common)            |
| Indian SWEs         | 30%        | 30%          | Pro ₹699/mo (UPI)                    |
| Recent grads        | 35%        | 5%           | Free (referral engine)               |
| Career switchers    | 10%        | 20%          | Pro $9 + add-ons (Resume Review $25) |

**80% of revenue from 30% of users (active SWEs + switchers).** Optimize the funnel for them. Build the free experience for grads (they're your marketing).

---

## Geographic Strategy

| Region                   | Volume     | Willingness to Pay  | Strategy                                                                |
| ------------------------ | ---------- | ------------------- | ----------------------------------------------------------------------- |
| USA                      | High       | High ($9 = nothing) | Primary market — invest in r/cscareerquestions, HN, X                   |
| Canada                   | Medium     | High                | Same as US                                                              |
| UK / Western EU          | Medium     | High                | Same as US, mention Adzuna EU coverage                                  |
| India                    | Very High  | Medium (₹699)       | Major market — LinkedIn India, r/developersIndia, INR pricing essential |
| SE Asia (PH, ID, VN, MY) | Medium     | Low-Medium          | Free tier for volume, USD for paid                                      |
| LATAM (BR, MX, AR)       | Medium     | Medium              | Spanish/Portuguese localization is high-leverage but later              |
| Africa                   | Low-Medium | Low                 | Free tier only initially                                                |

**Focus marketing on USA + India.** Two largest tech-job markets. Different go-to-market for each.

---

## The One Thing That Changes Everything

Job-search SaaS has a unique attribute: **users churn when they succeed**.

Your job is to:

1. Make the success memorable enough that they tell 10 friends
2. Make the brand sticky enough that they come back next time they look
3. Make annual pricing attractive enough that they pre-commit

Three concrete things to build for retention-after-success:

1. **"Hirin' helped me land my job" survey** on cancellation. Use quotes for marketing.
2. **Lifetime referral credit** — refer 3 friends who upgrade, get Pro for life
3. **"Welcome back" cadence** — at 6 months and 12 months post-cancel, send a "looking again?" email

Your average customer lifetime is ~6 months active job search. With repeat-customer mechanics, you can extend that to 18-24 months across cycles.

That's the LTV math that makes Hirin' a viable business.

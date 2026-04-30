# UI/UX Improvements

---

## Landing Page Overhaul (`src/app/page.tsx`)

### Current Problems

1. Hardcoded fake testimonials (anyone reading the source HTML sees this)
2. No demo video / GIF — you sell a workflow but show nothing of it
3. FAQ before pricing — visitors compare price first
4. No live signal of activity ("12K jobs scraped today" / "3,400 matches sent this week")
5. Mobile carousel hijacks scroll (touch handlers wrong)
6. Pricing card omits AI features

### Section Order — What It Should Be

```
┌─────────────────────────────────────────────┐
│ [Logo] Hirin'              [Login] [Sign up] │
├─────────────────────────────────────────────┤
│                                             │
│   Stop scrolling job boards.                │
│   Get matched jobs in your inbox.           │
│                                             │
│   Upload your resume. We hunt across        │
│   LinkedIn, Indeed, RemoteOK and more —     │
│   AI ranks them for you. Daily.             │
│                                             │
│   [Try free — 1 resume + weekly digest]     │
│                                             │
│   ▶ [DEMO VIDEO: upload PDF → matches inbox]│
│                                             │
├─────────────────────────────────────────────┤
│   Live: 14,238 jobs from 6 sources today    │
├─────────────────────────────────────────────┤
│   How it works (3 steps with icons)         │
├─────────────────────────────────────────────┤
│   What you get with Pro                     │
│   - AI cover letters tailored per job        │
│   - Interview prep based on JD + resume      │
│   - Daily digest from all 6 sources          │
│   - Unlimited application tracking           │
├─────────────────────────────────────────────┤
│   Pricing (Free vs Pro side-by-side)        │
├─────────────────────────────────────────────┤
│   FAQ (only after pricing)                   │
├─────────────────────────────────────────────┤
│   Real testimonials OR remove this section   │
├─────────────────────────────────────────────┤
│   Footer (legal, socials)                    │
└─────────────────────────────────────────────┘
```

### Hero Specifics

```tsx
// src/components/Hero/HeroPage.tsx
<h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight">
  Stop scrolling job boards.<br />
  Get <span className="text-blue-600">matched jobs</span> in your inbox.
</h1>
<p className="text-lg md:text-xl text-gray-600 mt-6 max-w-2xl">
  Upload your resume. We hunt across LinkedIn, Indeed, RemoteOK, and more —
  AI ranks them for you. Daily.
</p>
<div className="flex flex-col sm:flex-row gap-3 mt-10 justify-center">
  <Link href="/sign-up" className="px-8 py-4 bg-black text-white rounded-full text-lg">
    Try free
  </Link>
  <a href="#how" className="px-8 py-4 border border-gray-300 rounded-full text-lg">
    See how it works
  </a>
</div>
```

### Demo Video

Record a 20-second screen capture:

1. Land on Hirin signup
2. Sign up with Google (Clerk)
3. Drag-drop resume PDF
4. Smash cut to inbox: "5 new matches" email
5. Click email → matches page with scores

Save as `public/demo.mp4`. Embed:

```tsx
<video
  src="/demo.mp4"
  autoPlay
  muted
  loop
  playsInline
  className="mx-auto w-full max-w-4xl rounded-2xl shadow-2xl"
/>
```

### Live Stats Strip

Add a thin band below hero showing real numbers:

```tsx
// Server component
const stats = await prisma.$transaction([
  prisma.job.count({ where: { scrapedAt: { gte: today } } }),
  prisma.jobMatch.count({ where: { emailedAt: { gte: today } } }),
  prisma.user.count(),
]);

<div className="bg-blue-50 py-3 text-center text-sm text-blue-700">
  Today: <b>{stats[0].toLocaleString()}</b> jobs scraped · <b>{stats[1].toLocaleString()}</b>{' '}
  matches delivered · <b>{stats[2].toLocaleString()}</b> users
</div>;
```

This is auto-updating social proof. Even at 50 users it looks alive.

### Remove the Fake Testimonial Carousel

Delete `src/components/Hero/Carousel.tsx` until you have real testimonials. Or replace with:

- "As featured on" logos (Reddit, Hacker News, Product Hunt — when you actually launch there)
- 1 quote from a real beta user (get permission and a photo)

Fake testimonials erode trust the moment one person notices.

### Pricing Card on Landing

Currently the embedded pricing card exists at `src/components/Hero/Pricing.tsx`. Make sure it shows:

```
Free                            Pro — $9/mo
─────────────────────────────────────────────
1 resume                        3 resumes
Weekly digest                   Daily digest
2 free job sources              All 6 sources
Basic application tracker       Unlimited tracker
                                AI cover letters
                                AI interview prep
                                Match explanations
[Get started]                   [Upgrade]
```

For Indian users, swap to `₹699/mo` based on geolocation (`x-vercel-ip-country` header).

---

## Onboarding Page (`src/app/Onboard/page.tsx`)

### 1. ✅ Rename `/Onboard` → `/onboard`

Capital O looks unprofessional. Update:

- Folder rename: `src/app/Onboard/` → `src/app/onboard/`
- All `redirect('/Onboard')` calls in middleware and post-signup
- Update Clerk's `redirectUrl` in `layout.tsx`

### 2. ✅ Strongly Type Parsed Resume

Currently:

```tsx
const [parsedResume, setParsedResume] = useState<any>(null);
```

Replace with:

```tsx
interface ParsedResume {
  rawText: string;
  skills: string[];
  experience: { company: string; role: string; duration: string; description: string }[];
}
const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
```

### 3. ✅ Add Progress Indicator During Resume Parse

Resume parsing takes 5-15s (Gemini call). Right now there's no feedback.

```tsx
const [parseStep, setParseStep] = useState<
  'idle' | 'uploading' | 'extracting' | 'parsing-skills' | 'embedding' | 'done'
>('idle');

// In handleResumeUpload:
setParseStep('uploading');
await uploadFile();
setParseStep('extracting');
const text = await extractText();
setParseStep('parsing-skills');
const parsed = await parseWithGemini(text);
setParseStep('embedding');
await generateEmbedding();
setParseStep('done');

// In JSX:
{
  parseStep !== 'idle' && parseStep !== 'done' && (
    <div className="space-y-2">
      <Step
        done={['extracting', 'parsing-skills', 'embedding', 'done'].includes(parseStep)}
        label="Reading your resume"
      />
      <Step
        done={['parsing-skills', 'embedding', 'done'].includes(parseStep)}
        label="Extracting skills and experience"
      />
      <Step
        done={['embedding', 'done'].includes(parseStep)}
        label="Generating semantic embedding"
      />
    </div>
  );
}
```

### 4. ✅ Require Resume Upload to Complete Onboarding

Right now a user can click "Skip" through every step and have an empty profile. They get zero matches and bounce.

In `src/app/api/onboarding/complete/route.ts`:

```ts
const user = await prisma.user.findUnique({
  where: { clerkId: userId },
  include: { resumes: true },
});

if (user.resumes.length === 0) {
  return NextResponse.json({ error: 'Resume required to complete onboarding' }, { status: 400 });
}
```

Frontend disables "Continue" button until resume is parsed.

### 5. ✅ Pass Preferences to Job Fetch Query

Currently `/api/cron/jobs` runs the same query for everyone. User sets "Remote, $100K+, Backend roles" and still gets random matches.

Update `src/services/job.service.ts`:

```ts
export async function fetchAndSaveJobs(userId?: string) {
  let query = 'software engineer';
  let location = 'remote';
  let salaryMin: number | undefined;

  if (userId) {
    const prefs = await prisma.jobPreferences.findUnique({ where: { userId } });
    if (prefs) {
      query = prefs.desiredRoles[0] ?? query;
      location = prefs.workLocation === 'remote' ? 'remote' : (prefs.locations[0] ?? location);
      salaryMin = prefs.salaryMin ?? undefined;
    }
  }

  // ... pass to Adzuna/JSearch ...
}
```

For the cron, iterate per-user (or chunk by similar preferences).

---

## Matches Page (`src/app/matches/page.tsx`)

### 1. ✅ Split the 631-Line File

Break into:

- `src/app/matches/page.tsx` (top-level data loading)
- `src/components/matches/MatchesGrid.tsx`
- `src/components/matches/MatchCard.tsx`
- `src/components/matches/MatchFilters.tsx`
- `src/components/matches/MatchExplanation.tsx`
- `src/hooks/useMatches.ts`

Each should be < 150 lines.

### 2. ✅ Format Match Score as Percentage with Color

```tsx
function MatchScore({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const tone =
    pct >= 80
      ? 'bg-green-100 text-green-700'
      : pct >= 60
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700';
  return <span className={`rounded px-2 py-1 text-xs font-semibold ${tone}`}>{pct}% match</span>;
}
```

### 3. ✅ Add Pagination

Use cursor pagination on `JobMatch.createdAt` desc:

```ts
const matches = await prisma.jobMatch.findMany({
  where: { userId, status: { not: 'hidden' } },
  orderBy: { createdAt: 'desc' },
  take: 21, // 20 + 1 to know if more exist
  cursor: cursor ? { id: cursor } : undefined,
  include: { job: true },
});
const hasMore = matches.length > 20;
const items = matches.slice(0, 20);
const nextCursor = hasMore ? items[items.length - 1].id : null;
```

Frontend uses TanStack Query's `useInfiniteQuery` or a simple "Load more" button.

### 4. ✅ "Why This Match?" Explanation

Add to each card:

```tsx
function MatchExplanation({ resume, job }: { resume: Resume; job: Job }) {
  // Compute overlapping signals client-side from already-fetched data
  const skillOverlap = resume.parsedSkills
    .filter((s) => job.description?.toLowerCase().includes(s.toLowerCase()))
    .slice(0, 3);

  const locationMatch = resume.preferredLocation === job.location || job.location === 'Remote';
  const salaryMatch =
    !resume.salaryMin || (job.salary && parseSalary(job.salary) >= resume.salaryMin);

  return (
    <div className="mt-2 space-y-1 text-xs">
      {skillOverlap.length > 0 && <div>✓ Skills: {skillOverlap.join(', ')}</div>}
      {locationMatch && <div>✓ Location matches your preferences</div>}
      {salaryMatch && <div>✓ Salary in your range</div>}
    </div>
  );
}
```

For Pro users, add a "See full breakdown" that calls Gemini for a paragraph explanation.

### 5. ✅ Hide Job / Hide Company

```tsx
<button onClick={() => hideMatch(matchId)} className="text-xs text-gray-500 hover:text-red-600">
  Hide this job
</button>
<button onClick={() => hideCompany(job.company)} className="text-xs text-gray-500 hover:text-red-600">
  Hide all from {job.company}
</button>
```

Backend: add `User.hiddenCompanies String[]`, filter in `/api/matches`.

### 6. ✅ Filter Chips

```tsx
<div className="flex gap-2 overflow-x-auto py-2">
  <Chip active={filter === 'all'}>All</Chip>
  <Chip active={filter === 'remote'}>Remote</Chip>
  <Chip active={filter === 'high-match'}>80%+ match</Chip>
  <Chip active={filter === 'unviewed'}>New</Chip>
</div>
```

### 7. ✅ Empty State

```tsx
{
  matches.length === 0 && (
    <div className="py-16 text-center text-gray-500">
      <Inbox className="mx-auto mb-4 h-16 w-16 text-gray-300" />
      <p className="text-lg">Your first matches arrive within 24 hours</p>
      <p className="mt-2 text-sm">We're scanning 6 job sources. Check back tomorrow morning.</p>
    </div>
  );
}
```

---

## Profile Page (`src/app/profile/page.tsx`)

### 1. ✅ Type `savedJobs`

```tsx
// BEFORE
const [savedJobs, setSavedJobs] = useState<any[]>([]);
// AFTER
const [savedJobs, setSavedJobs] = useState<Job[]>([]);
```

### 2. ✅ Add "Manage Subscription" Button

```tsx
{
  user.subscription?.plan === 'PRO' && (
    <button onClick={cancelSubscription} className="text-sm text-red-600">
      Cancel subscription
    </button>
  );
}
{
  user.subscription?.cancelAtPeriodEnd && (
    <p className="text-sm text-amber-600">
      Subscription cancels on {format(user.subscription.currentPeriodEnd, 'MMM d')}.
      <button onClick={resumeSubscription}>Resume</button>
    </p>
  );
}
```

### 3. ✅ Add "Delete Account" (GDPR)

```tsx
<button onClick={confirmDeleteAccount} className="mt-8 text-sm text-red-600">
  Delete my account
</button>
```

Backend: cascade-delete via Prisma, cancel Razorpay subscription, sign out via Clerk.

### 4. ✅ Show Resume Versions

Pro users get 3 resumes. Add a UI to manage versions:

```tsx
{
  user.resumes.map((r) => (
    <div key={r.id}>
      <span>{r.fileName}</span>
      <button>Use this for matching</button>
      <button>Delete</button>
    </div>
  ));
}
```

---

## Pricing Page (`src/app/pricing/page.tsx`)

### 1. ✅ INR/USD Toggle (or Auto-Detect)

```tsx
// Server component, set default from geolocation
const country = headers().get('x-vercel-ip-country') ?? 'US';
const currency = country === 'IN' ? 'INR' : 'USD';
```

Show a toggle for users to override:

```tsx
<div className="mb-8 flex justify-center">
  <button onClick={() => setCurrency('INR')} className={currency === 'INR' ? 'active' : ''}>
    ₹ INR
  </button>
  <button onClick={() => setCurrency('USD')} className={currency === 'USD' ? 'active' : ''}>
    $ USD
  </button>
</div>
```

### 2. ✅ Annual Toggle

```tsx
<label>
  <input type="checkbox" checked={annual} onChange={(e) => setAnnual(e.target.checked)} />
  Pay annually (save 20%)
</label>
```

### 3. ✅ Show Per-Feature Comparison Matrix

A table with Free | Pro columns and rows for every feature, with ✓/✗.

This converts better than two stacked cards.

### 4. ✅ Add FAQ Anchored to Pricing

3-4 FAQ items below the cards:

- "Can I cancel anytime?" Yes, plan stays active until period end.
- "What payment methods?" UPI, cards, netbanking via Razorpay.
- "Do you offer refunds?" 14-day refund if you haven't used Pro features.
- "Can I change plans?" Yes, prorated.

---

## Other Quick Wins

### Replace `alert()` and `confirm()` with Modals

Search for `confirm(` and `alert(` across `src/`. Replace with proper modal components — they look terrible and can't be styled.

### Favicon

Replace Next.js default with a Hirin' logo (16x16, 32x32 PNG + SVG).

### Page Titles & Meta

Each page should have:

```tsx
// src/app/matches/page.tsx
export const metadata = {
  title: 'Your job matches · Hirin',
  description: 'AI-ranked jobs from 6 sources, daily.',
};
```

Already have `robots.ts` and `sitemap.ts` (good). Verify they include `/pricing`, `/sign-up`.

### Open Graph Tags

```tsx
// src/app/layout.tsx — root metadata
export const metadata = {
  title: 'Hirin — AI job matching',
  description: 'Upload your resume. Get matched jobs in your inbox.',
  openGraph: {
    title: 'Hirin — AI job matching',
    description: 'Upload your resume. Get matched jobs in your inbox.',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hirin — AI job matching',
    description: 'Upload your resume. Get matched jobs in your inbox.',
    images: ['/og-image.png'],
  },
};
```

Create `public/og-image.png` (1200x630) — a screenshot of the matches page with a tagline overlay.

### Analytics Events (Umami)

Wire actual events:

- `signup` on Clerk afterSignup callback
- `resume_uploaded` after first parse
- `first_match_shown` when /matches loads with > 0 matches
- `cover_letter_generated` (Pro)
- `subscribe_clicked` on pricing CTA
- `subscribe_completed` on webhook activation

These let you measure the funnel. Without them you're flying blind.

### Remove Console Logs

```bash
rg "console\.(log|error|warn)" src/ -l
```

Replace with the `log` helper from [security.md](security.md#15-low-consolelog-leaking-data).

### Loading States Everywhere

The matches page, profile page, and pricing page all need skeleton loaders. Right now they pop in.

```tsx
{
  loading ? <MatchCardSkeleton count={5} /> : <MatchesGrid />;
}
```

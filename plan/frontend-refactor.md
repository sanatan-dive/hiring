# Frontend Refactor Plan

Every change mapped to exact files, line numbers, and what to do.

---

## PHASE 1: Critical UX Fixes (Day 1-2)

### 1.1 ✅ Rewrite Landing Hero (`src/components/Hero/HeroPage.tsx`)

Replace placeholder hero with:

```tsx
import Link from 'next/link';

export default function HeroPage() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-20">
      <div className="max-w-4xl text-center">
        <h1 className="text-4xl leading-tight font-semibold tracking-tight md:text-6xl lg:text-7xl">
          Stop scrolling job boards.
          <br />
          Get <span className="text-blue-600">matched jobs</span> in your inbox.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 md:text-xl">
          Upload your resume. We scan LinkedIn, Indeed, RemoteOK, Adzuna, JSearch and
          WeWorkRemotely. AI ranks them. Daily digest in your inbox.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="rounded-full bg-black px-8 py-4 text-lg text-white transition hover:bg-gray-800"
          >
            Try free — weekly digest
          </Link>
          <a
            href="#how"
            className="rounded-full border border-gray-300 px-8 py-4 text-lg transition hover:bg-gray-50"
          >
            See how it works
          </a>
        </div>
      </div>

      <div className="mt-16 w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 shadow-2xl">
        <video src="/demo.mp4" autoPlay muted loop playsInline className="w-full" />
      </div>
    </section>
  );
}
```

**Action needed:** Record a 20-30 second screen capture of:

1. Sign up via Clerk
2. Drag-drop a resume PDF
3. Smash cut to inbox showing "5 new matches" email
4. Click email → matches page

Save to `public/demo.mp4` (compressed to < 5MB with `ffmpeg -i input.mov -vf scale=1280:-2 -crf 28 demo.mp4`).

### 1.2 ✅ Live Stats Strip

**New server component:** `src/components/Hero/LiveStats.tsx`

```tsx
import { prisma } from '@/lib/db/prisma';

export default async function LiveStats() {
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const [jobsToday, matchesToday, totalUsers] = await prisma.$transaction([
    prisma.job.count({ where: { scrapedAt: { gte: since } } }),
    prisma.jobMatch.count({ where: { emailedAt: { gte: since } } }),
    prisma.user.count(),
  ]);

  return (
    <div className="bg-blue-50 py-3 text-center text-sm text-blue-700">
      Today: <b>{jobsToday.toLocaleString()}</b> jobs scraped ·{' '}
      <b>{matchesToday.toLocaleString()}</b> matches delivered ·{' '}
      <b>{totalUsers.toLocaleString()}</b> users
    </div>
  );
}
```

Render in `src/app/page.tsx` immediately below `<HeroPage />`.

### 1.3 ✅ Remove Fake Testimonials

**File:** `src/app/page.tsx` and `src/components/Hero/Carousel.tsx`

Delete the `<Carousel />` invocation. Either:

- Replace with a "Featured on" section (only when actually featured), OR
- Delete entirely until you have real testimonials

A bare landing page beats fake testimonials.

### 1.4 ✅ Reorder Landing Sections

**File:** `src/app/page.tsx`

```tsx
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroPage from '@/components/Hero/HeroPage';
import LiveStats from '@/components/Hero/LiveStats';
import HowItWorks from '@/components/Hero/HowItWorks';
import Pricing from '@/components/Hero/Pricing';
import FAQ from '@/components/Hero/FAQ';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroPage />
        <LiveStats />
        <HowItWorks />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
```

### 1.5 ✅ Pricing Card Shows Pro AI Features

**File:** `src/components/Hero/Pricing.tsx`

Already exists — make sure the Pro card lists:

- ✓ Daily job digest (vs weekly)
- ✓ All 6 sources (vs 2)
- ✓ AI Cover Letter (20/day)
- ✓ AI Interview Prep (20/day)
- ✓ Match explanations
- ✓ Unlimited applications + bookmarks
- ✓ 3 resumes (vs 1)
- ✓ LinkedIn paste-URL scrapes
- ✓ Email follow-up reminders

---

## PHASE 2: Onboarding (Day 3)

### 2.1 ✅ Rename `/Onboard` → `/onboard`

```bash
git mv "src/app/Onboard" "src/app/onboard"
```

Find and replace all references:

```bash
rg "Onboard" src/ -l
```

Update `redirect('/Onboard')` calls in middleware (`src/middleware.ts`) and any post-signup callback.

### 2.2 ✅ Type the Parsed Resume

**File:** `src/app/onboard/page.tsx`

```tsx
interface ParsedResume {
  rawText: string;
  skills: string[];
  experience: { company: string; role: string; duration: string; description: string }[];
}

const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
```

### 2.3 ✅ Multi-Step Parse Progress

**File:** `src/app/onboard/page.tsx`

```tsx
type ParseStep = 'idle' | 'uploading' | 'extracting' | 'parsing-skills' | 'embedding' | 'done';
const [parseStep, setParseStep] = useState<ParseStep>('idle');

async function handleResumeUpload(file: File) {
  setParseStep('uploading');
  const upload = await fetch('/api/resume', { method: 'POST', body: formData });

  setParseStep('extracting');
  // ... call parse endpoint, which can return server-sent events for progress ...

  setParseStep('parsing-skills');
  // ...

  setParseStep('embedding');
  // ...

  setParseStep('done');
}

// In JSX:
{
  parseStep !== 'idle' && parseStep !== 'done' && (
    <div className="mt-4 space-y-2">
      <ProgressLine
        done={['extracting', 'parsing-skills', 'embedding', 'done'].includes(parseStep)}
        active={parseStep === 'extracting'}
        label="Reading your resume"
      />
      <ProgressLine
        done={['parsing-skills', 'embedding', 'done'].includes(parseStep)}
        active={parseStep === 'parsing-skills'}
        label="Extracting skills and experience"
      />
      <ProgressLine
        done={['embedding', 'done'].includes(parseStep)}
        active={parseStep === 'embedding'}
        label="Generating semantic embedding"
      />
    </div>
  );
}
```

`ProgressLine` is a small component with a checkmark / spinner / circle.

### 2.4 ✅ Require Resume to Complete Onboarding

**File:** `src/app/onboard/page.tsx`

Disable the "Finish" button until parsedResume is set:

```tsx
<button disabled={!parsedResume || parseStep !== 'done'} onClick={handleFinish} className="...">
  Finish
</button>
```

Backend enforces it too in `/api/onboarding/complete/route.ts`.

### 2.5 ✅ Pass `?prompt=` Query for Match Try-Again

(Future feature; safe placeholder for now.)

---

## PHASE 3: Matches Page (Day 4-5)

### 3.1 ✅ Split the 631-line File

**File structure:**

```
src/app/matches/
├── page.tsx                    (~60 lines: data fetching + layout)
src/components/matches/
├── MatchesGrid.tsx             (~80 lines)
├── MatchCard.tsx               (~120 lines)
├── MatchCard.skeleton.tsx
├── MatchFilters.tsx            (~60 lines)
├── MatchExplanation.tsx        (~50 lines)
├── MatchScore.tsx              (~20 lines)
src/hooks/
├── useMatches.ts               (~50 lines, useInfiniteQuery)
├── useHideMatch.ts
```

### 3.2 ✅ Format Score as Percentage

**File:** `src/components/matches/MatchScore.tsx`

```tsx
export function MatchScore({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const tone =
    pct >= 80
      ? 'bg-green-100 text-green-700 border-green-200'
      : pct >= 60
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-red-100 text-red-700 border-red-200';
  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${tone}`}>
      {pct}% match
    </span>
  );
}
```

### 3.3 ✅ Cursor Pagination

**File:** `src/app/api/matches/route.ts`

```ts
const cursor = searchParams.get('cursor') ?? undefined;
const matches = await prisma.jobMatch.findMany({
  where: { userId: user.id, status: { not: 'hidden' } },
  orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
  take: 21,
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
  include: { job: true },
});
const hasMore = matches.length > 20;
const items = matches.slice(0, 20);
const nextCursor = hasMore ? items[items.length - 1].id : null;

return NextResponse.json({ items, nextCursor });
```

**Frontend:** Use TanStack Query `useInfiniteQuery`:

```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['matches'],
  queryFn: ({ pageParam }) => fetch(`/api/matches?cursor=${pageParam ?? ''}`).then((r) => r.json()),
  initialPageParam: null,
  getNextPageParam: (last) => last.nextCursor,
});
```

`npm install @tanstack/react-query`

### 3.4 ✅ "Why This Match?" Panel

**File:** `src/components/matches/MatchExplanation.tsx`

```tsx
export function MatchExplanation({ resume, job }: { resume: ResumeWithSkills; job: Job }) {
  const skillOverlap = resume.parsedSkills
    .filter((s) => job.description?.toLowerCase().includes(s.skill.toLowerCase()))
    .map((s) => s.skill)
    .slice(0, 5);

  const techOverlap = (job.techStack ?? []).filter((t) =>
    resume.parsedSkills.some((s) => s.skill.toLowerCase() === t.toLowerCase())
  );

  const locationMatch = !job.location || job.location.toLowerCase().includes('remote');

  return (
    <div className="mt-2 space-y-1 text-xs text-gray-600">
      {skillOverlap.length > 0 && (
        <div>
          ✓ Skills overlap: <b>{skillOverlap.join(', ')}</b>
        </div>
      )}
      {techOverlap.length > 0 && (
        <div>
          ✓ Tech stack match: <b>{techOverlap.join(', ')}</b>
        </div>
      )}
      {locationMatch && <div>✓ Location matches your preferences</div>}
    </div>
  );
}
```

### 3.5 ✅ Hide Job / Hide Company

**Backend:** Add `User.hiddenCompanies String[] @default([])` and a status `hidden` for `JobMatch`.

**Frontend:** Buttons on `MatchCard`:

```tsx
<button onClick={() => hideMatch(match.id)} className="text-xs text-gray-500 hover:text-red-600">
  Hide this job
</button>
<button onClick={() => hideCompany(job.company)} className="text-xs text-gray-500 hover:text-red-600">
  Hide all from {job.company}
</button>
```

### 3.6 ✅ Filter Chips

**File:** `src/components/matches/MatchFilters.tsx`

```tsx
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'remote', label: 'Remote only' },
  { key: 'high', label: '80%+ match' },
  { key: 'unviewed', label: 'New' },
  { key: 'applied', label: 'Applied' },
] as const;

export function MatchFilters({
  active,
  onChange,
}: {
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
            active === f.key ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
```

### 3.7 ✅ Empty State

```tsx
{
  !isLoading && matches.length === 0 && (
    <div className="py-16 text-center text-gray-500">
      <Inbox className="mx-auto mb-4 h-16 w-16 text-gray-300" />
      <p className="text-lg font-medium">Your first matches arrive within 24 hours</p>
      <p className="mt-2 text-sm">
        We're scanning 6 job sources. Check back tomorrow morning, or upload a more detailed resume
        to improve match quality.
      </p>
    </div>
  );
}
```

### 3.8 ✅ Skeleton Loaders

**File:** `src/components/matches/MatchCard.skeleton.tsx`

```tsx
export function MatchCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 h-5 w-3/4 rounded bg-gray-200" />
          <div className="mb-4 h-4 w-1/2 rounded bg-gray-200" />
          <div className="mb-2 h-3 w-full rounded bg-gray-200" />
          <div className="h-3 w-5/6 rounded bg-gray-200" />
        </div>
      ))}
    </>
  );
}
```

---

## PHASE 4: Pricing Page (Day 6)

### 4.1 ✅ INR/USD Auto-Detect

**File:** `src/app/pricing/page.tsx` (server component)

```tsx
import { headers } from 'next/headers';

export default async function PricingPage() {
  const country = headers().get('x-vercel-ip-country') ?? 'US';
  const defaultCurrency: 'INR' | 'USD' = country === 'IN' ? 'INR' : 'USD';
  return <PricingClient defaultCurrency={defaultCurrency} />;
}
```

### 4.2 ✅ Currency + Annual Toggle

**File:** `src/app/pricing/PricingClient.tsx` (new client component)

```tsx
'use client';
import { useState } from 'react';

const PRICES = {
  INR: { monthly: 699, annual: 559 },
  USD: { monthly: 9, annual: 7.2 },
};

export function PricingClient({ defaultCurrency }: { defaultCurrency: 'INR' | 'USD' }) {
  const [currency, setCurrency] = useState<'INR' | 'USD'>(defaultCurrency);
  const [annual, setAnnual] = useState(false);
  const symbol = currency === 'INR' ? '₹' : '$';
  const price = annual ? PRICES[currency].annual : PRICES[currency].monthly;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-8 flex justify-center gap-6">
        <CurrencyToggle value={currency} onChange={setCurrency} />
        <AnnualToggle value={annual} onChange={setAnnual} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PlanCard
          name="Free"
          price={`${symbol}0`}
          period="forever"
          features={[
            'Weekly digest',
            '2 free job sources',
            '1 resume',
            '5 active applications',
            '7-day match history',
          ]}
          cta="Sign up"
          highlight={false}
        />

        <PlanCard
          name="Pro"
          price={`${symbol}${price}`}
          period={annual ? '/mo billed annually' : '/mo'}
          features={[
            'Daily digest',
            'All 6 sources',
            '3 resumes',
            'AI cover letters (20/day)',
            'AI interview prep (20/day)',
            'Match explanations',
            'Unlimited applications + bookmarks',
            'LinkedIn paste-URL scrapes',
          ]}
          cta="Upgrade to Pro"
          highlight={true}
          currency={currency}
          billing={annual ? 'annual' : 'monthly'}
        />
      </div>

      <PricingFAQ />
    </div>
  );
}
```

### 4.3 ✅ Dodo Hosted Checkout in PlanCard

```tsx
function PlanCard({ ..., currency, billing }: PlanCardProps) {
  const handleClick = async () => {
    const res = await fetch('/api/payments/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'PRO', currency, billing }),
    });
    const { checkoutUrl } = await res.json();

    // Dodo is a redirect-style hosted checkout — no JS modal to load.
    window.location.href = checkoutUrl;
  };

  // Render
}
```

No external script needed. The Dodo SDK lives server-side; the browser just follows the redirect to `https://checkout.dodopayments.com/...` (or `https://test.checkout.dodopayments.com/...` in test mode). After payment, Dodo redirects back to `NEXT_PUBLIC_APP_URL/matches?upgraded=1` and the webhook flips the user to PRO asynchronously.

---

## PHASE 5: Profile Page (Day 7)

### 5.1 ✅ Type `savedJobs`

**File:** `src/app/profile/page.tsx`

```ts
import type { Job, Bookmark } from '@prisma/client';
type BookmarkWithJob = Bookmark & { job: Job };
const [savedJobs, setSavedJobs] = useState<BookmarkWithJob[]>([]);
```

### 5.2 ✅ Manage Subscription Section

```tsx
{
  user.subscription?.plan === 'PRO' && (
    <section className="mt-8 rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold">Subscription</h3>
      <p className="mt-1 text-sm text-gray-600">
        Pro · Renews on {format(user.subscription.currentPeriodEnd!, 'MMM d, yyyy')}
      </p>

      {!user.subscription.cancelAtPeriodEnd ? (
        <button onClick={cancelSubscription} className="mt-3 text-sm text-red-600 hover:underline">
          Cancel subscription
        </button>
      ) : (
        <p className="mt-3 text-sm text-amber-600">
          Cancels on {format(user.subscription.currentPeriodEnd!, 'MMM d')}.{' '}
          <button onClick={resumeSubscription} className="underline">
            Resume
          </button>
        </p>
      )}
    </section>
  );
}
```

### 5.3 ✅ Delete Account (GDPR)

```tsx
<button onClick={confirmDeleteAccount} className="mt-12 text-sm text-red-600 hover:underline">
  Delete my account permanently
</button>
```

Backend: `/api/account/delete` cascades via Prisma, calls `clerk.users.deleteUser(...)`, cancels the user's Dodo subscription via `cancelSubscription()`.

### 5.4 ✅ Resume Versions UI

```tsx
<section>
  <h3>
    Resumes ({user.resumes.length} / {limits.resumes})
  </h3>
  {user.resumes.map((r) => (
    <div key={r.id} className="flex items-center justify-between rounded border p-3">
      <span>{r.fileName}</span>
      <div className="flex gap-2">
        <button onClick={() => setActive(r.id)}>Use for matching</button>
        <button onClick={() => deleteResume(r.id)} className="text-red-600">
          Delete
        </button>
      </div>
    </div>
  ))}
</section>
```

---

## PHASE 6: Polish (Day 8)

### 6.1 ✅ Page-Level Metadata

Each page exports:

```ts
export const metadata = {
  title: 'Your job matches · Hirin',
  description: 'AI-ranked jobs from 6 sources, daily.',
};
```

For `/matches`, `/profile`, `/applications` — also `robots: { index: false }`.

### 6.2 ✅ OG Image

Create `public/og-image.png` (1200x630). Either:

- Use `next/og` for dynamic OG with user matches
- Or static screenshot of matches page with tagline overlay

In `src/app/layout.tsx`:

```ts
export const metadata: Metadata = {
  title: { default: 'Hirin — AI job matching', template: '%s · Hirin' },
  description: 'Upload your resume. Get matched jobs in your inbox. Daily.',
  openGraph: {
    title: 'Hirin — AI job matching',
    description: 'Upload your resume. Get matched jobs in your inbox.',
    images: ['/og-image.png'],
    type: 'website',
    url: 'https://hirin.app',
  },
  twitter: { card: 'summary_large_image', images: ['/og-image.png'] },
};
```

### 6.3 ✅ Replace Default Favicon

Create `public/favicon.svg` with Hirin logo. Reference in metadata or use Next.js conventions (`src/app/icon.svg`).

### 6.4 ✅ Wire Umami Events

**File:** `src/lib/analytics.ts`

```ts
export function track(event: string, props?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  (window as any).umami?.track(event, props);
}
```

Use:

- `track('signup')` after Clerk sign-up
- `track('resume_uploaded')` in onboarding
- `track('first_match_shown')` on first matches page load with > 0 results
- `track('cover_letter_generated')` in modal
- `track('subscribe_clicked', { plan: 'PRO', currency })` on pricing CTA
- `track('subscribe_completed', { plan: 'PRO' })` after webhook (server-side via `/api/track`)

### 6.5 ✅ Replace `confirm()` and `alert()`

```bash
rg "confirm\(|alert\(" src/
```

Use a `Dialog` component. Quick pattern:

```tsx
const [confirmOpen, setConfirmOpen] = useState(false);

{
  confirmOpen && (
    <Dialog onClose={() => setConfirmOpen(false)}>
      <h3>Delete this resume?</h3>
      <p>This cannot be undone.</p>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={() => setConfirmOpen(false)}>Cancel</button>
        <button onClick={onDelete} className="bg-red-600 text-white">
          Delete
        </button>
      </div>
    </Dialog>
  );
}
```

### 6.6 ✅ Loading Skeletons Everywhere

- Matches page: `MatchCardSkeleton`
- Profile: skeleton for user data block
- Pricing: skeleton if currency-detection awaiting

---

## Summary: Files Changed

| File                                             | Changes                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| `src/components/Hero/HeroPage.tsx`               | Complete rewrite — value-first hero + demo video                     |
| `src/components/Hero/LiveStats.tsx`              | NEW — server component with real stats                               |
| `src/components/Hero/Carousel.tsx`               | DELETE (or rebuild with real testimonials)                           |
| `src/app/page.tsx`                               | Reorder sections                                                     |
| `src/components/Hero/Pricing.tsx`                | Show AI features prominently                                         |
| `src/app/Onboard/`                               | RENAMED → `src/app/onboard/`                                         |
| `src/app/onboard/page.tsx`                       | Type parsedResume, parse-step indicator, require-resume gate         |
| `src/middleware.ts`                              | Update `/Onboard` → `/onboard`                                       |
| `src/app/matches/page.tsx`                       | Reduced to ~60 lines, data layer only                                |
| `src/components/matches/*`                       | NEW — split components (MatchesGrid, MatchCard, MatchFilters, etc.)  |
| `src/hooks/useMatches.ts`                        | NEW — useInfiniteQuery                                               |
| `src/app/api/matches/route.ts`                   | Cursor pagination                                                    |
| `src/app/pricing/page.tsx`                       | Server-side currency detection                                       |
| `src/app/pricing/PricingClient.tsx`              | NEW — currency + annual toggle, Dodo hosted-checkout redirect        |
| `src/app/profile/page.tsx`                       | Type savedJobs, manage subscription, delete account, resume versions |
| `src/app/layout.tsx`                             | OG/Twitter meta, favicon                                             |
| `src/lib/analytics.ts`                           | NEW — track helper                                                   |
| `public/demo.mp4`, `og-image.png`, `favicon.svg` | NEW assets                                                           |
| All files using `confirm()` / `alert()`          | Replace with Dialog                                                  |

Total: **~15 modified files, 10+ new files, 1 directory rename, 3 new assets**.

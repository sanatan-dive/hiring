# Hirin' — AI-Powered Job Matching

> Upload your resume → We find jobs everywhere → Match with AI → Deliver via email

## ✨ Features

- **AI Resume Parsing** — Upload PDF/DOCX, parsed by Gemini into structured skills, experience & embeddings
- **Job Aggregation** — Pulls from Adzuna, JSearch, RemoteOK, WeWorkRemotely + deep scraping (LinkedIn, Indeed)
- **Vector Matching** — pgvector similarity search ranks jobs by resume match score
- **Email Digests** — Weekly (free) or daily (pro) job digest emails via Resend
- **AI Cover Letter** — Generate tailored cover letters with Gemini
- **AI Interview Prep** — Role-specific mock interview questions
- **Application Tracker** — Track status across all your applications
- **Payments** — Dodo Payments (merchant-of-record) Pro subscriptions ($9/mo)

## 🏗️ Tech Stack

| Layer      | Technology                         |
| ---------- | ---------------------------------- |
| Framework  | Next.js 15 (App Router, Turbopack) |
| Auth       | Clerk                              |
| Database   | NeonDB + Prisma + pgvector         |
| Queue      | Upstash Redis + QStash             |
| Email      | Resend + React Email               |
| Payments   | Dodo Payments (merchant-of-record) |
| AI         | Google Gemini                      |
| Scraping   | Playwright                         |
| Analytics  | Umami (optional)                   |
| Monitoring | Sentry (optional)                  |
| Styling    | Tailwind CSS v4 + Framer Motion    |
| Hosting    | Vercel                             |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A NeonDB database (free tier)
- Clerk account (free tier)
- API keys for Adzuna & JSearch (RapidAPI)

### Setup

```bash
# Clone the repo
git clone https://github.com/sanatan-dive/hiring.git
cd hiring

# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env

# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

### Environment Variables

See `.env.example` for the full list. Key variables:

| Variable                                  | Required | Description                  |
| ----------------------------------------- | -------- | ---------------------------- |
| `DATABASE_URL`                            | ✅       | NeonDB connection string     |
| `CLERK_SECRET_KEY`                        | ✅       | Clerk auth secret            |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`       | ✅       | Clerk publishable key        |
| `GOOGLE_GENERATIVE_AI_API_KEY`            | ✅       | Gemini API key               |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY`        | ✅       | Adzuna job API               |
| `JSEARCH_API_KEY`                         | ✅       | JSearch via RapidAPI         |
| `RESEND_API_KEY`                          | ✅       | Resend email service         |
| `DODO_PAYMENTS_API_KEY`                   | ✅       | Dodo Payments API key        |
| `DODO_PAYMENTS_WEBHOOK_KEY`               | ✅       | Dodo webhook signing secret  |
| `DODO_PRO_PRODUCT_ID`                     | ✅       | Dodo Pro product ID          |
| `UPSTASH_REDIS_REST_URL`                  | ✅       | Upstash Redis                |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID`            | ❌       | Umami analytics (optional)   |
| `NEXT_PUBLIC_SENTRY_DSN`                  | ❌       | Sentry monitoring (optional) |

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages & API routes
│   ├── api/                # 19 API route groups
│   ├── pricing/            # Pricing page
│   ├── matches/            # Job matches page
│   ├── applications/       # Application tracker
│   └── profile/            # User profile
├── components/             # React components
│   ├── Hero/               # Landing page sections
│   ├── features/           # Feature modals (Cover Letter, Interview)
│   └── ui/                 # Reusable UI (GlowButton, JobDetailModal)
├── lib/                    # Utilities
│   ├── scrapers/           # LinkedIn, Indeed scrapers
│   ├── queue/              # Upstash queue client
│   └── email/              # Email templates
├── services/               # Business logic layer
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript types
```

## 📜 Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier format
npm run typecheck    # TypeScript check
```

## 📄 License

MIT

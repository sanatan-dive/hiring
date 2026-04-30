# Hirin' — Launch Documentation

> **"Upload your resume. We hunt jobs everywhere. AI matches them. Delivered to your inbox."**

---

## How to Use These Docs

Follow them in this exact order. Each doc is a self-contained phase. Don't skip ahead.

### Phase 0: Understand Where You Are

1. **[Architecture Overview](architecture.md)** — Current tech stack, data flow, what exists today
2. **[Audit & Improvements](audit.md)** — What's broken, what's good, what will kill you (brutal, no sugarcoating)

### Phase 1: Fix Critical Issues (Week 1-2)

3. **[Security Fixes](security.md)** — Webhook auth, rate-limit gaps, scraper detection, payment verification — fix these FIRST or you'll get burned
4. **[Test Cases](test-cases.md)** — Every test case categorized by priority. Run P0 tests before launch.

### Phase 2: Build the Business Layer (Week 3-4)

5. **[Pricing Strategy](pricing.md)** — Tiers, INR vs USD, competitor comparison, per-feature gating
6. **[Payment Integration](payment.md)** — Dodo Payments (merchant-of-record) hosted checkout, webhook-driven activation, plan lifecycle, DB schema

### Phase 3: Make It Sellable (Week 5-6)

7. **[UI/UX Improvements](ux-improvements.md)** — Landing page overhaul, matches page polish, onboarding fixes
8. **[Pre-Launch Checklist](pre-launch.md)** — Everything that must be done before you tell anyone about this

### Phase 4: Launch & Grow (Week 7-8)

9. **[Marketing Playbook](marketing.md)** — $0 budget strategy: Reddit, X, HN, Product Hunt, partner outreach
10. **[Target Audience](audience.md)** — Who will pay, who won't, what each segment needs

---

## Quick Reference

| Question                                          | Doc                                   |
| ------------------------------------------------- | ------------------------------------- |
| "What's the current tech stack?"                  | [Architecture](architecture.md)       |
| "What's broken right now?"                        | [Audit](audit.md)                     |
| "Will my scraper get me blocked?"                 | [Security](security.md)               |
| "How much should I charge?"                       | [Pricing](pricing.md)                 |
| "How do I accept payments from India + globally?" | [Payment](payment.md)                 |
| "What tests should I run?"                        | [Test Cases](test-cases.md)           |
| "What should the landing page look like?"         | [UX Improvements](ux-improvements.md) |
| "Am I ready to launch?"                           | [Pre-Launch Checklist](pre-launch.md) |
| "Where do I post for free marketing?"             | [Marketing](marketing.md)             |
| "Who is going to pay me?"                         | [Audience](audience.md)               |

---

## Sister Documents

- **[Refactor Plan](../plan/INDEX.md)** — File-by-file changes (backend, frontend, production hardening)
- **[Launch Playbook](../LAUNCH_PLAYBOOK.md)** — High-level "I'm done building, what now?" sequence

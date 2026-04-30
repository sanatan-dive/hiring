# REVIEW.md status — what's done vs what's left

Combined state after my session + overnight session merged.

| REVIEW item                                | Status | Owner                               |
| ------------------------------------------ | ------ | ----------------------------------- |
| **§1 Landing page**                        |        |                                     |
| 6 source logos in HeroPage                 | ✅     | overnight                           |
| Hero copy rewrite (differentiated)         | ❌     | TODO                                |
| 30-sec demo video                          | ❌     | user (asset)                        |
| Live stats strip                           | ❌     | TODO                                |
| Drop fake testimonials carousel            | ❌     | TODO                                |
| Typos fixed                                | ✅     | overnight                           |
| **§2 Pricing**                             |        |                                     |
| Annual toggle                              | ✅     | overnight                           |
| INR auto-detect                            | ✅     | overnight                           |
| Comparison anchor                          | ✅     | overnight                           |
| One-time add-on packs                      | ❌     | TODO                                |
| **§3 Sign-up**                             |        |                                     |
| Referral capture                           | ✅     | mine                                |
| Clerk styling                              | ❌     | TODO                                |
| Pre-signup teaser                          | ❌     | TODO                                |
| UTM persistence                            | ❌     | TODO                                |
| **§4 Onboarding**                          |        |                                     |
| Multi-step parse indicator                 | ❌     | TODO                                |
| Inline first-3-matches preview             | ❌     | TODO (biggest activation lift)      |
| Mandatory resume gate                      | ❌     | TODO                                |
| **§5 Match quality**                       |        |                                     |
| Candidate pool 500                         | ✅     | overnight                           |
| Two-stage re-ranker                        | ✅     | overnight                           |
| IVFFlat index                              | ❌     | TODO (5 min SQL)                    |
| Resume embedding cache                     | ❌     | TODO                                |
| **§6 Email digest**                        |        |                                     |
| Subject generator                          | ✅     | overnight                           |
| Brand template                             | ✅     | overnight                           |
| Resend tracking tags                       | ✅     | overnight (partial — needs webhook) |
| Resend webhook for opens/clicks            | ❌     | TODO                                |
| Retry logic                                | ❌     | TODO                                |
| Re-engagement campaigns                    | ❌     | TODO                                |
| Weekly cohort comparison email             | ❌     | TODO                                |
| **§7 Matches dashboard**                   |        |                                     |
| XSS fix                                    | ✅     | overnight                           |
| Score color thresholds                     | ✅     | overnight                           |
| Stat cards header                          | ✅     | overnight                           |
| "New since last visit" badge               | ❌     | TODO                                |
| Bulk actions                               | ❌     | TODO                                |
| Snooze button                              | ❌     | TODO                                |
| Inline search                              | ❌     | TODO                                |
| Status select replacement                  | ❌     | TODO                                |
| **§8 Applications**                        |        |                                     |
| Stat cards + kanban toggle                 | ✅     | overnight                           |
| MoreHorizontal dropdown                    | ✅     | overnight                           |
| Per-app notes/timeline                     | ❌     | TODO                                |
| Auto-reminders                             | ⚠️     | STUB (needs lastReminderAt)         |
| **§9 Cover letter**                        |        |                                     |
| Editor + tone presets + regen              | ✅     | overnight                           |
| History (localStorage)                     | ✅     | overnight                           |
| Resume picker dropdown                     | ❌     | TODO                                |
| Save to DB instead of localStorage         | ❌     | TODO                                |
| **§10 Interview prep**                     |        |                                     |
| JSON safety                                | ✅     | overnight                           |
| Practice mode                              | ✅     | overnight                           |
| Voice mode                                 | ✅     | overnight (msedge-tts)              |
| Save to DB                                 | ❌     | TODO                                |
| Follow-up generation                       | ❌     | TODO                                |
| **§11 LinkedIn scrape**                    |        |                                     |
| Paste-URL backend                          | ✅     | earlier                             |
| Railway scraper service                    | ✅     | overnight                           |
| Bulk paste UI                              | ❌     | TODO                                |
| Universal paste (Indeed/Wellfound)         | ❌     | TODO                                |
| Paste UI on /matches                       | ❌     | TODO                                |
| **§12 Job sourcing**                       |        |                                     |
| Greenhouse / Lever (via watched-companies) | ✅     | mine                                |
| Source diversity re-ranker                 | ❌     | TODO                                |
| YC scraping                                | ❌     | TODO                                |
| Drop Indeed                                | ❌     | TODO                                |
| Per-source health alerts                   | ❌     | TODO                                |
| **§13 Cron**                               |        |                                     |
| Timezone helpers                           | ✅     | mine                                |
| Hourly digest cron                         | ✅     | mine                                |
| Wire timezone into digest                  | ❌     | TODO                                |
| QStash fan-out                             | ❌     | TODO                                |
| **§14 Subscription**                       |        |                                     |
| Cancel save modal                          | ✅     | overnight                           |
| requirePro helper                          | ✅     | overnight                           |
| 50%-off save action                        | ❌     | STUB only                           |
| Pause subscription                         | ❌     | TODO                                |
| Billing history                            | ❌     | TODO                                |
| **§15 Profile**                            |        |                                     |
| Tabbed layout                              | ✅     | overnight                           |
| **§16 Backend health**                     |        |                                     |
| Admin dashboard                            | ❌     | TODO                                |
| UptimeRobot                                | ❌     | user action                         |
| **Tier 1 must-buy**                        |        |                                     |
| #1 Browser extension                       | ❌     | deferred (separate repo)            |
| #2 Auto-apply                              | ❌     | deferred                            |
| #3 Recruiter outreach                      | ✅     | mine                                |
| #4 Cover letter regen                      | ✅     | overnight                           |
| #5 Voice interview                         | ✅     | overnight                           |
| **Tier 2 must-buy**                        |        |                                     |
| #6 Watch a company                         | ✅     | mine                                |
| #7 Network analysis                        | ❌     | TODO (LinkedIn OAuth)               |
| #8 Salary insights                         | ❌     | TODO                                |
| #9 ATS scoring                             | ✅     | mine                                |
| #10 Slack delivery helpers                 | ✅     | mine (needs digest wiring)          |
| **Retention**                              |        |                                     |
| Cancel survey                              | ✅     | overnight                           |
| Lifetime referral                          | ✅     | mine                                |
| Streaks                                    | ✅     | mine (needs wiring on profile)      |
| Re-engagement cadence                      | ❌     | TODO                                |
| Weekly cohort comparison                   | ❌     | TODO                                |

## Plan for THIS session (priority order)

1. **Schema + IVFFlat infra** (5 min) — ship the explicit OVERNIGHT_RECAP TODOs
2. **Resend webhook for email tracking** (30 min)
3. **Drop Indeed + add YC sourcing + source-diversity re-ranker** (1 hour)
4. **Re-engagement campaign + weekly cohort report cron** (1 hour)
5. **Bulk + universal paste URL UI** (45 min)
6. **Salary insights basic** (45 min)
7. **"New since last visit" + Snooze on matches** (30 min)
8. **Browser extension scaffold** (45 min)

Let me start.

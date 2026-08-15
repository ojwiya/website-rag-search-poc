# Unit economics (sketch)

Assumptions for planning — replace with measured numbers from `/api/redirect` and analytics.

| Metric | Placeholder | Notes |
|---|---|---|
| Search sessions / day | TBD | Prod after Phase 1 |
| Outbound CTR (detail → agent) | Target 15–40% of detail views | Primary commercial lever |
| RPM / CPC to agent | TBD per partner | Negotiate after CTR proof |
| Lead CPA (Phase 2) | TBD | Only on contracted supply |
| Infra (Vercel + search) | Low | Static JSON + serverless |
| Hermes ops (LLM cron) | Watch with cheap models | See agent-ops |

Break-even sketch: outbound revenue ≥ hosting + Hermes cron spend + content refresh time.

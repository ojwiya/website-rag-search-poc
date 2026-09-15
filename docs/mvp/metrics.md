# Metrics

| Event | Source | Ledger / store |
|---|---|---|
| Search query | `/api/search`, `/api/properties?q=` | Optional later |
| Detail view | Next page | Optional later |
| Outbound click | `GET /api/redirect` | JSONL locally; stdout (`homes.event`) on Vercel; optional `METRICS_WEBHOOK_URL` |
| Waitlist / intro lead | `POST /api/leads` | Same dual-write as redirects (`lib/event-log.ts`) |
| Golden query pass/fail | `scripts/agent/run_search_evals.py` | cron output |
| Link health | `scripts/agent/check_outbound_links.sh` | cron output |

Hermes daily log should summarize outbound CTR and lead counts when jobs run.

Production on Vercel cannot persist JSONL (read-only FS). `recordEvent` in `lib/event-log.ts` always writes a `homes.event` line to runtime logs, tries JSONL, and POSTs to `METRICS_WEBHOOK_URL` when that env is set. A warehouse/KV is still the right Phase-1 CTR store; the webhook is the bridge until one exists.

# Metrics

| Event | Source | Ledger / store |
|---|---|---|
| Search query | `/api/search`, `/api/properties?q=` | Optional later |
| Detail view | Next page | Optional later |
| Outbound click | `POST/GET /api/redirect` | `data/redirects.jsonl` (local) / future DB |
| Waitlist / intro lead | `POST /api/leads` | `data/leads/leads.jsonl` |
| Golden query pass/fail | `scripts/agent/run_search_evals.py` | cron output |
| Link health | `scripts/agent/check_outbound_links.sh` | cron output |

Hermes daily log should summarize outbound CTR and lead counts when jobs run.

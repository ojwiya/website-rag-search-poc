# HANDOFF — website-rag-search-poc ("Homes in the Sun")

Portable summary for a new session. Last updated: 2026-08-13 (MVP-1).

## What this is
AI-operated **property aggregation** site for overseas/holiday homes: NL search,
thin listing detail, country buyer guides, tracked outbound redirects to source
listings. Branch **`mvp-1`** (cut from `airbnb-ui`).

Gumclaw is **AI-ops inspiration only** — see `docs/mvp/README.md` and `docs/agent-ops/`.

## Branch & deploy
- Working branch: **`mvp-1`** (all MVP work here).
- Prior UI branch: `airbnb-ui` (merged into mvp-1 base).
- Production (pre-MVP UX may still be live until redeploy):  
  `https://website-rag-search-poc.vercel.app`

## Key paths
| Area | Path |
|---|---|
| MVP docs | `docs/mvp/` |
| Agent ops | `docs/agent-ops/` |
| Canonical schema | `lib/canonical.ts` |
| M0 adapter | `lib/sources/yoh-snapshot.ts` |
| Guides | `content/country-guides/`, `lib/guides.ts`, `GET /api/guides/[country]` |
| Redirect | `GET /api/redirect` |
| Leads | `POST /api/leads` |
| Agent scripts | `scripts/agent/` |

## Buyer-agent foundation (no chat UI yet)
Contracts: `search`, `get_listing`, `get_country_guide`, `redirect` — see
`docs/mvp/buyer-agent-foundation.md`.

## Hermes profile
- Profile: **`homes-in-the-sun`** (`~/.hermes/profiles/homes-in-the-sun`)
- Wrapper: `homes-in-the-sun` / `hermes -p homes-in-the-sun`
- Crons (local deliver; start profile gateway for fire):
  - `homes-site-healthcheck` `*/30 * * * *` (no-agent; default BASE_URL=http://127.0.0.1:3000)
  - `homes-index-governance` `0 8 * * *`
  - `homes-search-quality` `0 9 * * *`
  - `homes-eng-triage` `0 10 * * 1-5`
  - `homes-content-guides` `0 11 * * 1`
  - `homes-leads-inbox` `0 12 * * *`
  - `homes-disk-janitor` `0 7 * * 0` (no-agent)
- Scripts also copied under profile `scripts/` for cron `--script`.
- Start gateway: `hermes -p homes-in-the-sun gateway start` (or install).

## How to verify
- Unit: `npm test`
- Build: `npm run build`
- E2E: `npx playwright test` (dev server on :3000)
- Health: `BASE_URL=http://127.0.0.1:3000 ./scripts/agent/site_healthcheck.sh`
- Corpus: `python3 scripts/agent/corpus_stats.py`

## Data / legal posture (MVP)
- Public detail is **thin teaser** + outbound CTA (not full description dump).
- M0 index = frozen `rag/properties_data.json` via `yoh-snapshot` adapter.
- M3 fat mega-portal rescrape **forbidden** without escalate (see agent-ops policies).
- Prefer future agent-direct sources (e.g. Roccabox) for canonical URLs.

## Open follow-ups
- Redeploy `mvp-1` to Vercel when ready.
- Start `hermes -p homes-in-the-sun gateway` for cron firing.
- Pilot M1/M2 Roccabox-class adapter + BD.
- Phase-2 partner lead forward (gated).

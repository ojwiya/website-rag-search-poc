# MVP-1 — Homes in the Sun

**Branch:** `mvp-1` (all work for this initiative lives here).

## North star

Homes in the Sun is an **AI-agent-operated property aggregation website** for overseas / holiday-home buyers.

- Users **discover** listings with NL search.
- We **send them** to the marketing estate agent (traffic redirection) — we are not a substitute portal.
- Detail pages add **foreign-buyer country guidance** so buyers get complete decision context.
- **Hermes** runs day-to-day ops (index health, search quality, eng, content, leads).
- **[Gumclaw](https://gumclaw.github.io/how-i-work/index.html)** is inspiration for AI-ops *capability* (memory, cron, permission tiers, skills) — not a Gumroad clone.

## Objective hierarchy

1. Aggregation product (thin multi-source index, attribution, outbound CTA)
2. AI discovery (NL search over canonical index)
3. Foreign-buyer country guides on detail
4. Commercial: Phase-1 redirection / PPC / affiliate
5. Lawful referral posture (no fat mega-portal rescrape)
6. AI operations via Hermes

## Non-objectives

- Full brokerage / “we own the listing”
- Republishing full scraped descriptions as the destination
- Copying Lumon/YOH guides verbatim
- Buyer-facing chat UI in MVP (foundation APIs only — see [buyer-agent-foundation.md](./buyer-agent-foundation.md))
- Landing this work on `main` or `airbnb-ui`

## Doc index

| Doc | Purpose |
|---|---|
| [scraping-and-referral.md](./scraping-and-referral.md) | Index thickness, adapters, pilot sources |
| [country-guides.md](./country-guides.md) | Editorial standards for buyer guides |
| [buyer-agent-foundation.md](./buyer-agent-foundation.md) | `search` / `get_listing` / `get_country_guide` / `redirect` |
| [commercials.md](./commercials.md) | Money model |
| [unit-economics.md](./unit-economics.md) | Sketch metrics |
| [data-rights.md](./data-rights.md) | ToS / DB right / copyright gates |
| [phased-rollout.md](./phased-rollout.md) | Phase 0 → 2 |
| [metrics.md](./metrics.md) | What we measure |

Agent ops contracts: [`docs/agent-ops/`](../agent-ops/).

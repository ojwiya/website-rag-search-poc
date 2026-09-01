---
type: Guide
title: Homes in the Sun — Quickstart
description: Entry point to the OpenWiki knowledge base for website-rag-search-poc, an AI-agent-operated overseas property aggregator ("Homes in the Sun") built with Next.js, Vercel, and a frozen M0 listing snapshot.
tags: [quickstart, homes-in-the-sun, overview]
---

# Homes in the Sun (website-rag-search-poc) — Quickstart

**Homes in the Sun** is an AI-agent-operated **overseas / holiday-home property aggregator**: buyers discover listings with natural-language search, see a thin teaser with foreign-buyer country guidance, and are redirected to the source estate agent. The product deliberately is **not** a full listing portal — it is an upstream discovery layer that sends traffic outbound.

This wiki is the OpenWiki knowledge base for the repository. Start here, then follow the links below.

## What the repo does

- **Next.js 14 + React 18 app** (App Router) deployed on Vercel. See [Architecture Overview](/openwiki/architecture/overview.md).
- **Natural-language property search** over the **full M0 snapshot** (~11,960 listings). Zilliz/Milvus is the search source of truth (BM25 + scalar filters); `parseSearchIntent` / AND-gate stay local. Offline TF-IDF fallback keeps `npm test` green without a cluster. See [Search and Data](/openwiki/architecture/search-and-data.md).
- **Thin referral listing model**: a canonical schema (`lib/canonical.ts`) plus source adapters (`lib/sources/yoh-snapshot.ts`). See [API Surface](/openwiki/workflows/api-surface.md).
- **Tracked outbound redirects** (`/api/redirect`) and **phase-gated leads** (`/api/leads`) — the Phase-1 commercial engine. See [Redirects and Leads](/openwiki/workflows/redirects-and-leads.md).
- **Country buyer guides** (JSON under `content/country-guides/`, Spain shipped) surfaced on detail pages.
- **Hermes agent ops**: six recurring jobs and a policy set that run day-to-day operations. See [Agent Ops](/openwiki/operations/agent-ops.md).
- **Legal posture**: thin index, attribution, no fat mega-portal rescrape. See [Business Model and Data Rights](/openwiki/architecture/business-model.md).
- **Testing**: Vitest unit/integration suites for search and canonical mapping, plus a Playwright e2e suite. See [Testing Overview](/openwiki/testing/overview.md).

## Repository map

| Area | Path | What it is |
|---|---|---|
| App routes & pages | `app/` | Homepage, property detail, country guide pages, API routes |
| Shared UI | `components/` | PropertyCard, PropertyActions, CountryGuidePanel, LeadForm, Footer, BrandLogo |
| Core logic | `lib/` | `rag.ts` (search), `canonical.ts` (schema), `urls.ts`, `guides.ts`, `public-listing.ts`, `sources/yoh-snapshot.ts` |
| Data | `rag/properties_data.json` + `rag/vector-index.json` | Full M0 hydration (~11,960) + local TF-IDF fallback |
| Guides content | `content/country-guides/` | Structured country buyer guides (Spain shipped) |
| MVP docs | `docs/mvp/` | Product, commercials, data-rights, phased rollout, metrics |
| Agent ops | `docs/agent-ops/` | Hermes SOUL, policies, jobs, golden queries |
| Ops scripts | `scripts/agent/` | Healthcheck, search evals, corpus stats, link checks, disk janitor |
| Tests | `lib/*.test.ts`, `e2e/home.spec.ts` | Vitest + Playwright |

## Run, verify, deploy

```bash
npm install
npm run dev          # dev server on :3000
npm test             # Vitest unit/integration (lib/**/*.test.ts)
npm run build        # Next build
npx playwright test  # e2e (dev server on :3000) — BASE_URL overridable
```

Operational checks:

```bash
BASE_URL=http://127.0.0.1:3000 ./scripts/agent/site_healthcheck.sh
python3 scripts/agent/corpus_stats.py
python3 scripts/agent/run_search_evals.py        # golden queries vs running server
./scripts/agent/check_outbound_links.sh          # sample canonical URLs
```

## Concept relationships (graph orientation)

- [Search and Data](/openwiki/architecture/search-and-data.md) — `searchProperties` depends on `loadProperties` (frozen snapshot); `/api/properties` dispatches to `filterProperties`/`searchProperties`/`toPublicProperties`.
- [API Surface](/openwiki/workflows/api-surface.md) — API routes are the buyer-agent foundation contracts (`search`, `get_listing`, `get_country_guide`, `redirect`).
- [Redirects and Leads](/openwiki/workflows/redirects-and-leads.md) — `/api/redirect` validates via `lib/urls.ts` and logs to `data/redirects.jsonl`; `/api/leads` gates `waitlist` vs `request_intro`.
- [Agent Ops](/openwiki/operations/agent-ops.md) — Hermes crons invoke `scripts/agent/*`; golden queries drive `run_search_evals.py` and Vitest.
- [Business Model and Data Rights](/openwiki/architecture/business-model.md) — canonical schema enforces thin referral posture; M0/M1/M2/M3 ingest modes gate what may be stored.
- [Testing Overview](/openwiki/testing/overview.md) — `lib/*.test.ts` cover search intent (price/location/bedroom/AND-logic) and canonical mapping; `e2e/home.spec.ts` covers load, search, price cap, sort, pagination, FAQ, detail, guide, waitlist consent.

## Backlog

- **Country guide content pipeline** — only `content/country-guides/spain.json` shipped; Portugal, France, Italy, Cyprus are planned. Source anchor: `docs/mvp/country-guides.md` (MVP order).
- **M1/M2 source adapter (Roccabox)** — planned `lib/sources/roccabox.ts`; blocked on BD/allowlist approval. Source anchor: `lib/sources/README.md`, `docs/mvp/scraping-and-referral.md` (pilot shortlist).
- **Phase-2 partner lead forwarding** — gated until `docs/mvp/commercials.md` marks Phase 2 live; request_intro is recorded but never auto-sent in MVP.
- **Metrics instrumentation** — redirects/leads currently log to local JSONL only; analytics/DB aggregation deferred. Source anchor: `docs/mvp/metrics.md`.

## Where to go next

- New here? Read [Architecture Overview](/openwiki/architecture/overview.md) then [Search and Data](/openwiki/architecture/search-and-data.md).
- Working on the money flow? [Redirects and Leads](/openwiki/workflows/redirects-and-leads.md).
- Running the site as an agent? [Agent Ops](/openwiki/operations/agent-ops.md).

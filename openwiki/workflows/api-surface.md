---
type: API Reference
title: API Surface
description: The buyer-agent foundation contracts and HTTP routes of Homes in the Sun — search, get_listing, get_country_guide, and redirect, plus URL helpers in lib/urls.ts.
tags: [api, contracts, routes, buyer-agent]
---

# API Surface

Homes in the Sun exposes a small, stable **buyer-agent foundation** (documented in `docs/mvp/buyer-agent-foundation.md`): the UI and any future buyer concierge agent talk to the same contracts. In MVP there is **no buyer-facing chat UI**; these contracts are the stable surface.

## Contract table

| Tool contract | HTTP route | Returns |
|---|---|---|
| `search` | `GET /api/search?q=` and `GET /api/properties?q=&...` | `{ properties, total, ... }` — index rows only |
| `get_listing` | `GET /api/properties?id=` (also used by the detail page) | Single listing; thin public fields |
| `get_country_guide` | `GET /api/guides/[country]` | Guide JSON + disclaimer + sources |
| `redirect` | `GET /api/redirect?url=&listingId=&source=` | 302 to canonical URL after logging click |

## Route details

### `GET /api/properties` (`app/api/properties/route.ts`) — the workhorse

- **`?id=N`** → single listing via `getPublicPropertyById`, 400 on non-numeric, 404 when missing.
- **Query mode**: `q`, `minPrice`, `maxPrice`, `minBeds`, `type`, `country`, `sort` (`best`|`price-asc`|`price-desc`|`newest`), `page`, `limit` (default 20).
- Pipeline: `loadProperties()` → `filterProperties()` (structured) → `searchProperties(q, 1_000_000)` (returns the **full** matched set so totals/pagination are correct — fixes `3313b5e` and `93ff183`) → server-side sort → slice → `toPublicProperties()`.
- Response: `{ properties, total, page, limit, hasMore }`. Public rows are thin (snippet only, absolute canonical URL) — see [Search and Data](/openwiki/architecture/search-and-data.md).

### `GET /api/search` (`app/api/search/route.ts`)

Minimal top-20 NL search: `?q=` → `searchProperties(properties, q, 20)` → `toPublicProperties`. Empty query returns `{ properties: [], total: 0 }`. This is the lightweight `search` contract for agents.

### `GET /api/guides/[country]` (`app/api/guides/[country]/route.ts`)

Serves a `CountryGuide` from `content/country-guides/{country}.json` via `getCountryGuide`. 404 with `{ error, available }` listing the guide countries when missing. Guide payloads always include `disclaimer` + `sources` per the grounded-claims policy.

### `GET /api/redirect` (`app/api/redirect/route.ts`)

Tracked outbound handoff (the buyer-agent `redirect` contract):

1. Validate target with `validateRedirectTarget` (`lib/urls.ts`) — http(s) only, 400 otherwise.
2. Append a JSONL click log line to `data/redirects.jsonl` (`ts`, `url`, `listingId`, `source`) — best-effort on serverless (filesystem may be read-only), redirect still happens.
3. `302` to the canonical URL.

### `POST /api/leads` (`app/api/leads/route.ts`)

Phase-gated lead capture. Body: `{ kind: 'waitlist' | 'request_intro', email, name?, message?, listingId?, source?, country?, consent }`.

- Validates email format and requires `consent: true`.
- Writes JSONL to `data/leads/leads.jsonl` with `phase: 'mvp-phase-0'`; 503 if storage fails.
- `waitlist` → autonomous storage. `request_intro` → records intent only; **no auto-forward to agents in MVP** (note field states this; policy in [Agent Ops](/openwiki/operations/agent-ops.md)).

## URL helpers (`lib/urls.ts`)

- `YOH_ORIGIN = 'https://www.youroverseashome.com'` — default origin for legacy relative listing paths.
- `toAbsoluteCanonicalUrl(url, origin?)` — resolves relative snapshot paths to absolute canonical URLs (used by the M0 adapter).
- `buildRedirectPath({ url, listingId?, source? })` — builds the `/api/redirect?...` path used by `PropertyActions`.
- `validateRedirectTarget(url)` — guards the redirect route (http(s) only). Tested in `lib/canonical.test.ts`.

## UI consumption

- Homepage (`app/page.tsx`) calls `/api/properties` with debounced query, page, limit, and sort.
- `PropertyCard` links to `/properties/[id]`; the detail page (`app/properties/[id]/page.tsx`) renders the thin teaser, specs, `PropertyActions` (redirect CTA + share), `CountryGuidePanel`, and the intro `LeadForm`. See [Redirects and Leads](/openwiki/workflows/redirects-and-leads.md).
- Guide pages (`app/guides/[country]/page.tsx`) are statically generated via `generateStaticParams` from `listGuideCountries()`.

## Change guidance

- The route handlers are thin; **behavior lives in `lib/`** — keep it there (policy: `docs/agent-ops/policies/engineering.md`).
- Any change to redirect validation, lead gating, or guide payload shape touches buyer-agent contracts: update `docs/mvp/buyer-agent-foundation.md` and the e2e suite in [Testing Overview](/openwiki/testing/overview.md).
- `vercel.json` sets `maxDuration: 30` for `app/api/**/route.ts` — keep search within that budget (the frozen snapshot + in-process scoring is designed for it).

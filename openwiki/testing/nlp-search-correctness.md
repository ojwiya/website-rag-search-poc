---
type: Testing
title: NLP Search Correctness
description: Audit of parseSearchIntent, full-corpus TF-IDF, and live Zilliz — golden totals, hard-filter violations, parser bugs that were fixed, and remaining type-keyword precision.
tags: [testing, search, nlp, rag, goldens]
---

# NLP Search Correctness

Snapshot of `parseSearchIntent`, full-corpus TF-IDF, and live Zilliz on `localhost:3002`. **26 Aug 2026.** Source: Vitest (123 passed) plus golden evals against `GET /api/properties`.

Structured price, bed, and country filters hold on **every hit** of the ~11,960 listing corpus, not the first page. Bare `3 bed` is exact 3; `3+` / `at least 3` is a floor; `less than 4 bedrooms` is max 3.

| Check | Result |
|---|---|
| Vitest | 123 passed |
| Live goldens (Zilliz) | 8/8 |
| Hard-filter violations | 0 |
| Parser bugs found and fixed | 2 |

Durable coverage lives in `lib/search-correctness.test.ts` and `docs/agent-ops/golden-queries.json`. Intent rules themselves are in [Search and Data](/openwiki/architecture/search-and-data.md). How to re-run the layers is in [Testing Overview](overview.md).

## Bugs this audit caught

### `cheap` inside `cheaper`

Qualitative `cheap` used substring match, so `cheaper than 300k` inherited the €250k cheap cap. Live total was **1648** vs **2460** for `less than €300,000`.

Fix: word-boundary match. Totals now match at **2460**.

### Comma glued to tokens

`Villa with pool, Costa del Sol` scored the term `pool,`, so the AND-gate required a literal comma. Recall was **652**.

Fix: strip leading/trailing punctuation. Live total **1432**.

## Live golden queries (Zilliz, :3002)

After the two parser fixes. Structured `maxPrice` / `beds` / `minBeds` checked on every row of the first page (`limit` 50); totals from the full match set.

| Id | Query | Total | Result |
|---|---|---|---|
| and-villa-pool-costa | Villa with pool, Costa del Sol | 1432 | pass |
| exact-3-bed-italy | 3-bed villa with pool in Italy | 31 | pass |
| 2br-apartment | 2br apartment | 3006 | pass |
| under-300k | apartment under €300,000 | 2460 | pass |
| less-than-300k | apartment less than €300,000 | 2460 | pass |
| cheaper-than-300k | apartment cheaper than 300k | 2460 | pass |
| between-200k-400k | house between 200k and 400k | 4625 | pass |
| at-least-3-bed-spain | at least 3 bedroom house spain | 1808 | pass |

## Full-corpus hard filters (local TF-IDF)

`searchProperties` over every listing. Violations = rows that break the parsed constraint. AND-gate checked on full description, not the public snippet.

| Query | Constraint | Hits | Violations |
|---|---|---|---|
| apartment under €300,000 | price ≤ 300k | 2460 | 0 |
| house between 200k and 400k | 200k–400k inclusive | 4625 | 0 |
| house from 200k to 400k | 200k–400k inclusive | 4625 | 0 |
| 3 bedroom house spain | Spain + exact 3 beds | 1187 | 0 |
| 3+ bedroom house spain | Spain + ≥3 beds | 1808 | 0 |
| less than 4 bedrooms spain | Spain + ≤3 beds | 6488 | 0 |
| more than 3 bedrooms spain | Spain + ≥4 beds | 1299 | 0 |
| 3-bed villa with pool in Italy | Italy + 3 beds + villa + pool | 31 | 0 |
| house in valencia | valencia in full listing text | 1758 | 0 |

## Recall shift after parser fixes

Hit counts for the two broken queries. Source: `GET /api/properties` on 26 Aug 2026, before vs after.

| Query | Before | After |
|---|---|---|
| Costa del Sol + pool | 652 | 1432 |
| cheaper than 300k | 1648 | 2460 |

## Type filter (landed after this audit)

As of 15 Sep 2026, `parseSearchIntent` sets `propertyType` for `apartment`/`flat` and `villa` and consumes those tokens so they are not AND-keywords on description. Local TF-IDF totals on the same corpus:

| Query | 26 Aug (AND keyword) | 15 Sep (title type) |
|---|---|---|
| apartment cheaper than 300k | 2460 | 1952 |
| Villa with pool, Costa del Sol | 1432 | 723 |

`house` remains generic and does not set `propertyType`. Zilliz has no type scalar; the title-type hard filter runs after hydration.

### Public snippets hide AND evidence

`/api/properties` replaces description with a 220-character snippet. Keyword checks against public rows under-count pool/valencia matches that succeeded on the full body. Prefer Vitest on `loadProperties()` for AND-logic; use the live API for price/beds/country.

## How to re-run

```bash
npm test                         # includes lib/search-correctness.test.ts
BASE_URL=http://127.0.0.1:3002 python3 scripts/agent/run_search_evals.py
BASE_URL=http://127.0.0.1:3002 python3 scripts/agent/probe_search_correctness.py
```

Out of scope for this audit: spatial radius, true recency, Vercel Zilliz env.

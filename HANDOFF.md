# HANDOFF — website-rag-search-poc ("Homes in the Sun")

Portable summary for a new session. Last updated: **2026-09-15**.

## What this is

AI-operated **property aggregation** site for overseas/holiday homes: NL search,
thin listing detail, country buyer guides, tracked outbound redirects to source
listings. Branch **`mvp-1`**.

Gumclaw is **AI-ops inspiration only** — see `docs/mvp/README.md` and `docs/agent-ops/`.

Start with `openwiki/quickstart.md`, then `openwiki/architecture/search-and-data.md`.

## Suggested skills (next agent)

Call these with the Skill tool before acting:

- `using-superpowers` — always, first
- `verification-before-completion` — before claiming tests/lint pass
- `test-driven-development` — any search/parser/bugfix
- `anti-ui-slop` — any web/iOS UI change (`.agents/skills/anti-ui-slop/`)
- `unslop` — user-facing prose (not emails unless asked)
- `handoff` — if asked to hand off again

## Agent model preference (this user)

- **Use:** Grok 4.6 High, Grok 4.6 Medium, Composer. Match task size to model.
- **Do not use:** Grok 4.6 High Fast, Grok 4.6 Extra High (cost).
- Grok 4.6 Medium may not be in the subagent launcher; High is the fallback for large work.

## Branch & git (as of 2026-09-15)

- Working branch: **`mvp-1`** (tracks `origin/mvp-1`).
- Production: https://website-rag-search-poc.vercel.app — footer **v0.1.0 · f227787** (promoted 15 Sep 2026; type-filter + Portugal guide).
- Vercel Production env has `ZILLIZ_URI`, `ZILLIZ_COLLECTION`, and sensitive `ZILLIZ_TOKEN` (preview too). Token was not added to Development (Vercel rejects `--sensitive` there).
- Do **not** commit `.env.local` / tokens. `.gitignore` has `.env` and `.env.*`.

`rag/properties_data.full.json` is local backup (gitignored). `venv/` is local pymilvus (gitignored).

## Search architecture (current)

Not Chroma (101MB, dropped). Not in-process-only.

1. **NL comparators (local, sync)** — `lib/rag.ts`
   - Bare **`N bed` = exact N**. `3+` / `at least N` = min. `less than N bedrooms` = max N-1.
   - Price: `under` / `less than` / `between A and B` / `from A to B`; qualitative cheap/luxury.
   - **`cheap` is word-boundary** so `cheaper than 300k` is max €300k, not the €250k cheap cap.
   - Query tokens strip leading/trailing punctuation (`pool,` → `pool`).
   - Comparator tokens (`than`, `between`) are consumed so AND-logic does not require them in listing text.
   - **`apartment`/`flat`/`villa` set `propertyType`** (title via `inferPropertyType`) and are consumed so they are not AND-keywords on description. `house` stays generic. Local totals: `apartment cheaper than 300k` **1952** (was 2460); `Villa with pool, Costa del Sol` **723** (was 1432). Zilliz has no type scalar; filter runs after hydration.
2. **Retrieve/rank** — `searchListings` in `lib/milvus.ts`
   - If `ZILLIZ_TOKEN` set: Zilliz BM25 on residual text + scalar `filter` (`price`/`bedrooms`/`country`), then hydrate from JSON + AND-gate.
   - If unset or Zilliz errors: local TF-IDF (`rag/vector-index.json`) via `searchProperties`.
3. **Hydration** — full M0 JSON (`loadProperties`). Public APIs still thin (`lib/public-listing.ts`).

Collection: **`listings`** on Zilliz Cloud serverless  
`https://in03-c1d6d9a951a5528.serverless.aws-eu-central-1.cloud.zilliz.com`

## Env (secrets)

Local file is **`.env.local`** (not `.env`). Next.js loads it. Python ingest (`npm run embed` / `scripts/rag/shed_and_embed.py`) loads the same file at startup and does **not** override vars already in the shell.

```
ZILLIZ_URI=https://in03-c1d6d9a951a5528.serverless.aws-eu-central-1.cloud.zilliz.com
ZILLIZ_TOKEN=<api key>
ZILLIZ_COLLECTION=listings
```

Never `NEXT_PUBLIC_*`. Never paste the token into chat.

**Vercel:** Production + Preview have `ZILLIZ_URI`, `ZILLIZ_TOKEN` (sensitive), `ZILLIZ_COLLECTION`. Redeployed 15 Sep 2026 (`f227787` in footer). Optional next env: `METRICS_WEBHOOK_URL` for durable click/lead ingest.

## Local ingest (already run 2026-08-25)

```bash
python3 -m venv venv
./venv/bin/pip install pymilvus
./venv/bin/python scripts/rag/shed_and_embed.py
# or: npm run embed   (loads .env.local; still needs pymilvus)
```

Verified after flush: **11,960** entities. Local Next on `:3002` with `.env.local`:

- `GET /api/properties?limit=1` → total **11960**
- `apartment under €300,000` → 2460, all ≤ 300k
- `3 bedroom house spain` → 1187, Spain / exact 3 beds
- `apartment cheaper than 300k` → 2460 (same as less-than, after cheap-substring fix)
- `Villa with pool, Costa del Sol` → 1432 (after comma-token fix; was 652)

Stats can lag until `flush`; if `row_count` looks short, flush and recount.

## How to verify

```bash
npm run lint                     # Oxlint (oxc.rs); npm run lint:next for ESLint
npm run check                    # oxlint + Vitest
npm test                         # Vitest; includes lib/search-correctness.test.ts
npm run build
npx playwright test              # BASE_URL overridable; Chromium may fail in sandbox
BASE_URL=http://127.0.0.1:3000 ./scripts/agent/site_healthcheck.sh
python3 scripts/agent/corpus_stats.py
BASE_URL=http://127.0.0.1:3002 python3 scripts/agent/run_search_evals.py
# Optional live pagination audit (keyword checks on public snippets are weaker
# than full-body AND-gate — prefer Vitest for AND-logic):
BASE_URL=http://127.0.0.1:3002 python3 scripts/agent/probe_search_correctness.py
```

Goldens: `docs/agent-ops/golden-queries.json`. Structured price/bed/country filters must hold on **every** returned row (not a 50% sample).

Last verified 2026-09-15: **oxlint clean**, **129/129 Vitest**. Prod `f227787`: healthcheck 7/7 200 (incl. Portugal), goldens 8/8, type-filter totals 1952 / 723.

NLP audit 2026-08-26 plus type-filter 2026-09-15: comparators hold on the full corpus. `apartment`/`villa` are title-type filters (1952 / 723 local totals). Do not judge AND-gate from public API snippets. Full write-up: `openwiki/testing/nlp-search-correctness.md`.

## Key paths

| Area | Path |
|---|---|
| NL search + comparators | `lib/rag.ts` |
| Zilliz port | `lib/milvus.ts` |
| Local TF-IDF | `lib/vector-index.ts` |
| Ingest | `scripts/rag/shed_and_embed.py` |
| Canonical schema | `lib/canonical.ts` |
| M0 adapter | `lib/sources/yoh-snapshot.ts` |
| Thin public rows | `lib/public-listing.ts` |
| Guides | `content/country-guides/`, `lib/guides.ts` |
| Redirect / leads | `GET /api/redirect`, `POST /api/leads`, `lib/event-log.ts` |
| Oxlint | `.oxlintrc.json`, `.github/workflows/code-checks.yml` |
| Project skills | `skills/`, `.agents/skills/anti-ui-slop/` |
| NLP search correctness audit | `openwiki/testing/nlp-search-correctness.md` |
| MVP / agent-ops | `docs/mvp/`, `docs/agent-ops/` |

Buyer-agent contracts (no chat UI): `search`, `get_listing`, `get_country_guide`, `redirect` — `docs/mvp/buyer-agent-foundation.md`.

## Hermes

- Profile: **`homes-in-the-sun`** (`~/.hermes/profiles/homes-in-the-sun`)
- Standalone gateway **cannot** run: it shares Telegram/Discord bot tokens with `default`. Those two tokens are commented out in the homes profile `.env`.
- **15 Sep 2026:** `hermes gateway migrate --multiplex` so the **default** gateway serves both profiles. Crons for homes jobs catch-up-fired after 32 days idle.
- Do not `hermes -p homes-in-the-sun gateway start --force` (token conflict / crash loop).
- Rollback: `hermes gateway migrate --standalone` (only after restoring homes bot tokens).
- Healthcheck script also hits `/api/guides/portugal`. Production Portugal is **200** as of `f227787`.
- Catch-up on 15 Sep: script jobs `homes-site-healthcheck` and `homes-disk-janitor` **ok**. Agent jobs (`search-quality`, `eng-triage`, `content-guides`, `leads-inbox`, `index-governance`) **blocked_config** — pinned to Nous Portal with no token. Re-pin those jobs to a provider that has credentials, or run `hermes auth`.

## Data / legal

- Public detail is **thin teaser** + outbound CTA (not full description dump).
- M0 = frozen snapshot via `yoh-snapshot`. M3 fat mega-portal rescrape **forbidden**.
- Prefer future agent-direct sources (Roccabox) for canonical URLs.

## Open follow-ups (next agent)

1. Optional: set Vercel `METRICS_WEBHOOK_URL` to a sheet/KV ingest. JSONL still dies on serverless; stdout `homes.event` is the current prod ledger.
2. Confirm Hermes catch-up jobs finished cleanly (`hermes -p homes-in-the-sun cron list`). Healthcheck should now pass Spain and Portugal.
3. Playwright prod smoke: 8/9 on 15 Sep (`f227787`). The detail-page test still times out waiting for heading `/Buying property in Spain/` after search `villa costa del sol` — Spain panel is present on listing `1246805`; likely first-card / locator brittleness, not a missing guide.
4. M1/M2 Roccabox adapter — still **blocked** on BD/allowlist. Do not write `lib/sources/roccabox.ts` until that decision.
5. Phase-2 partner lead forward — contracts first; do not auto-email `request_intro`.
6. Spatial radius / true recency still out of scope (no gazetteer; no listing date).
7. Cottage/penthouse/townhouse as type filters is still open; only apartment/villa landed.

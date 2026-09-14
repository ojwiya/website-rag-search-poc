# HANDOFF — website-rag-search-poc ("Homes in the Sun")

Portable summary for a new session. Last updated: **2026-08-27**.

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

## Branch & git (as of 2026-08-27)

- Working branch: **`mvp-1`** (tracks `origin/mvp-1`, **ahead 1** at `c67d1fc`).
- Production: https://website-rag-search-poc.vercel.app
- **Most search/Milvus/oxlint/skills work is uncommitted.** Do not assume Vercel has Zilliz or Oxlint CI has run on origin.
- Last pushed product commits: `8d4339f` (MVP-1), `a7cafdd` (footer `v0.1.0 · sha`). Local extra commit: `c67d1fc` OpenWiki.
- Do **not** commit `.env.local` / tokens. `.gitignore` has `.env` and `.env.*`.

Uncommitted / untracked (high signal):

- `lib/rag.ts` — comparators, word-boundary cheap vs cheaper, punctuation-stripped tokens
- `lib/milvus.ts` — Zilliz REST BM25 + `searchListings`
- `lib/vector-index.ts` — local TF-IDF fallback
- `app/api/properties/route.ts`, `app/api/search/route.ts` — async `searchListings`
- `app/page.tsx`, `app/properties/[id]/page.tsx` — logo `Link` (Oxlint nextjs rule)
- `scripts/rag/shed_and_embed.py` — restore full snapshot + TF-IDF + Milvus upsert
- `rag/properties_data.json` (~11,960, ~31MB), `rag/vector-index.json` (~12MB)
- tests: `lib/search-correctness.test.ts`, goldens (`cheaper than 300k`, 100% beds)
- Oxlint: `.oxlintrc.json`, `package.json` `lint`/`check`, `.github/workflows/code-checks.yml`
- Project skills: `skills/` and `.agents/skills/anti-ui-slop/`
- OpenWiki search pages

`rag/properties_data.full.json` is local backup (gitignored). `venv/` is local pymilvus (gitignored).

`skills/skill-doctor/assets/pierre-diffs.js` is **~1.1MB** vendored; exclude from commit unless Bob wants the full skill-doctor bundle.

## Search architecture (current)

Not Chroma (101MB, dropped). Not in-process-only.

1. **NL comparators (local, sync)** — `lib/rag.ts`
   - Bare **`N bed` = exact N**. `3+` / `at least N` = min. `less than N bedrooms` = max N-1.
   - Price: `under` / `less than` / `between A and B` / `from A to B`; qualitative cheap/luxury.
   - **`cheap` is word-boundary** so `cheaper than 300k` is max €300k, not the €250k cheap cap.
   - Query tokens strip leading/trailing punctuation (`pool,` → `pool`).
   - Comparator tokens (`than`, `between`) are consumed so AND-logic does not require them in listing text.
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

**Vercel:** Settings → Environment Variables (Production) — **not done yet**. Redeploy after adding.

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

Last verified 2026-08-27: **oxlint clean**, **123/123 Vitest**.

NLP audit 2026-08-26 (local TF-IDF + live Zilliz on :3002): comparators are correct on the full corpus. Remaining precision: `apartment` is an AND keyword on description, so some land/houses that mention apartments can rank in. Do not judge AND-gate from public API snippets. Full write-up: `openwiki/testing/nlp-search-correctness.md`.

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
| Redirect / leads | `GET /api/redirect`, `POST /api/leads` |
| Oxlint | `.oxlintrc.json`, `.github/workflows/code-checks.yml` |
| Project skills | `skills/`, `.agents/skills/anti-ui-slop/` |
| NLP search correctness audit | `openwiki/testing/nlp-search-correctness.md` |
| MVP / agent-ops | `docs/mvp/`, `docs/agent-ops/` |

Buyer-agent contracts (no chat UI): `search`, `get_listing`, `get_country_guide`, `redirect` — `docs/mvp/buyer-agent-foundation.md`.

## Hermes

- Profile: **`homes-in-the-sun`** (`~/.hermes/profiles/homes-in-the-sun`)
- Start gateway: `hermes -p homes-in-the-sun gateway start`
- Crons: healthcheck, index-governance, search-quality, eng-triage, content-guides, leads-inbox, disk-janitor — see previous HANDOFF / `docs/agent-ops/`

## Data / legal

- Public detail is **thin teaser** + outbound CTA (not full description dump).
- M0 = frozen snapshot via `yoh-snapshot`. M3 fat mega-portal rescrape **forbidden**.
- Prefer future agent-direct sources (Roccabox) for canonical URLs.

## Open follow-ups (next agent)

1. **Commit** uncommitted search/Milvus/oxlint/docs/skills (if Bob wants it) — exclude `.env.local`, `venv/`, `properties_data.full.json`, runtime `data/*.jsonl`. Consider excluding `skills/skill-doctor/assets/pierre-diffs.js` (1.1MB).
2. **Vercel:** add `ZILLIZ_URI` / `ZILLIZ_TOKEN` / `ZILLIZ_COLLECTION`, then redeploy `mvp-1`. Prod will 404/old search until then.
3. Optional: copy `.env.local` → `.env` only if some tool requires that name; Next and `shed_and_embed.py` already read `.env.local`.
4. Start Hermes gateway for crons.
5. Playwright on a normal desktop if Chromium is blocked in this environment.
6. M1/M2 Roccabox adapter + Phase-2 partner lead forward (later HANDOFF items).
7. Spatial radius / true recency still out of scope (no gazetteer; no listing date).
8. Optional product: treat `apartment`/`villa` as title-type filters instead of description AND-keywords (388/2460 land/houses leak into apartment queries).

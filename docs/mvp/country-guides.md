# Country guides — editorial standards

## Placement

Primary: **property detail page** panel keyed by `country_slug`.  
Secondary: `/guides/[country]` and Footer “Buying guide” links.

## Format

Structured JSON under `content/country-guides/{country}.json` loaded by [`lib/guides.ts`](../../lib/guides.ts).

Required fields: `country`, `title`, `updated_at`, `sections[]`, `sources[]`, `disclaimer`.

## Rules

- Original short copy only (or draft-first Hermes drafts approved by Bob)
- Attribute further-reading (Lumon, official gov pages, reputable guides)
- No wholesale republication of third-party guides
- Never assert live tax rates without a cited source checked the same session
- Always show disclaimer: educational, not legal/tax advice

## MVP order

1. Spain (`spain.json`) — ~65% of current index
2. Portugal, France, Italy, Cyprus — stubs later

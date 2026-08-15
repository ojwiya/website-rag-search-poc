# Scraping & traffic redirection

## Thesis

Position Homes in the Sun as **upstream discovery → outbound referral**, not a full listing destination. Deep links + primary “View on {Agent}” CTAs reduce (do not erase) database-right / substitute-portal risk versus republishing fat catalogues.

Not legal advice.

## Index thickness

| Level | What | MVP |
|---|---|---|
| A — Thin referral | id, source, canonical_url, title, location, country, price, currency, beds, baths, type, optional geo/ref/thumb/snippet | **Target** |
| B — Snippet | A + short excerpt for NL scoring | Optional server-side |
| C — Fat republication | Full description + gallery as destination | **Deprecated for public UX** |

## Canonical schema

See [`lib/canonical.ts`](../../lib/canonical.ts). Pipeline:

```text
Site HTML/API → source adapter → CanonicalListing → search / cards / APIs
```

Expanding pilots = **new adapters**, not redesigning `lib/rag.ts`.

## Ingest modes

| Mode | Meaning | MVP |
|---|---|---|
| M0 | Frozen snapshot | Current `rag/properties_data.json` via `yoh-snapshot` adapter |
| M1 | Allowlisted agent crawl (thin fields) | Escalate before enable; pilot Roccabox-class |
| M2 | Partner/licensed feed | Preferred end-state |
| M3 | Fat mega-portal rescrape (YOH API mirror, Rightmove bulk) | **Forbidden** |

## Source preference

**Prefer estate-agent sites** (e.g. Roccabox) as canonical URL targets — not Rightmove Overseas or YOH as the monetized click destination.

Pilot shortlist (BD + adapter work):

1. Roccabox (Costa del Sol) — primary pilot shape
2. Overseas Properties Spain / Panorama Marbella — expand after Roccabox adapter proven
3. AIPP Spain members — partnership pipeline

Current demo index remains M0 (`yoh-snapshot`) with absolute URLs to the source listing path and honest attribution.

## Product rules

1. Absolute `canonical_url` on every listing
2. Primary CTA = View on source (via `/api/redirect`)
3. Thin detail teaser — full copy lives on source
4. Source attribution on cards (no fake “Agent-verified”)
5. Click tracking through `/api/redirect`

# Buyer-agent foundation (MVP)

**In MVP:** stable tool/API surface the UI uses.  
**Out of MVP:** buyer-facing chat / concierge UI.

Ops Hermes (runs the site) ≠ future buyer concierge (serves end users).

## Contracts

| Tool | HTTP / loader | Returns |
|---|---|---|
| `search` | `GET /api/search?q=` and `GET /api/properties?q=&...` | `{ properties, total, ... }` — index rows only |
| `get_listing` | `GET /api/properties?id=` (also `getPropertyById` on the detail page) | Single listing; thin public fields |
| `get_country_guide` | `GET /api/guides/[country]` | Guide JSON + disclaimer + sources |
| `redirect` | `GET /api/redirect?url=&listingId=&source=` | 302 to canonical URL after logging click |

## Rules

- Never invent listings or prices — only index/guide data
- Guide payloads always include `disclaimer` + `sources`
- `redirect` is the intentional “done” path to the source agent
- Chat UI deferred; do not block MVP on conversational UX

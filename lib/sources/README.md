# Source adapters

Pipeline: site → adapter → `CanonicalListing` (`lib/canonical.ts`).

| Adapter | Status |
|---|---|
| `yoh-snapshot.ts` | M0 frozen demo index |
| Roccabox (planned) | M1/M2 pilot — add `roccabox.ts` when BD/allowlist approved |

Do not put site-specific fields into UI components — map in the adapter only.

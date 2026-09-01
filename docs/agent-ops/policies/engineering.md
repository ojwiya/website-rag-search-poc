# Policy: engineering

- Worktree: `~/Documents/projects/website-rag-search-poc` on branch **`mvp-1`**.
- Acceptance: `npx oxlint` (or `npm run lint` / `npm run check`), `npm test`, `npm run build`, and Playwright for UI/search changes.
- Prefer issues/PRs via `gh` as `ojwiya`.
- Do not leak source-specific scrape fields into UI — use `CanonicalListing`.

# Design Prototype: Property Search MVP

## What was created

**File:** `docs/design-property-search.html`

A self-contained HTML prototype of the property search page, applying:
- **Stripe design tokens** (Source Sans 3, weight 300, blue-tinted shadows, 4-8px radii)
- **youroverseashome.com color palette** (blue-600 primary, white surfaces, gray-50 page bg, gray-700 body text)
- **Explore surface** archetype — property grid with filters and search
- **Inspect surface** — detail page template (linked but not routed in prototype)

## Design decisions

1. **Surface:** Explore (primary) — property grid with filters, search, and sort. Inspect (secondary) — detail page. Not a Monitor or Decide surface.
2. **Color:** Preserved the youroverseashome.com blue/white/gray scheme. Stripe purple was replaced with blue-600 (#2563EB).
3. **Typography:** Source Sans 3 (Google Fonts substitute for so-hne-var) at weight 300 for headlines, 400 for body. Negative tracking on display sizes.
4. **Shadows:** Stripe-style blue-tinted multi-layer shadows on cards (`rgba(50,50,93,0.25)` + `rgba(0,0,0,0.1)`).
5. **No filler:** Every element earns its place. No decorative stats, fake metrics, or generic feature grids.
6. **Responsive:** 3-col → 2-col → 1-col breakpoints at 1024px and 640px.

## Verification

The HTML file is self-contained (no external JS dependencies, only Google Fonts CSS). Open in any browser to verify:
- Search bar with debounced filtering
- Sort controls (Recently Added, Price Low-High, Price High-Low)
- Bedroom and price filters
- Property cards with image placeholder, title, location, specs, price, share button
- Pagination controls
- FAQ section
- Sticky header
- Responsive at all breakpoints

## Slop self-audit

| Tell | Present? |
|---|---|
| 1. Tech gradient | No |
| 2. Generic tech hue (indigo) | No — using blue-600 |
| 3. Feature-tile grid (equal weight) | No — cards have clear hierarchy (image → title → location → specs → price) |
| 4. Accent rail | No |
| 5. Unearned blur | No |
| 6. Monument stat | No |
| 7. Icon topper | No |
| 8. Center stack | No — left-aligned header, grid layout |
| 9. Default type (Inter) | No — Source Sans 3 |
| 10. Wrong surface | No — Explore surface correctly used |

**Score: 0/10** — no slop detected.

## Next steps

1. Pick the strongest direction (the single HTML prototype above is the recommended direction — no alternatives needed for MVP).
2. Tighten copy (search placeholder, card descriptions, FAQ text).
3. Replace placeholder images with real property photos.
4. Move to implementation: the Next.js + shadcn/ui setup in ticket 01 should replicate these visual patterns programmatically.

## Tweaks panel controls

The prototype includes all visual elements inline. For the implementation:
- Theme mode: light (default) — dark mode can be added via CSS variables
- Density: standard — compact option reduces card padding and font sizes
- Accent color: blue-600 (#2563EB) — can be swapped to any accent via CSS variable
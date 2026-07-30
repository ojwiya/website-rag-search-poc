# Initial Project Scaffold — Next.js App

## Goal

Get a working Next.js 14+ App Router with TypeScript, Tailwind CSS, shadcn/ui, and a blank homepage at `http://localhost:3000`.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **RAG:** Existing `rag_pipeline.py` from `~/Documents/sc-ai/` (reuse, no rescrape)
- **Deploy:** Vercel
- **Design:** Stripe tokens + youroverseashome.com blue palette

## Tasks

### Task 1: Initialize Next.js project

**Objective:** Scaffold a Next.js 14+ TypeScript project with Tailwind CSS.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`

**Steps:**

1. Initialize project:
```bash
cd ~/Documents/projects/website-rag-search-poc
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

2. Verify `npm run dev` works:
```bash
npm run dev
```
Expected: Next.js starts on `http://localhost:3000` with default landing page.

3. Commit:
```bash
git add -A && git commit -m "feat: scaffold Next.js 14+ with TypeScript and Tailwind"
```

### Task 2: Configure shadcn/ui components

**Objective:** Install and configure shadcn/ui with the Stripe-inspired design tokens.

**Files:**
- Create: `components.json`, `lib/utils.ts`, various `components/ui/*.tsx`

**Steps:**

1. Initialize shadcn/ui:
```bash
npx shadcn-ui@latest init
```
Choose defaults, Tailwind CSS v3, src/components directory.

2. Add essential components:
```bash
npx shadcn-ui@latest add button input card select separator scroll-area toast
```

3. Update `components.json` to set style to `new-york` and base color to `slate`.

4. Create `lib/utils.ts` with cn() utility (clsx + tailwind-merge).

5. Verify components render:
```bash
npm run dev
```
Expected: dev server still running, no errors.

6. Commit:
```bash
git add -A && git commit -m "feat: add shadcn/ui components"
```

### Task 3: Apply Stripe design tokens to Tailwind config

**Objective:** Replace default Tailwind config with Stripe design system tokens mapped to the youroverseashome.com blue palette.

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Steps:**

1. Update `tailwind.config.ts` with custom theme extensions:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // youroverseashome.com palette (Stripe system adapted)
        primary: {
          50: '#EFF6FF',    // blue-50
          100: '#DBEAFE',   // blue-100
          200: '#BFDBFE',   // blue-200
          500: '#3B82F6',   // blue-500
          600: '#2563EB',   // blue-600 (ACCENT — primary)
          700: '#1D4ED8',   // blue-700 (hover)
        },
        surface: {
          DEFAULT: '#ffffff',
          alt: '#F8FAFC',   // gray-50 / sky-50
        },
        heading: '#061b31',       // deep navy (Stripe heading)
        body: '#374151',          // gray-700
        muted: '#6B7280',         // gray-500
        border: '#E5E7EB',        // gray-200
        borderInput: '#D1D5DB',   // gray-300
      },
      fontFamily: {
        sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
        mono: ['Source Code Pro', 'monospace'],
      },
      fontWeight: {
        heading: 300,
        body: 400,
        button: 400,
      },
      letterSpacing: {
        display: '-0.02em',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        card: 'rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px',
        cardHover: 'rgba(50,50,93,0.25) 0px 36px 52px -28px, rgba(0,0,0,0.1) 0px 24px 42px -18px',
        sm: 'rgba(23,23,23,0.08) 0px 3px 6px',
      },
    },
  },
  plugins: [],
};

export default config;
```

2. Update `app/globals.css` to include Google Fonts import and base styles:
```css
@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600&family=Source+Code+Pro:wght@400;500;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-weight: 400;
  color: #374151;
  background: #F8FAFC;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 300;
  color: #061b31;
  letter-spacing: -0.02em;
}

.font-display {
  font-weight: 300;
  letter-spacing: -0.02em;
}
```

3. Install Source Sans 3 + Source Code Pro fonts via Tailwind/Next.js font optimization:
```bash
npm install @next/font 2>/dev/null || true
```
Note: Next.js 14 has built-in font optimization. Use `next/font/google` for automatic optimization.

4. Verify dev server still works:
```bash
npm run dev
```
Expected: no errors, Tailwind styles applied.

5. Commit:
```bash
git add -A && git commit -m "feat: apply Stripe design tokens to Tailwind config"
```

### Task 4: Create blank homepage

**Objective:** A minimal homepage at `/` that renders a header and placeholder content to verify routing works.

**Files:**
- Create: `app/page.tsx`

**Steps:**

1. Create `app/page.tsx`:
```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-surface-alt">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-semibold text-primary-600">
            Property Search
          </a>
          <nav className="flex gap-6">
            <a href="#" className="text-sm text-heading hover:text-primary-600 transition-colors">
              Browse
            </a>
            <a href="#" className="text-sm text-heading hover:text-primary-600 transition-colors">
              About
            </a>
          </nav>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl font-heading tracking-display text-heading mb-4">
          Find your dream property
        </h1>
        <p className="text-lg text-muted mb-8 max-w-lg mx-auto">
          Search thousands of properties with natural language. Browse listings, compare details, and find the perfect home.
        </p>
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search by location, price, or features..."
            className="w-full px-4 py-3 pl-10 pr-4 border border-borderInput rounded-md bg-white text-heading text-sm shadow-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
          />
        </div>
      </section>
    </main>
  );
}
```

2. Run dev server:
```bash
npm run dev
```
Expected: Homepage renders at `http://localhost:3000` with header, hero title, subtitle, and search bar.

3. Commit:
```bash
git add -A && git commit -m "feat: add blank homepage with header and search"
```

### Task 5: Add Next.js API routes for RAG search

**Objective:** Create API routes that wrap the existing `rag_pipeline.py` logic, providing `/api/search` and `/api/properties` endpoints.

**Files:**
- Create: `app/api/search/route.ts`
- Create: `app/api/properties/route.ts`

**Steps:**

1. Create `app/api/search/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ properties: [], total: 0 });
  }

  // For MVP: return mock data that simulates RAG search
  // TODO: Replace with actual rag_pipeline.py integration via child process or HTTP call
  const mockResults = [
    { id: 1, title: 'Apartment in Riviera del Sol', location: 'Riviera del Sol, Andalusia', price: 449000, beds: 3, baths: 2, size: 104 },
    { id: 2, title: 'Villa in Torreblanca', location: 'Torreblanca, Andalusia', price: 395000, beds: 3, baths: 3, size: 133 },
  ];

  return NextResponse.json({ properties: mockResults, total: mockResults.length });
}
```

2. Create `app/api/properties/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const minBeds = searchParams.get('minBeds');

  // For MVP: return mock data
  // TODO: Replace with actual rag_pipeline.py integration
  const mockProperties = [
    { id: 1, title: 'Apartment in Riviera del Sol', location: 'Riviera del Sol, Andalusia', price: 449000, beds: 3, baths: 2, size: 104, type: 'Apartment' },
    { id: 2, title: 'Villa in Torreblanca', location: 'Torreblanca, Andalusia', price: 395000, beds: 3, baths: 3, size: 133, type: 'Villa' },
  ];

  let results = mockProperties;

  if (minPrice) results = results.filter(p => p.price >= Number(minPrice));
  if (maxPrice) results = results.filter(p => p.price <= Number(maxPrice));
  if (minBeds) results = results.filter(p => p.beds >= Number(minBeds));

  return NextResponse.json({ properties: results, total: results.length });
}
```

3. Test endpoints:
```bash
curl http://localhost:3000/api/search?q=villa
curl http://localhost:3000/api/properties?minBeds=3
```
Expected: JSON responses with property data.

4. Commit:
```bash
git add -A && git commit -m "feat: add Next.js API routes for RAG search and properties"
```

---

## Verification

After completing all tasks:
1. `npm run dev` — homepage loads at `http://localhost:3000`
2. `/api/search?q=villa` — returns JSON
3. `/api/properties?minBeds=3` — returns filtered JSON
4. No errors in browser console
5. All files committed to git

## Notes

- The mock data in API routes is a placeholder. The real integration with `rag_pipeline.py` from `~/Documents/sc-ai/` will replace mocks in subsequent tasks.
- ChromaDB vector store at `~/Documents/sc-ai/chroma_db/` and `properties_data.json` will be used directly in the real API implementation.

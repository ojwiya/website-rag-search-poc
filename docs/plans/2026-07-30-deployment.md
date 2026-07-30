# Deployment Plan — Vercel + Next.js

## Architecture

```
website-rag-search-poc/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage (search + property grid)
│   ├── properties/
│   │   └── [id]/
│   │       └── page.tsx   # Detail page
│   └── api/               # Next.js API routes (replaces FastAPI for MVP)
│       ├── search/route.ts    # GET /api/search?q=...
│       └── properties/route.ts # GET /api/properties?...filters
├── rag/                   # RAG logic (copy from existing rag_pipeline.py)
│   ├── pipeline.py        # search_properties(), format_property_text()
│   └── data/              # properties_data.json (existing data)
│       └── chroma_db/     # ChromaDB vector store (existing)
├── components/           # React components
│   ├── PropertyCard.tsx
│   ├── SearchBar.tsx
│   ├── FilterBar.tsx
│   └── PropertyDetail.tsx
├── lib/
│   └── chromadb.ts       # ChromaDB client setup
├── public/
├── styles/
│   └── globals.css        # Tailwind + Stripe design tokens
├── vercel.json            # Vercel deployment config
├── package.json
└── tsconfig.json
```

## Vercel Config

### vercel.json
```json
{
  "$schema": "https://openapi.vercel.sh/version.json",
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

## Deployment Steps

### 1. Local development
```bash
cd ~/Documents/projects/website-rag-search-poc
npm install
npm run dev  # http://localhost:3000
```

### 2. Vercel deployment
```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy (first time: interactive login)
vercel

# Deploy to production
vercel --prod
```

Alternative: connect GitHub repo directly in Vercel dashboard:
1. Go to vercel.com → New Project → Import `ojwiya/website-rag-search-poc`
2. Vercel auto-detects Next.js framework
3. No build config needed (vercel.json handles it)
4. Deploy

### 3. Environment variables (if needed)
No secret API keys needed for the MVP — ChromaDB reads from local `chroma_db/` directory which gets bundled at build time. For production, the data should be pre-built or loaded at deploy time.

### 4. What about FastAPI?
For MVP scope, the FastAPI layer is replaced by Next.js API routes (`app/api/`). This simplifies deployment to a single Vercel project. The RAG logic (`rag_pipeline.py`) is called directly from the API routes using the same Python environment. For a future iteration, FastAPI can be deployed as a separate Cloud Run service or AWS Lambda.

### 5. Post-deploy verification
- Homepage loads with property cards
- Search bar filters properties
- Sort controls work
- Property detail pages render
- Responsive on mobile (320px) and desktop (1440px+)
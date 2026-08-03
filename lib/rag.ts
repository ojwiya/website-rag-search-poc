// RAG search logic — TypeScript port of rag_pipeline.py
// Loads properties_data.json and provides structured filtering + text search.
// This replaces ChromaDB for Vercel-native deployment (chroma_db is 101MB, too heavy for serverless).

export interface Property {
  id: number;
  title: string;
  country_slug: string;
  locationName: string;
  price: number;
  currencyCode: string;
  eurPrice: number;
  gbpPrice: number;
  bedrooms: number | null;
  bathrooms: number | null;
  plotSize: number | null;
  buildSize: number | null;
  latitude: number;
  longitude: number;
  description: string;
  url: string;
  image_count: number;
  thumbnail_url: string | null;
  tag?: string;
}

interface PropertyData {
  properties: Property[];
  country_distribution: Record<string, number>;
}

// Cache the loaded data (module-level, persists across requests in same lambda)
let _cache: Property[] | null = null;

export function loadProperties(): Property[] {
  if (_cache) return _cache;

  // In Next.js, process.cwd() is project root
  const fs = require('fs');
  const path = require('path');
  const dataPath = path.join(process.cwd(), 'rag', 'properties_data.json');

  const raw = fs.readFileSync(dataPath, 'utf-8');
  const data: PropertyData = JSON.parse(raw);
  _cache = data.properties;
  return _cache;
}

export interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  propertyType?: string;
  country?: string;
}

export function filterProperties(
  properties: Property[],
  opts: FilterOptions
): Property[] {
  return properties.filter((p) => {
    if (opts.minPrice !== undefined && p.price < opts.minPrice) return false;
    if (opts.maxPrice !== undefined && p.price > opts.maxPrice) return false;
    if (opts.minBeds !== undefined && (p.bedrooms || 0) < opts.minBeds) return false;
    if (opts.country && p.country_slug !== opts.country) return false;
    if (opts.propertyType) {
      const type = inferPropertyType(p.title);
      if (type !== opts.propertyType.toLowerCase()) return false;
    }
    return true;
  });
}

export function inferPropertyType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('villa')) return 'villa';
  if (t.includes('apartment') || t.includes('flat')) return 'apartment';
  if (t.includes('cottage')) return 'cottage';
  if (t.includes('penthouse')) return 'penthouse';
  if (t.includes('townhouse') || t.includes('town house')) return 'townhouse';
  if (t.includes('bungalow')) return 'bungalow';
  if (t.includes('farm') || t.includes('farmhouse')) return 'farmhouse';
  if (t.includes('studio')) return 'studio';
  // "house" last: penthouse/townhouse/farmhouse also contain "house"
  // and must be matched by the more specific branches above first.
  if (t.includes('house')) return 'house';
  return 'other';
}

// Qualitative price-intent words -> structured price filters.
// "cheap" should actually drive results toward low prices, not just match text.
const PRICE_INTENT: { words: string[]; min?: number; max?: number }[] = [
  { words: ['cheap', 'affordable', 'budget', 'inexpensive'], max: 250000 },
  { words: ['luxury', 'expensive', 'premium', 'high-end', 'highend'], min: 1000000 },
];

// Country words -> country_slug so "france" filters by country, not by substring.
const COUNTRY_MAP: { words: string[]; slug: string }[] = [
  { words: ['spain', 'spanish'], slug: 'spain' },
  { words: ['france', 'french'], slug: 'france' },
  { words: ['portugal', 'portuguese'], slug: 'portugal' },
  { words: ['italy', 'italian'], slug: 'italy' },
  { words: ['cyprus'], slug: 'cyprus' },
  { words: ['malta'], slug: 'malta' },
  { words: ['greece', 'greek'], slug: 'greece' },
  { words: ['switzerland', 'swiss'], slug: 'switzerland' },
  { words: ['usa', 'america', 'american', 'unitedstates', 'states'], slug: 'usa' },
];

// Simple text-based semantic-ish search
// Score = weighted match of query terms across title, location, description, type.
// Qualitative price/country intent is applied as a hard pre-filter before scoring.
export function searchProperties(
  properties: Property[],
  query: string,
  limit = 20
): Property[] {
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/).filter((t) => t.length > 2);

  if (terms.length === 0) return properties.slice(0, limit);

  // 1. Derive structured filters from price-intent & country words.
  const filters: FilterOptions = {};
  const handled = new Set<string>();

  for (const intent of PRICE_INTENT) {
    if (intent.words.some((w) => terms.includes(w) || q.includes(w))) {
      if (intent.max !== undefined) filters.maxPrice = intent.max;
      if (intent.min !== undefined) filters.minPrice = intent.min;
      intent.words.forEach((w) => handled.add(w));
    }
  }
  for (const c of COUNTRY_MAP) {
    if (c.words.some((w) => terms.includes(w) || q.includes(w))) {
      filters.country = c.slug;
      c.words.forEach((w) => handled.add(w));
      break; // at most one country per query
    }
  }

  // Bedroom intent: "3 bedroom", "4 bed", "2br" -> minimum bedrooms filter.
  const bedMatch = q.match(/(\d+)\s*(?:bed|bedroom|bedrooms|br)\b/);
  if (bedMatch) {
    filters.minBeds = parseInt(bedMatch[1], 10);
    // Mark the numeric token + the bed-word so they aren't scored as text.
    handled.add(bedMatch[1]);
    ['bed', 'beds', 'bedroom', 'bedrooms', 'br'].forEach((w) => handled.add(w));
  }

  const base =
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minBeds !== undefined ||
    filters.country
      ? filterProperties(properties, filters)
      : properties;

  // 2. Text-score the remaining (unhandled) terms.
  const scoringTerms = terms.filter((t) => !handled.has(t));

  const scored = base.map((p) => {
    const title = p.title.toLowerCase();
    const location = p.locationName.toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const type = inferPropertyType(p.title);

    let score = 0;
    for (const term of scoringTerms) {
      // Title match (high weight)
      if (title.includes(term)) score += 10;
      // Location match (high weight)
      if (location.includes(term)) score += 8;
      // Type match
      if (type.includes(term)) score += 6;
      // Description match (low weight)
      if (desc.includes(term)) score += 2;
      // Price intent (explicit number, e.g. "200k")
      if (term.match(/^\d+k?$/)) {
        const num = parseInt(term.replace('k', '000'));
        if (p.price <= num * 1.2 && p.price >= num * 0.8) score += 5;
      }
    }

    // Price-intent ordering: when "cheap"/"luxury" is requested, let price
    // drive ranking so the cheapest (or most expensive) surfaces first
    // instead of losing to incidental text matches.
    if (filters.maxPrice !== undefined) {
      score += (filters.maxPrice - p.price) / 1000; // cheaper => higher
    }
    if (filters.minPrice !== undefined) {
      score += (p.price - filters.minPrice) / 1000; // pricier => higher
    }

    return { property: p, score };
  });

  const filtered = scored.filter((s) => s.score > 0);
  // If the only intent was price/country (no leftover text terms), keep all matches.
  const ranked = (filtered.length > 0 ? filtered : scored).sort(
    (a, b) => b.score - a.score
  );

  return ranked.slice(0, limit).map((s) => s.property);
}

export function getPropertyById(id: number): Property | undefined {
  const properties = loadProperties();
  return properties.find((p) => p.id === id);
}

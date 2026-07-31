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
  if (t.includes('house')) return 'house';
  if (t.includes('cottage')) return 'cottage';
  if (t.includes('penthouse')) return 'penthouse';
  if (t.includes('townhouse') || t.includes('town house')) return 'townhouse';
  if (t.includes('bungalow')) return 'bungalow';
  if (t.includes('farm') || t.includes('farmhouse')) return 'farmhouse';
  if (t.includes('studio')) return 'studio';
  return 'other';
}

// Simple text-based semantic-ish search
// Score = weighted match of query terms across title, location, description, type
export function searchProperties(
  properties: Property[],
  query: string,
  limit = 20
): Property[] {
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/).filter((t) => t.length > 2);

  if (terms.length === 0) return properties.slice(0, limit);

  const scored = properties.map((p) => {
    const title = p.title.toLowerCase();
    const location = p.locationName.toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const type = inferPropertyType(p.title);

    let score = 0;
    for (const term of terms) {
      // Title match (high weight)
      if (title.includes(term)) score += 10;
      // Location match (high weight)
      if (location.includes(term)) score += 8;
      // Type match
      if (type.includes(term)) score += 6;
      // Description match (low weight)
      if (desc.includes(term)) score += 2;
      // Price intent
      if (term.match(/^\d+k?$/)) {
        const num = parseInt(term.replace('k', '000'));
        if (p.price <= num * 1.2 && p.price >= num * 0.8) score += 5;
      }
      // Bedroom intent
      if (term.match(/^\d+bed/)) {
        const beds = parseInt(term);
        if ((p.bedrooms || 0) >= beds) score += 4;
      }
    }

    return { property: p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.property);
}

export function getPropertyById(id: number): Property | undefined {
  const properties = loadProperties();
  return properties.find((p) => p.id === id);
}

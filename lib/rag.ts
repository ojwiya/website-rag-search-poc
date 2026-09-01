// RAG search — structured intent (metadata `where`) stays local.
// Rank/retrieve against Zilliz/Milvus when configured; else local TF-IDF.

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
  /** Present on public API rows; derived from the full listing body. */
  hasPool?: boolean;
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
  const fullPath = path.join(process.cwd(), 'rag', 'properties_data.full.json');
  const dataPath = path.join(process.cwd(), 'rag', 'properties_data.json');
  const chosen = fs.existsSync(fullPath) ? fullPath : dataPath;

  const raw = fs.readFileSync(chosen, 'utf-8');
  const data: PropertyData = JSON.parse(raw);
  _cache = data.properties;
  return _cache;
}

export interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  beds?: number;
  propertyType?: string;
  country?: string;
}

/** Structured NL intent. Bare "N bed" is exact; "N+" / "at least N" is a floor. */
export type SearchIntent = {
  price?: { min?: number; max?: number };
  beds?: { min?: number; max?: number; exact?: number };
  country?: string;
};

export function filterProperties(
  properties: Property[],
  opts: FilterOptions
): Property[] {
  return properties.filter((p) => {
    if (opts.minPrice !== undefined && p.price < opts.minPrice) return false;
    if (opts.maxPrice !== undefined && p.price > opts.maxPrice) return false;
    if (opts.minBeds !== undefined && (p.bedrooms || 0) < opts.minBeds) return false;
    if (opts.maxBeds !== undefined && (p.bedrooms || 0) > opts.maxBeds) return false;
    // Exact bedroom count (natural-language "3 bed" => exactly 3, not 3+).
    if (opts.beds !== undefined && (p.bedrooms || 0) !== opts.beds) return false;
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

// Words that carry no search intent (prepositions, articles, conjunctions).
// They must not be required as AND-terms or scored.
const STOPWORDS = new Set([
  'with', 'the', 'and', 'in', 'of', 'for', 'near', 'to', 'a', 'an', 'by', 'at',
  'on', 'de', 'del', 'la', 'el', 'los', 'las', 'from', 'that', 'this', 'has',
  'have', 'my', 'our', 'your',
]);

// Generic dwelling nouns that should match ANY property type (loose intent),
// as opposed to specific types (villa, apartment, cottage, ...) which are
// hard requirements when present in a query.
const GENERIC_NOUNS = new Set([
  'house', 'home', 'property', 'properties', 'building', 'place', 'flat',
]);

const PRICE_TOKEN = String.raw`€?\s*\d[\d,.]*\s*(?:k|million|millions|m)?`;
const BED_UNIT = String.raw`(?:beds?|bedrooms?|br)\b`;
const BED_GAP = String.raw`\s*(?:-|–|—)?\s*`;

function hasWord(hay: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(hay);
}

function tokenizeQuery(q: string): string[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/^[^a-z0-9€+]+|[^a-z0-9€+]+$/gi, ''))
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function parseAmount(raw: string): number | null {
  const mult = /million/i.test(raw) ? 1_000_000 : /m/i.test(raw) ? 1_000_000 : /k/i.test(raw) ? 1_000 : 1;
  const num = parseFloat(raw.replace(/[^\d.]/g, ''));
  return Number.isFinite(num) && num > 0 ? num * mult : null;
}

function markHandled(handled: Set<string>, ...chunks: string[]) {
  for (const chunk of chunks) {
    const lower = chunk.toLowerCase().trim();
    if (!lower) continue;
    handled.add(lower);
    for (const tok of lower.split(/[^a-z0-9€.+]+/)) {
      if (tok) handled.add(tok);
    }
  }
}

function tightenPrice(intent: SearchIntent, min?: number, max?: number) {
  if (min == null && max == null) return;
  intent.price = intent.price ?? {};
  if (min != null) {
    intent.price.min = intent.price.min != null ? Math.max(intent.price.min, min) : min;
  }
  if (max != null) {
    intent.price.max = intent.price.max != null ? Math.min(intent.price.max, max) : max;
  }
}

function setBeds(
  intent: SearchIntent,
  spec: { min?: number; max?: number; exact?: number }
) {
  intent.beds = { ...intent.beds, ...spec };
}

/**
 * Parse natural-language comparators into structured filters and the set of
 * tokens that must not be required as AND keyword terms.
 */
export function parseSearchIntent(query: string): {
  intent: SearchIntent;
  handled: Set<string>;
} {
  const q = query.toLowerCase().trim();
  const intent: SearchIntent = {};
  const handled = new Set<string>();
  let rest = q;

  const consume = (re: RegExp): RegExpMatchArray | null => {
    const m = rest.match(re);
    if (!m || m.index === undefined) return null;
    markHandled(handled, m[0]);
    rest = `${rest.slice(0, m.index)} ${rest.slice(m.index + m[0].length)}`
      .replace(/\s+/g, ' ')
      .trim();
    return m;
  };

  for (const c of COUNTRY_MAP) {
    if (c.words.some((w) => q.includes(w))) {
      intent.country = c.slug;
      c.words.forEach((w) => handled.add(w));
      break;
    }
  }

  for (const row of PRICE_INTENT) {
    if (row.words.some((w) => hasWord(q, w))) {
      tightenPrice(intent, row.min, row.max);
      row.words.forEach((w) => handled.add(w));
    }
  }

  // Bedroom phrases first so their numbers are not treated as prices.
  const betweenBeds = consume(
    new RegExp(`between\\s+(\\d+)\\s+and\\s+(\\d+)${BED_GAP}${BED_UNIT}`)
  );
  if (betweenBeds) {
    const a = parseInt(betweenBeds[1], 10);
    const b = parseInt(betweenBeds[2], 10);
    setBeds(intent, { min: Math.min(a, b), max: Math.max(a, b) });
  }

  const fromToBeds = consume(
    new RegExp(`from\\s+(\\d+)\\s+to\\s+(\\d+)${BED_GAP}${BED_UNIT}`)
  );
  if (fromToBeds) {
    const a = parseInt(fromToBeds[1], 10);
    const b = parseInt(fromToBeds[2], 10);
    setBeds(intent, { min: Math.min(a, b), max: Math.max(a, b) });
  }

  const atLeastBeds = consume(
    new RegExp(
      `(?:at\\s+least|no\\s+fewer\\s+than|minimum(?:\\s+of)?)\\s+(\\d+)${BED_GAP}${BED_UNIT}`
    )
  );
  if (atLeastBeds) setBeds(intent, { min: parseInt(atLeastBeds[1], 10) });

  const plusBeds = consume(new RegExp(`(\\d+)\\s*\\+\\s*${BED_UNIT}`));
  if (plusBeds) setBeds(intent, { min: parseInt(plusBeds[1], 10) });

  const orMoreBeds = consume(
    new RegExp(`(\\d+)\\s+or\\s+more${BED_GAP}${BED_UNIT}`)
  );
  if (orMoreBeds) setBeds(intent, { min: parseInt(orMoreBeds[1], 10) });

  const lessThanBeds = consume(
    new RegExp(`(?:less|fewer)\\s+than\\s+(\\d+)${BED_GAP}${BED_UNIT}`)
  );
  if (lessThanBeds) {
    const n = parseInt(lessThanBeds[1], 10);
    setBeds(intent, { max: Math.max(0, n - 1) });
  }

  const maxBeds = consume(
    new RegExp(
      `(?:under|below|up\\s+to|no\\s+more\\s+than|at\\s+most|max(?:imum)?)\\s+(\\d+)${BED_GAP}${BED_UNIT}`
    )
  );
  if (maxBeds) setBeds(intent, { max: parseInt(maxBeds[1], 10) });

  const moreThanBeds = consume(
    new RegExp(`(?:more\\s+than|over|above)\\s+(\\d+)${BED_GAP}${BED_UNIT}`)
  );
  if (moreThanBeds) setBeds(intent, { min: parseInt(moreThanBeds[1], 10) + 1 });

  if (!intent.beds) {
    const exactBeds = consume(new RegExp(`(\\d+)${BED_GAP}${BED_UNIT}`));
    if (exactBeds) setBeds(intent, { exact: parseInt(exactBeds[1], 10) });
  }

  if (intent.beds) {
    ['bed', 'beds', 'bedroom', 'bedrooms', 'br'].forEach((w) => handled.add(w));
  }

  const betweenPrice = consume(
    new RegExp(`between\\s+(${PRICE_TOKEN})\\s+and\\s+(${PRICE_TOKEN})`, 'i')
  );
  if (betweenPrice) {
    const a = parseAmount(betweenPrice[1]);
    const b = parseAmount(betweenPrice[2]);
    if (a != null && b != null) tightenPrice(intent, Math.min(a, b), Math.max(a, b));
  }

  const fromToPrice = consume(
    new RegExp(`from\\s+(${PRICE_TOKEN})\\s+to\\s+(${PRICE_TOKEN})`, 'i')
  );
  if (fromToPrice) {
    const a = parseAmount(fromToPrice[1]);
    const b = parseAmount(fromToPrice[2]);
    if (a != null && b != null) tightenPrice(intent, Math.min(a, b), Math.max(a, b));
  }

  const dashPrice = consume(
    new RegExp(`(${PRICE_TOKEN})\\s*[-–—]\\s*(${PRICE_TOKEN})`, 'i')
  );
  if (dashPrice) {
    const a = parseAmount(dashPrice[1]);
    const b = parseAmount(dashPrice[2]);
    if (a != null && b != null) tightenPrice(intent, Math.min(a, b), Math.max(a, b));
  }

  const priceNotBeds = new RegExp(
    `${PRICE_TOKEN}(?!\\s*(?:-|–|—)?\\s*(?:bed|br|bedroom|bedrooms))`,
    'gi'
  );
  const rawPrices = rest.match(priceNotBeds) || [];
  const numberWords = rawPrices
    .map(parseAmount)
    .filter((n): n is number => n !== null);

  const underish =
    /\b(under|below|beneath|less|max|up to|within|cheaper than)\b/.test(rest);
  const overish =
    /\b(over|above|more than|exceeding|from|starting)\b/.test(rest);

  if (numberWords.length > 0) {
    rawPrices.forEach((raw) => markHandled(handled, raw));
    if (underish) {
      tightenPrice(intent, undefined, Math.min(...numberWords));
      markHandled(
        handled,
        'under',
        'below',
        'beneath',
        'less',
        'than',
        'max',
        'within',
        'cheaper',
        'up'
      );
    } else if (overish) {
      tightenPrice(intent, Math.max(...numberWords), undefined);
      markHandled(
        handled,
        'over',
        'above',
        'more',
        'than',
        'exceeding',
        'from',
        'starting'
      );
    } else if (!intent.price?.min && !intent.price?.max) {
      const n = numberWords[0];
      tightenPrice(intent, n * 0.8, n * 1.2);
    }
  }

  return { intent, handled };
}

function intentToFilters(intent: SearchIntent): FilterOptions {
  return {
    minPrice: intent.price?.min,
    maxPrice: intent.price?.max,
    minBeds: intent.beds?.min,
    maxBeds: intent.beds?.max,
    beds: intent.beds?.exact,
    country: intent.country,
  };
}

/** Milvus boolean expr from parsed NL intent (scalar fields on the collection). */
export function intentToMilvusExpr(intent: SearchIntent): string {
  const parts: string[] = [];
  if (intent.price?.min != null) parts.push(`price >= ${intent.price.min}`);
  if (intent.price?.max != null) parts.push(`price <= ${intent.price.max}`);
  if (intent.beds?.exact != null) parts.push(`bedrooms == ${intent.beds.exact}`);
  if (intent.beds?.min != null) parts.push(`bedrooms >= ${intent.beds.min}`);
  if (intent.beds?.max != null) parts.push(`bedrooms <= ${intent.beds.max}`);
  if (intent.country) {
    const safe = String(intent.country).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    parts.push(`country == "${safe}"`);
  }
  return parts.join(' and ');
}

/** Chroma-style metadata where clause from parsed NL intent. */
export function intentToWhere(intent: SearchIntent): Record<string, unknown> {
  const parts: Record<string, unknown>[] = [];
  if (intent.price?.min != null) parts.push({ price: { $gte: intent.price.min } });
  if (intent.price?.max != null) parts.push({ price: { $lte: intent.price.max } });
  if (intent.beds?.exact != null) parts.push({ bedrooms: { $eq: intent.beds.exact } });
  if (intent.beds?.min != null) parts.push({ bedrooms: { $gte: intent.beds.min } });
  if (intent.beds?.max != null) parts.push({ bedrooms: { $lte: intent.beds.max } });
  if (intent.country) parts.push({ country: { $eq: intent.country } });
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

function hasStructuredFilters(filters: FilterOptions): boolean {
  return (
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minBeds !== undefined ||
    filters.maxBeds !== undefined ||
    filters.beds !== undefined ||
    Boolean(filters.country)
  );
}

import { loadVectorIndex, encodeQuery, cosineSparse } from './vector-index';

export type SearchPlan = {
  intent: SearchIntent;
  handled: Set<string>;
  filters: FilterOptions;
  terms: string[];
  embedTerms: string[];
  scoringTerms: string[];
};

/** Split a query into structured filters vs residual terms for ranking / AND-gate. */
export function getSearchPlan(query: string): SearchPlan {
  const q = query.toLowerCase().trim();
  const terms = tokenizeQuery(q);
  const { intent, handled } = parseSearchIntent(query);
  const filters = intentToFilters(intent);
  const embedTerms = terms.filter((t) => !handled.has(t));
  const scoringTerms = embedTerms.filter((t) => !GENERIC_NOUNS.has(t));
  return { intent, handled, filters, terms, embedTerms, scoringTerms };
}

export function listingMatchesTerms(p: Property, scoringTerms: string[]): boolean {
  if (scoringTerms.length === 0) return true;
  const title = p.title.toLowerCase();
  const location = p.locationName.toLowerCase();
  const desc = (p.description || '').toLowerCase();
  const type = inferPropertyType(p.title);
  return scoringTerms.every(
    (term) =>
      title.includes(term) ||
      location.includes(term) ||
      type.includes(term) ||
      desc.includes(term)
  );
}

// Simple text-based semantic-ish search
// Score = weighted match of query terms across title, location, description, type.
// Qualitative price/country intent is applied as a hard pre-filter before scoring.
export function searchProperties(
  properties: Property[],
  query: string,
  limit = 20
): Property[] {
  const { terms, filters, embedTerms, scoringTerms } = getSearchPlan(query);

  if (terms.length === 0) return properties.slice(0, limit);

  const base = hasStructuredFilters(filters)
    ? filterProperties(properties, filters)
    : properties;

  const vIndex = loadVectorIndex();
  const qVec =
    vIndex && embedTerms.length > 0
      ? encodeQuery(embedTerms.join(' '), vIndex)
      : null;
  const vecPos =
    vIndex && qVec
      ? new Map(vIndex.ids.map((id, i) => [id, i] as const))
      : null;

  const scored = base.map((p) => {
    const title = p.title.toLowerCase();
    const location = p.locationName.toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const type = inferPropertyType(p.title);

    let score = 0;
    // Track which scoring terms actually matched this property, so we can
    // enforce AND-logic: a result must contain EVERY meaningful query term
    // (not just any one of them).
    const matchedTerms = new Set<string>();
    for (const term of scoringTerms) {
      let termScore = 0;
      // Title match (high weight)
      if (title.includes(term)) termScore += 10;
      // Location match (high weight)
      if (location.includes(term)) termScore += 8;
      // Type match
      if (type.includes(term)) termScore += 6;
      // Description match (low weight)
      if (desc.includes(term)) termScore += 2;
      // Price intent (explicit number, e.g. "200k")
      if (term.match(/^\d+k?$/)) {
        const num = parseInt(term.replace('k', '000'));
        if (p.price <= num * 1.2 && p.price >= num * 0.8) termScore += 5;
      }
      if (termScore > 0) {
        score += termScore;
        matchedTerms.add(term);
      }
    }

    // Only count as a match if the property contains every meaningful
    // (non-structured, non-stopword) query term. Structured filters
    // (country/price/beds) are already applied as hard pre-filters above.
    // Generic dwelling nouns ("house", "home"...) are treated as matching any
    // type, so they don't gate the result.
    const matchedAllTerms = scoringTerms.every(
      (t) => matchedTerms.has(t) || GENERIC_NOUNS.has(t)
    );

    // Price-intent ordering: when "cheap"/"luxury" is requested, let price
    // drive ranking so the cheapest (or most expensive) surfaces first
    // instead of losing to incidental text matches.
    if (filters.maxPrice !== undefined) {
      score += (filters.maxPrice - p.price) / 1000; // cheaper => higher
    }
    if (filters.minPrice !== undefined) {
      score += (p.price - filters.minPrice) / 1000; // pricier => higher
    }

    if (matchedAllTerms && qVec && vecPos && vIndex) {
      const row = vecPos.get(p.id);
      if (row !== undefined) {
        const vec = vIndex.vectors[row];
        score += cosineSparse(qVec.i, qVec.w, vec.i, vec.w) * 40;
      }
    }

    return { property: p, score: matchedAllTerms ? score : 0 };
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

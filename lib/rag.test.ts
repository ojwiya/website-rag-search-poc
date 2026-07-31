import { describe, it, expect } from 'vitest';
import { searchProperties, filterProperties, inferPropertyType, loadProperties, type Property } from './rag';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
// Rich enough to deterministically exercise price, location, country, feature
// and bedroom intent in natural-language queries. Prices are in EUR.

function prop(p: Partial<Property> & Pick<Property, 'id' | 'title' | 'country_slug' | 'locationName' | 'price' | 'eurPrice'>): Property {
  return {
    currencyCode: 'EUR',
    gbpPrice: p.eurPrice,
    bedrooms: null,
    bathrooms: null,
    plotSize: null,
    buildSize: null,
    latitude: 0,
    longitude: 0,
    description: '',
    url: '',
    image_count: 0,
    thumbnail_url: null,
    ...p,
  };
}

const fixtures: Property[] = [
  // --- France, cheap houses ---
  prop({ id: 1, title: 'House in Ansac-sur-Vienne', country_slug: 'france', locationName: 'Ansac-sur-Vienne', price: 136250, eurPrice: 136250, description: 'cheap countryside house with garden', bedrooms: 3 }),
  prop({ id: 2, title: 'House in Pardaillan', country_slug: 'france', locationName: 'Pardaillan', price: 895000, eurPrice: 895000, description: 'luxury chateau', bedrooms: 5 }),
  prop({ id: 3, title: 'Cheap studio in Dordogne', country_slug: 'france', locationName: 'Dordogne', price: 49950, eurPrice: 49950, description: 'affordable small house with pool', bedrooms: 1 }),
  // --- Spain, villa with pool ---
  prop({ id: 4, title: 'Villa in Valencia', country_slug: 'spain', locationName: 'Valencia', price: 425000, eurPrice: 425000, description: 'modern villa with private pool and sea view', bedrooms: 4 }),
  prop({ id: 5, title: 'Villa in Costa Blanca', country_slug: 'spain', locationName: 'Costa Blanca, Alicante', price: 550000, eurPrice: 550000, description: 'beachfront villa with pool and garden', bedrooms: 5 }),
  prop({ id: 6, title: 'House in Riviera del Sol', country_slug: 'spain', locationName: 'Riviera del Sol', price: 425000, eurPrice: 425000, description: 'expensive house near the sea', bedrooms: 3 }),
  // --- Portugal, affordable apartment ---
  prop({ id: 7, title: 'Apartment in Lisbon', country_slug: 'portugal', locationName: 'Lisbon', price: 38000, eurPrice: 38000, description: 'affordable apartment with balcony', bedrooms: 2 }),
  prop({ id: 8, title: 'Apartment in Porto', country_slug: 'portugal', locationName: 'Porto', price: 1500000, eurPrice: 1500000, description: 'luxury apartment with sea view', bedrooms: 2 }),
  // --- Malta, a non-pool house to test feature ranking ---
  prop({ id: 9, title: 'House in Republic of Malta', country_slug: 'malta', locationName: 'Republic of Malta', price: 20000, eurPrice: 20000, description: 'budget house, no pool', bedrooms: 2 }),
  // --- Featureless 3-bed Spain house (to test bedroom filter) ---
  prop({ id: 10, title: 'House in Murcia', country_slug: 'spain', locationName: 'Murcia', price: 200000, eurPrice: 200000, description: 'family house', bedrooms: 3 }),
  prop({ id: 11, title: 'House in Murcia', country_slug: 'spain', locationName: 'Murcia', price: 180000, eurPrice: 180000, description: 'family house', bedrooms: 2 }),
];

// ---------------------------------------------------------------------------
// PRICE intent
// ---------------------------------------------------------------------------
describe('searchProperties — price intent in natural language', () => {
  it('"cheap house in France" returns ONLY cheap France houses', () => {
    const r = searchProperties(fixtures, 'cheap house in France', 20);
    expect(r.length).toBeGreaterThan(0);
    for (const p of r) {
      expect(p.country_slug).toBe('france');
      expect(p.eurPrice).toBeLessThanOrEqual(250000);
    }
    const ids = r.map((p) => p.id);
    expect(ids).not.toContain(2); // €895k France chateau excluded by cheap cap
    expect(ids).not.toContain(6); // Spain house excluded by country filter
  });

  it('"cheap house in France" ranks cheapest-first', () => {
    const r = searchProperties(fixtures, 'cheap house in France', 20);
    const prices = r.map((p) => p.eurPrice);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('"luxury villa" returns ONLY properties >= €1M', () => {
    const r = searchProperties(fixtures, 'luxury villa', 20);
    expect(r.length).toBeGreaterThan(0);
    for (const p of r) expect(p.eurPrice).toBeGreaterThanOrEqual(1000000);
    const ids = r.map((p) => p.id);
    expect(ids).toContain(8); // €1.5M Portugal apartment (villa/luxury match)
    expect(ids).not.toContain(4); // €425k villa excluded by luxury floor
  });

  it('"affordable apartment portugal" returns Portugal & <= €250k', () => {
    const r = searchProperties(fixtures, 'affordable apartment portugal', 20);
    for (const p of r) {
      expect(p.country_slug).toBe('portugal');
      expect(p.eurPrice).toBeLessThanOrEqual(250000);
    }
    expect(r.map((p) => p.id)).toContain(7);
    expect(r.map((p) => p.id)).not.toContain(8); // €1.5M excluded
  });

  it('explicit "house 200k" biases toward ~€200k', () => {
    const r = searchProperties(fixtures, 'house 200k', 20);
    const near = r.filter((p) => p.eurPrice >= 160000 && p.eurPrice <= 240000);
    expect(near.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// LOCATION intent
// ---------------------------------------------------------------------------
describe('searchProperties — location intent in natural language', () => {
  it('"house in valencia" surfaces the Valencia property', () => {
    const r = searchProperties(fixtures, 'house in valencia', 20);
    const val = r.find((p) => p.id === 4); // Villa in Valencia
    expect(val).toBeDefined();
    expect(val!.locationName.toLowerCase()).toContain('valencia');
  });

  it('"villa in costa blanca" ranks the Costa Blanca property first', () => {
    const r = searchProperties(fixtures, 'villa in costa blanca', 20);
    expect(r[0].id).toBe(5); // Costa Blanca villa ranks top
    expect(r[0].locationName.toLowerCase()).toContain('costa');
  });

  it('country word "spain" filters by country_slug, not substring', () => {
    const r = searchProperties(fixtures, 'house spain', 20);
    for (const p of r) expect(p.country_slug).toBe('spain');
    expect(r.map((p) => p.id)).not.toContain(1); // France house excluded
    expect(r.map((p) => p.id)).toContain(10); // Spain house included
  });
});

// ---------------------------------------------------------------------------
// FEATURE intent (description keywords)
// ---------------------------------------------------------------------------
describe('searchProperties — feature intent in natural language', () => {
  it('"villa with pool" ranks pool properties above non-pool', () => {
    const r = searchProperties(fixtures, 'villa with pool', 20);
    // The pool villas (4,5) must outrank the sea-house (6) which has no "pool".
    const poolIds = [4, 5];
    const nonPool = 6;
    const topPool = Math.min(...poolIds.map((id) => r.findIndex((p) => p.id === id)));
    const nonPoolIdx = r.findIndex((p) => p.id === nonPool);
    if (nonPoolIdx !== -1) expect(topPool).toBeLessThan(nonPoolIdx);
  });

  it('"house with garden" surfaces garden descriptions', () => {
    const r = searchProperties(fixtures, 'house with garden', 20);
    expect(r.map((p) => p.id)).toContain(1); // "house with garden" in France
    expect(r.map((p) => p.id)).toContain(5); // "garden" in Costa Blanca villa
  });

  it('"apartment with sea view" surfaces sea-view descriptions', () => {
    const r = searchProperties(fixtures, 'apartment with sea view', 20);
    expect(r.map((p) => p.id)).toContain(8); // "sea view" luxury apartment
    expect(r.map((p) => p.id)).toContain(4); // villa "sea view"
  });
});

// ---------------------------------------------------------------------------
// BEDROOM intent
// ---------------------------------------------------------------------------
describe('searchProperties — bedroom intent in natural language', () => {
  it('"3 bedroom house spain" requires >= 3 bedrooms AND country spain', () => {
    const r = searchProperties(fixtures, '3 bedroom house spain', 20);
    for (const p of r) {
      expect(p.country_slug).toBe('spain');
      expect((p.bedrooms || 0)).toBeGreaterThanOrEqual(3);
    }
    expect(r.map((p) => p.id)).toContain(10); // 3-bed Spain house
    expect(r.map((p) => p.id)).not.toContain(11); // 2-bed Spain house excluded
  });

  it('"2br apartment" requires >= 2 bedrooms', () => {
    const r = searchProperties(fixtures, '2br apartment', 20);
    for (const p of r) expect((p.bedrooms || 0)).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Low-level unit checks
// ---------------------------------------------------------------------------
describe('inferPropertyType', () => {
  it('maps titles to property types', () => {
    expect(inferPropertyType('Villa in Spain')).toBe('villa');
    expect(inferPropertyType('Apartment in Lisbon')).toBe('apartment');
    expect(inferPropertyType('House in France')).toBe('house');
    expect(inferPropertyType('Penthouse in NYC')).toBe('penthouse');
  });
});

describe('filterProperties', () => {
  it('applies minPrice / maxPrice / minBeds / country together', () => {
    const r = filterProperties(fixtures, { country: 'spain', minBeds: 3, maxPrice: 500000 });
    for (const p of r) {
      expect(p.country_slug).toBe('spain');
      expect((p.bedrooms || 0)).toBeGreaterThanOrEqual(3);
      expect(p.eurPrice).toBeLessThanOrEqual(500000);
    }
    expect(r.map((p) => p.id)).toEqual(expect.arrayContaining([4, 6, 10]));
  });
});

// ---------------------------------------------------------------------------
// Integration against the REAL dataset (guards regressions on live data)
// ---------------------------------------------------------------------------
describe('searchProperties — integration over real properties_data.json', () => {
  const all = loadProperties();

  function topN(query: string, n = 20) {
    return searchProperties(all, query, n);
  }
  function coverage(props: Property[], pred: (p: Property) => boolean) {
    return props.filter(pred).length;
  }

  it('"cheap house" -> all <= €250k', () => {
    const r = topN('cheap house');
    expect(coverage(r, (p) => p.eurPrice <= 250000)).toBe(20);
  });

  it('"luxury villa" -> all >= €1M', () => {
    const r = topN('luxury villa');
    expect(coverage(r, (p) => p.eurPrice >= 1000000)).toBe(20);
  });

  it('"house in valencia" -> location contains valencia', () => {
    const r = topN('house in valencia');
    expect(coverage(r, (p) => p.locationName.toLowerCase().includes('valencia'))).toBe(20);
  });

  it('"villa in costa blanca" -> location contains costa', () => {
    const r = topN('villa in costa blanca');
    expect(coverage(r, (p) => p.locationName.toLowerCase().includes('costa'))).toBe(20);
  });

  it('"villa with pool" -> description mentions pool', () => {
    const r = topN('villa with pool');
    expect(coverage(r, (p) => (p.description || '').toLowerCase().includes('pool'))).toBe(20);
  });

  it('"house with garden" -> description mentions garden', () => {
    const r = topN('house with garden');
    expect(coverage(r, (p) => (p.description || '').toLowerCase().includes('garden'))).toBe(20);
  });

  it('"apartment with sea view" -> description mentions sea (>=19/20)', () => {
    const r = topN('apartment with sea view');
    expect(coverage(r, (p) => (p.description || '').toLowerCase().includes('sea'))).toBeGreaterThanOrEqual(19);
  });

  it('"3 bedroom house spain" -> >= 3 beds AND country spain', () => {
    const r = topN('3 bedroom house spain');
    expect(coverage(r, (p) => (p.bedrooms || 0) >= 3 && p.country_slug === 'spain')).toBe(20);
  });

  it('"affordable apartment portugal" -> portugal & <= €250k', () => {
    const r = topN('affordable apartment portugal');
    expect(coverage(r, (p) => p.country_slug === 'portugal' && p.eurPrice <= 250000)).toBe(20);
  });
});

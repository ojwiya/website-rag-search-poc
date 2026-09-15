import { describe, it, expect } from 'vitest';
import {
  parseSearchIntent,
  getSearchPlan,
  loadProperties,
  searchProperties,
  inferPropertyType,
  type SearchIntent,
} from './rag';

function intentOf(q: string): SearchIntent {
  return parseSearchIntent(q).intent;
}

describe('parseSearchIntent — comparator correctness', () => {
  it.each([
    ['apartment under €300,000', { price: { max: 300000 }, propertyType: 'apartment' }],
    ['apartment less than €300,000', { price: { max: 300000 }, propertyType: 'apartment' }],
    ['apartment cheaper than 300k', { price: { max: 300000 }, propertyType: 'apartment' }],
    ['apartment up to €300,000', { price: { max: 300000 }, propertyType: 'apartment' }],
    ['house between 200k and 400k', { price: { min: 200000, max: 400000 } }],
    ['house from 200k to 400k', { price: { min: 200000, max: 400000 } }],
    ['house 200k-400k', { price: { min: 200000, max: 400000 } }],
    ['villa over 1.2m', { price: { min: 1_200_000 }, propertyType: 'villa' }],
    ['villa over 1.2 million', { price: { min: 1_200_000 }, propertyType: 'villa' }],
    ['cheap house in France', { country: 'france', price: { max: 250000 } }],
    ['3 bedroom house spain', { country: 'spain', beds: { exact: 3 } }],
    ['3+ bedroom house spain', { country: 'spain', beds: { min: 3 } }],
    ['at least 3 bedroom house spain', { country: 'spain', beds: { min: 3 } }],
    ['3 or more bedrooms spain', { country: 'spain', beds: { min: 3 } }],
    ['less than 4 bedrooms spain', { country: 'spain', beds: { max: 3 } }],
    ['fewer than 4 bedrooms spain', { country: 'spain', beds: { max: 3 } }],
    ['under 4 bedrooms spain', { country: 'spain', beds: { max: 4 } }],
    ['up to 3 bedrooms spain', { country: 'spain', beds: { max: 3 } }],
    ['no more than 3 bedrooms spain', { country: 'spain', beds: { max: 3 } }],
    ['more than 3 bedrooms spain', { country: 'spain', beds: { min: 4 } }],
    ['over 3 bedrooms spain', { country: 'spain', beds: { min: 4 } }],
    ['between 2 and 4 bedrooms spain', { country: 'spain', beds: { min: 2, max: 4 } }],
    ['from 2 to 4 bedrooms spain', { country: 'spain', beds: { min: 2, max: 4 } }],
    ['2br apartment', { beds: { exact: 2 }, propertyType: 'apartment' }],
    ['2 br apartment', { beds: { exact: 2 }, propertyType: 'apartment' }],
  ] as const)('%s', (q, expected) => {
    expect(intentOf(q)).toEqual(expected);
  });

  it('"cheaper than 300k" is an explicit ceiling, not the qualitative cheap cap', () => {
    expect(intentOf('apartment cheaper than 300k').price).toEqual({ max: 300000 });
    expect(intentOf('cheap apartment').price).toEqual({ max: 250000 });
  });

  it('"cheaper than 300k" retrieval includes the 250k–300k band that cheap would drop', () => {
    const all = loadProperties();
    const rows = searchProperties(all, 'apartment cheaper than 300k', 1_000_000);
    expect(rows.some((p) => p.price > 250000 && p.price <= 300000)).toBe(true);
    expect(rows.every((p) => p.price <= 300000)).toBe(true);
  });
});

describe('getSearchPlan — residual tokens', () => {
  it('strips commas so AND-gate looks for "pool" not "pool,"', () => {
    const plan = getSearchPlan('Villa with pool, Costa del Sol');
    expect(plan.scoringTerms).toEqual(['pool', 'costa', 'sol']);
    expect(plan.scoringTerms).not.toContain('pool,');
    expect(plan.intent.propertyType).toBe('villa');
  });

  it('treats apartment as a title-type filter, not an AND keyword on description', () => {
    const plan = getSearchPlan('apartment cheaper than 300k');
    expect(plan.intent.propertyType).toBe('apartment');
    expect(plan.scoringTerms).not.toContain('apartment');
    expect(plan.handled.has('apartment')).toBe(true);
  });
});

describe('searchProperties — full-corpus structured filters have zero violations', () => {
  const all = loadProperties();

  it.each([
    {
      q: 'apartment under €300,000',
      check: (p: (typeof all)[0]) =>
        p.price <= 300000 && inferPropertyType(p.title) === 'apartment',
    },
    {
      q: 'apartment less than €300,000',
      check: (p: (typeof all)[0]) =>
        p.price <= 300000 && inferPropertyType(p.title) === 'apartment',
    },
    {
      q: 'apartment cheaper than 300k',
      check: (p: (typeof all)[0]) =>
        p.price <= 300000 && inferPropertyType(p.title) === 'apartment',
    },
    {
      q: 'house between 200k and 400k',
      check: (p: (typeof all)[0]) => p.price >= 200000 && p.price <= 400000,
    },
    {
      q: 'house from 200k to 400k',
      check: (p: (typeof all)[0]) => p.price >= 200000 && p.price <= 400000,
    },
    {
      q: '3 bedroom house spain',
      check: (p: (typeof all)[0]) => p.country_slug === 'spain' && (p.bedrooms == null || p.bedrooms === 3),
    },
    {
      q: '3+ bedroom house spain',
      check: (p: (typeof all)[0]) => p.country_slug === 'spain' && (p.bedrooms || 0) >= 3,
    },
    {
      q: 'less than 4 bedrooms spain',
      check: (p: (typeof all)[0]) => p.country_slug === 'spain' && (p.bedrooms || 0) <= 3,
    },
    {
      q: 'more than 3 bedrooms spain',
      check: (p: (typeof all)[0]) => p.country_slug === 'spain' && (p.bedrooms == null || p.bedrooms >= 4),
    },
    {
      q: '3-bed villa with pool in Italy',
      check: (p: (typeof all)[0]) => {
        const hay = `${p.title} ${p.locationName} ${p.description || ''}`.toLowerCase();
        return (
          p.country_slug === 'italy' &&
          (p.bedrooms == null || p.bedrooms === 3) &&
          hay.includes('villa') &&
          hay.includes('pool')
        );
      },
    },
    {
      q: 'house in valencia',
      check: (p: (typeof all)[0]) =>
        `${p.title} ${p.locationName} ${p.description || ''}`.toLowerCase().includes('valencia'),
    },
  ])('$q — every hit satisfies the structured/AND constraints', ({ q, check }) => {
    const rows = searchProperties(all, q, 1_000_000);
    expect(rows.length).toBeGreaterThan(0);
    const bad = rows.filter((p) => !check(p));
    expect(bad.slice(0, 3).map((p) => ({ id: p.id, title: p.title, price: p.price, beds: p.bedrooms }))).toEqual([]);
    expect(bad).toHaveLength(0);
  });
});

import { describe, it, expect } from 'vitest';
import { getCountryGuide, listGuideCountries } from './guides';

describe('country guides', () => {
  it('lists spain', () => {
    expect(listGuideCountries()).toContain('spain');
  });

  it('loads spain guide with disclaimer and sources', () => {
    const g = getCountryGuide('spain');
    expect(g).toBeTruthy();
    expect(g!.sections.length).toBeGreaterThan(2);
    expect(g!.disclaimer.toLowerCase()).toContain('not legal');
    expect(g!.sources.some((s) => s.url.includes('lumon'))).toBe(true);
  });

  it('returns null for an unknown country', () => {
    expect(getCountryGuide('atlantis')).toBeNull();
  });
});

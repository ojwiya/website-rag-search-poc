import { describe, it, expect } from 'vitest';
import { loadProperties } from './rag';
import { toPublicProperty, getPublicPropertyById } from './public-listing';

describe('toPublicProperty', () => {
  it('replaces full description with a short snippet and an absolute url', () => {
    const raw = loadProperties().find((p) => (p.description || '').length > 400);
    expect(raw).toBeTruthy();
    const pub = toPublicProperty(raw!);
    expect(pub.description.length).toBeLessThanOrEqual(230);
    expect(pub.description.length).toBeLessThan(raw!.description.length);
    expect(pub.url.startsWith('https://')).toBe(true);
    expect(pub.id).toBe(raw!.id);
    expect(pub.price).toBe(raw!.price);
  });

  it('preserves pool signal when the word sits outside the snippet window', () => {
    const raw = {
      id: 999999,
      title: 'Villa in Test',
      country_slug: 'spain',
      locationName: 'Marbella',
      price: 100000,
      currencyCode: 'EUR',
      eurPrice: 100000,
      gbpPrice: 85000,
      bedrooms: 3,
      bathrooms: 2,
      plotSize: null,
      buildSize: 120,
      latitude: 0,
      longitude: 0,
      description: `${'A'.repeat(250)} private pool and garden`,
      url: '/spain/x',
      image_count: 1,
      thumbnail_url: null,
    };
    const pub = toPublicProperty(raw);
    expect(pub.description).not.toMatch(/pool/i);
    expect(pub.hasPool).toBe(true);
    expect(pub.url.startsWith('https://')).toBe(true);
  });
});

describe('getPublicPropertyById', () => {
  it('returns a thin public row for a real listing id', () => {
    const first = loadProperties()[0];
    const pub = getPublicPropertyById(first.id);
    expect(pub).toBeTruthy();
    expect(pub!.id).toBe(first.id);
    expect(pub!.url.startsWith('https://')).toBe(true);
    expect((pub!.description || '').length).toBeLessThanOrEqual(230);
  });

  it('returns undefined for an unknown id', () => {
    expect(getPublicPropertyById(-1)).toBeUndefined();
  });
});

import { describe, it, expect } from 'vitest';
import { assertCanonical, SCHEMA_VERSION, type CanonicalListing } from './canonical';
import { propertyToCanonical } from './sources/yoh-snapshot';
import { toAbsoluteCanonicalUrl, buildRedirectPath, validateRedirectTarget } from './urls';
import { loadProperties } from './rag';
// Relative imports keep Vitest happy without path-alias resolution.

describe('canonical + urls', () => {
  it('requires absolute canonical_url', () => {
    const listing: CanonicalListing = {
      schema_version: SCHEMA_VERSION,
      id: '1',
      source: 'test',
      source_name: 'Test',
      canonical_url: '/relative',
      title: 'Villa',
      location: 'Marbella',
      country: 'spain',
      price: 100000,
      currency: 'EUR',
      beds: 3,
      baths: 2,
      property_type: 'villa',
    };
    expect(assertCanonical(listing)).toContain('canonical_url must be absolute http(s)');
  });

  it('maps a real snapshot row to valid CanonicalListing', () => {
    const props = loadProperties();
    const c = propertyToCanonical(props[0]);
    expect(assertCanonical(c)).toEqual([]);
    expect(c.source).toBe('yoh-snapshot');
    expect(c.canonical_url.startsWith('https://')).toBe(true);
    expect(c.snippet).toBeTruthy();
    expect(typeof c.extras?.hasPool).toBe('boolean');
  });

  it('toAbsoluteCanonicalUrl prefixes relative paths', () => {
    expect(toAbsoluteCanonicalUrl('/spain/property-for-sale/details/x')).toBe(
      'https://www.youroverseashome.com/spain/property-for-sale/details/x'
    );
  });

  it('buildRedirectPath encodes query', () => {
    const path = buildRedirectPath({
      url: 'https://example.com/p/1',
      listingId: 42,
      source: 'yoh-snapshot',
    });
    expect(path).toContain('/api/redirect?');
    expect(path).toContain('listingId=42');
    expect(path).toContain('source=yoh-snapshot');
  });

  it('validateRedirectTarget accepts http(s) and rejects others', () => {
    expect(validateRedirectTarget('https://example.com/p/1').ok).toBe(true);
    expect(validateRedirectTarget('javascript:alert(1)').ok).toBe(false);
    expect(validateRedirectTarget('not-a-url').ok).toBe(false);
  });
});

import type { Property } from '../rag';
import {
  SCHEMA_VERSION,
  type CanonicalListing,
  assertCanonical,
} from '../canonical';
import { toAbsoluteCanonicalUrl, YOH_ORIGIN } from '../urls';

export const YOH_SNAPSHOT_SOURCE = 'yoh-snapshot';
export const YOH_SNAPSHOT_SOURCE_NAME = 'Source listing';

function inferType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('villa')) return 'villa';
  if (t.includes('apartment') || t.includes('flat')) return 'apartment';
  if (t.includes('townhouse')) return 'townhouse';
  if (t.includes('house')) return 'house';
  if (t.includes('land') || t.includes('plot')) return 'land';
  return 'property';
}

function snippetFrom(description: string, max = 220): string {
  const clean = (description || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

/** Map legacy Property row → CanonicalListing (M0 frozen snapshot). */
export function propertyToCanonical(p: Property): CanonicalListing {
  const canonical_url =
    toAbsoluteCanonicalUrl(p.url, YOH_ORIGIN) ||
    `${YOH_ORIGIN}/`;

  const listing: CanonicalListing = {
    schema_version: SCHEMA_VERSION,
    id: String(p.id),
    source: YOH_SNAPSHOT_SOURCE,
    source_name: YOH_SNAPSHOT_SOURCE_NAME,
    canonical_url,
    title: p.title,
    location: p.locationName,
    country: p.country_slug,
    price: p.price,
    currency: p.currencyCode,
    beds: p.bedrooms,
    baths: p.bathrooms,
    property_type: inferType(p.title),
    lat: p.latitude,
    lng: p.longitude,
    thumbnail_url: p.thumbnail_url,
    snippet: snippetFrom(p.description || ''),
    extras: {
      eurPrice: p.eurPrice,
      gbpPrice: p.gbpPrice,
      buildSize: p.buildSize,
      plotSize: p.plotSize,
      image_count: p.image_count,
      legacy_url: p.url,
      hasPool: /(^|\W)pool(\W|$)/i.test(p.description || ''),
    },
  };

  const errors = assertCanonical(listing);
  if (errors.length) {
    // Soft: still return; callers may log. Demo data should be valid.
    listing.extras = { ...listing.extras, canonical_errors: errors };
  }
  return listing;
}

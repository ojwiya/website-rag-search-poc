/**
 * Frozen thin referral schema (Level A/B).
 * Source adapters map into this; search/UI must not depend on site-specific fields.
 */

export const SCHEMA_VERSION = 1 as const;

export interface CanonicalListing {
  schema_version: typeof SCHEMA_VERSION;
  /** Stable id within source, or global numeric id for legacy snapshot */
  id: string;
  source: string;
  source_name: string;
  canonical_url: string;
  title: string;
  location: string;
  country: string;
  price: number;
  currency: string;
  beds: number | null;
  baths: number | null;
  property_type: string;
  lat?: number | null;
  lng?: number | null;
  ref?: string | null;
  thumbnail_url?: string | null;
  /** Short teaser for NL / cards — not full listing body */
  snippet?: string | null;
  extras?: Record<string, unknown>;
}

export function assertCanonical(listing: CanonicalListing): string[] {
  const errors: string[] = [];
  if (!listing.id) errors.push('id required');
  if (!listing.source) errors.push('source required');
  if (!listing.canonical_url || !/^https?:\/\//i.test(listing.canonical_url)) {
    errors.push('canonical_url must be absolute http(s)');
  }
  if (!listing.title) errors.push('title required');
  if (listing.price == null || Number.isNaN(listing.price)) errors.push('price required');
  if (!listing.currency) errors.push('currency required');
  return errors;
}

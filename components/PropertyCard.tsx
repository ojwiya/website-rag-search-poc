'use client';

import Link from 'next/link';
import { Property } from '@/lib/rag';
import { propertyToCanonical } from '@/lib/sources/yoh-snapshot';

const currencySymbols: Record<string, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$',
};

export function PropertyCardSkeleton() {
  return (
    <div className="bg-card border rounded-lg p-2.5 animate-pulse" style={{ borderColor: '#E7EEF8' }}>
      <div className="aspect-square rounded-md" style={{ background: '#E7EEF8' }} />
      <div className="pt-3 px-1 space-y-2">
        <div className="h-4 rounded" style={{ background: '#E7EEF8', width: '70%' }} />
        <div className="h-3 rounded" style={{ background: '#E7EEF8', width: '50%' }} />
        <div className="flex justify-between items-center mt-2">
          <div className="h-5 rounded" style={{ background: '#E7EEF8', width: '35%' }} />
          <div className="h-4 rounded" style={{ background: '#E7EEF8', width: '28%' }} />
        </div>
      </div>
    </div>
  );
}

export function PropertyCard({ property }: { property: Property }) {
  const canonical = propertyToCanonical(property);
  const symbol = currencySymbols[canonical.currency] || '€';
  const price = `${symbol}${canonical.price.toLocaleString('en-US')}`;

  const hasPool =
    property.hasPool === true ||
    Boolean(canonical.extras?.hasPool) ||
    /(^|\W)pool(\W|$)/i.test(property.description || '');

  const type = canonical.property_type;

  return (
    <div className="group bg-card border rounded-lg p-2.5 transition-shadow duration-200 hover:bg-card-hover hover:border-card-hoverBorder hover:shadow-cardHover">
      <Link href={`/properties/${property.id}`} className="block">
        {/* Photo — square, 12px radius */}
        <div className="relative aspect-square rounded-md overflow-hidden shrink-0" style={{ background: '#E7EEF8' }}>
          {property.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.thumbnail_url}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0" aria-hidden="true" />
          )}

          {/* Listing tag pill (top-left) — only if present */}
          {property.tag && (
            <span
              className="absolute top-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-pill bg-white"
              style={{ color: '#B87A1B' }}
            >
              {property.tag}
            </span>
          )}

          {/* Photo-count pill (bottom-right) */}
          {property.image_count > 0 && (
            <span
              className="absolute bottom-2 right-2 text-white text-xs px-2 py-1 rounded-pill"
              style={{ background: 'rgba(30,58,95,0.55)' }}
            >
              {property.image_count} photos
            </span>
          )}

        </div>
      </Link>

      {/* Body */}
      <div className="pt-3 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-heading text-[15px] leading-snug line-clamp-1">
            {property.locationName}
          </h3>
          <span
            className="text-xs font-medium capitalize shrink-0 rounded-pill border px-2.5 py-0.5"
            style={{ color: '#8A97A8', borderColor: '#DCE6F5' }}
          >
            {type}
          </span>
        </div>

        {/* Meta line */}
        <p className="text-faint text-[12px] mt-1">
          {[
            property.bedrooms != null ? `${property.bedrooms} beds` : null,
            property.bathrooms != null ? `${property.bathrooms} baths` : null,
            property.buildSize != null ? `${property.buildSize} m²` : null,
            hasPool ? 'Pool' : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>

        {/* Price + View details */}
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-heading text-[19px]">{price}</span>
          <Link
            href={`/properties/${property.id}`}
            className="text-sm font-semibold hover:underline"
            style={{ color: '#2B6CF6' }}
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  );
}

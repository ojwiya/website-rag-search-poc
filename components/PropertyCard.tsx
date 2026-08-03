import Link from 'next/link';
import { useState } from 'react';
import { Property } from '@/lib/rag';

const currencySymbols: Record<string, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$',
};

export function PropertyCard({ property }: { property: Property }) {
  const symbol = currencySymbols[property.currencyCode] || '€';
  const price = `${symbol}${property.price.toLocaleString('en-US')}`;
  const [favorited, setFavorited] = useState(false);

  const hasPool = /(^|\W)pool(\W|$)/i.test(property.description || '');

  const type = (property.title.split(' in ')[0] || 'Property');

  return (
    <div className="group bg-card border rounded-lg p-2.5 transition-shadow duration-200 hover:bg-card-hover hover:border-card-hoverBorder hover:shadow-cardHover">
      <Link href={`/properties/${property.id}`} className="block">
        {/* Photo — square, 12px radius */}
        <div className="relative aspect-square rounded-md overflow-hidden bg-card">
          {property.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.thumbnail_url}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-faint text-sm">
              No image
            </div>
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

          {/* Favorite heart (top-right) */}
          <button
            type="button"
            aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
            aria-pressed={favorited}
            onClick={(e) => {
              e.preventDefault();
              setFavorited((v) => !v);
            }}
            className="absolute top-2.5 right-2.5 p-2 rounded-full transition-transform hover:scale-110 active:scale-95"
            style={{ background: 'rgba(30,58,95,0.28)' }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 32 32"
              className={favorited ? 'text-primary' : 'text-white'}
              fill={favorited ? 'currentColor' : 'none'}
              style={{ strokeWidth: 2 }}
            >
              <path d="M16 28c7-4.35 12-10 12-15a6 6 0 0 0-11-3.5A6 6 0 0 0 4 13c0 5 5 10.65 12 15z" />
            </svg>
          </button>

          {/* Photo-count pill (bottom-right) */}
          {property.image_count > 0 && (
            <span
              className="absolute bottom-2 right-2 text-white text-xs px-2 py-1 rounded-pill"
              style={{ background: 'rgba(30,58,95,0.55)' }}
            >
              {property.image_count} photos
            </span>
          )}

          {/* Carousel dots (bottom-center) */}
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />
          </span>
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

        {/* Agent-verified line with checkmark */}
        <p className="text-faint text-[12px] mt-1.5 flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5B6B82" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Agent-verified listing
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

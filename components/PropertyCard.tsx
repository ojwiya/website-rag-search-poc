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

  return (
    <div className="group">
      <Link href={`/properties/${property.id}`} className="block">
        {/* Image — Airbnb rounded corners + soft shadow */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-surface-alt shadow-sm group-hover:shadow-card transition-shadow duration-200">
          {property.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={property.thumbnail_url}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-sm">
              No image
            </div>
          )}
          {property.image_count > 0 && (
            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-pill">
              {property.image_count} photos
            </span>
          )}
          {/* Heart favorite */}
          <button
            type="button"
            aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
            aria-pressed={favorited}
            onClick={(e) => {
              e.preventDefault();
              setFavorited((v) => !v);
            }}
            className="absolute top-3 right-3 p-1.5 rounded-full transition-transform hover:scale-110 active:scale-95"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 32 32"
              className={favorited ? 'fill-rausch text-rausch' : 'fill-black/40 text-white'}
              style={{ strokeWidth: 2 }}
            >
              <path d="M16 28c7-4.35 12-10 12-15a6 6 0 0 0-11-3.5A6 6 0 0 0 4 13c0 5 5 10.65 12 15z" />
            </svg>
          </button>
        </div>
      </Link>

      {/* Body */}
      <div className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-heading text-[15px] leading-snug line-clamp-1">
            {property.locationName}
          </h3>
          <span className="text-sm text-muted shrink-0 font-medium capitalize">
            {property.title.split(' in ')[0]}
          </span>
        </div>

        {/* Specs */}
        <p className="text-muted text-[14px] mt-0.5">
          {[
            property.bedrooms != null ? `${property.bedrooms} beds` : null,
            property.bathrooms != null ? `${property.bathrooms} baths` : null,
            property.buildSize != null ? `${property.buildSize} m²` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>

        {/* Price pill */}
        <p className="mt-1.5 text-heading">
          <span className="font-semibold">{price}</span>
          <span className="text-muted font-normal"> night</span>
        </p>
      </div>
    </div>
  );
}

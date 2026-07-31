import Link from 'next/link';
import { Property } from '@/lib/rag';

const currencySymbols: Record<string, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$',
};

export function PropertyCard({ property }: { property: Property }) {
  const symbol = currencySymbols[property.currencyCode] || '€';
  const price = `${symbol}${property.price.toLocaleString('en-US')}`;
  const type = property.title.split(' in ')[0]?.split(' in ')[0] || 'Property';

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group block bg-surface border border-border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-cardHover hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-surface-alt overflow-hidden">
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
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {property.image_count} photos
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-heading tracking-display text-heading mb-1 line-clamp-2 leading-snug">
          {property.title}
        </h3>
        <p className="text-sm text-muted mb-3">{property.locationName}</p>

        {/* Specs */}
        <div className="flex items-center gap-4 text-sm text-muted mb-3">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <strong className="text-heading font-body">{property.bedrooms}</strong> bed
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <strong className="text-heading font-body">{property.bathrooms}</strong> bath
            </span>
          )}
          {property.buildSize != null && (
            <span className="flex items-center gap-1">
              <strong className="text-heading font-body">{property.buildSize}</strong> m²
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xl font-body text-primary-600 font-semibold">{price}</span>
          <button
            className="text-muted hover:text-primary-600 transition-colors p-2 rounded hover:bg-primary-50"
            aria-label="Share property"
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(
                `${window.location.origin}/properties/${property.id}`
              );
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}

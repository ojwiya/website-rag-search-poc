import { getPropertyById } from '@/lib/rag';
import Link from 'next/link';
import { PropertyActions } from '@/components/PropertyActions';
import { BrandLogo } from '@/components/BrandLogo';

export default async function PropertyDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const property = getPropertyById(id);

  if (!property) {
    return (
      <main className="min-h-screen bg-surface-alt flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-heading mb-2">Property not found</h1>
          <Link href="/" className="font-medium hover:underline" style={{ color: '#2B6CF6' }}>← Back to search</Link>
        </div>
      </main>
    );
  }

  const currencySymbols: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' };
  const symbol = currencySymbols[property.currencyCode] || '€';
  const price = `${symbol}${property.price.toLocaleString('en-US')}`;
  const type = property.title.split(' in ')[0] || 'Property';

  const specs = [
    { label: 'Bedrooms', value: property.bedrooms ?? '—' },
    { label: 'Bathrooms', value: property.bathrooms ?? '—' },
    ...(property.buildSize ? [{ label: 'Build m²', value: property.buildSize }] : []),
    ...(property.plotSize ? [{ label: 'Plot m²', value: property.plotSize }] : []),
    { label: 'Type', value: type },
  ];

  return (
    <main className="min-h-screen bg-surface-alt">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface border-b" style={{ borderColor: '#E7EEF8' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" aria-label="Homes in the Sun — home">
            <BrandLogo variant="header" />
          </a>
          <nav className="flex gap-6">
            <a href="#" className="text-sm font-medium hover:underline" style={{ color: '#1E3A5F' }}>Browse</a>
            <a href="#" className="text-sm font-medium hover:underline" style={{ color: '#1E3A5F' }}>About</a>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <Link href="/" className="text-sm font-medium mb-5 inline-block hover:underline" style={{ color: '#2B6CF6' }}>← Back to search</Link>

        {/* Gallery */}
        <div className="relative aspect-[16/9] bg-surface rounded-lg overflow-hidden border" style={{ borderColor: '#E7EEF8' }}>
          {property.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={property.thumbnail_url} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-faint">No image available</div>
          )}
          {property.image_count > 0 && (
            <span className="absolute bottom-4 right-4 bg-white text-sm px-3 py-1.5 rounded-pill" style={{ color: '#1E3A5F' }}>{property.image_count} photos</span>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mt-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-display">{property.title}</h1>
            <p className="text-[15px] mt-1" style={{ color: '#5B6B82' }}>{property.locationName}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-heading">{price}</div>
            <div className="text-sm mt-1" style={{ color: '#5B6B82' }}>{property.currencyCode} · {property.eurPrice.toLocaleString()} EUR</div>
          </div>
        </div>

        {/* Specs */}
        <div className="flex flex-wrap gap-3 mt-6">
          {specs.map((s) => (
            <div key={s.label} className="bg-surface border rounded-pill px-5 py-2.5 text-center" style={{ borderColor: '#E7EEF8' }}>
              <div className="text-lg font-semibold text-heading">{s.value}</div>
              <div className="text-[11px] uppercase tracking-wide mt-0.5" style={{ color: '#8A97A8' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="bg-surface border rounded-lg p-6 mt-6" style={{ borderColor: '#E7EEF8' }}>
          <h2 className="text-xl font-bold text-heading mb-3">About this property</h2>
          <p className="text-[15px] leading-relaxed whitespace-pre-line" style={{ color: '#1E3A5F' }}>{property.description}</p>
        </div>

        {/* Actions */}
        <div className="mt-6">
          <PropertyActions url={property.url} />
        </div>
      </div>
    </main>
  );
}

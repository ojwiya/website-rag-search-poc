import { getPropertyById } from '@/lib/rag';
import Link from 'next/link';
import { PropertyActions } from '@/components/PropertyActions';

export default async function PropertyDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const property = getPropertyById(id);

  if (!property) {
    return (
      <main className="min-h-screen bg-surface-alt flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-heading mb-2">Property not found</h1>
          <Link href="/" className="text-rausch hover:underline font-medium">← Back to search</Link>
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
      <header className="sticky top-0 z-50 bg-surface border-b border-borderSoft">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-extrabold text-rausch tracking-tight">
            property<span className="text-heading">search</span>
          </a>
          <nav className="flex gap-6">
            <a href="#" className="text-sm font-medium text-heading hover:text-rausch transition-colors">Browse</a>
            <a href="#" className="text-sm font-medium text-heading hover:text-rausch transition-colors">About</a>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <Link href="/" className="text-sm font-medium text-heading hover:text-rausch mb-5 inline-block">← Back to search</Link>

        {/* Gallery — Airbnb rounded corners */}
        <div className="relative aspect-[16/9] bg-surface rounded-lg overflow-hidden">
          {property.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={property.thumbnail_url} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">No image available</div>
          )}
          {property.image_count > 0 && (
            <span className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1.5 rounded-pill">{property.image_count} photos</span>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mt-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-display">{property.title}</h1>
            <p className="text-[15px] text-muted mt-1">{property.locationName}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-heading">{price}</div>
            <div className="text-sm text-muted mt-1">{property.currencyCode} · {property.eurPrice.toLocaleString()} EUR</div>
          </div>
        </div>

        {/* Specs — Airbnb-style pill chips */}
        <div className="flex flex-wrap gap-3 mt-6">
          {specs.map((s) => (
            <div key={s.label} className="bg-surface border border-borderSoft rounded-pill px-5 py-2.5 text-center">
              <div className="text-lg font-semibold text-heading">{s.value}</div>
              <div className="text-[11px] text-muted uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="bg-surface border border-borderSoft rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-heading mb-3">About this property</h2>
          <p className="text-[15px] text-heading leading-relaxed whitespace-pre-line">{property.description}</p>
        </div>

        {/* Actions */}
        <div className="mt-6">
          <PropertyActions url={property.url} />
        </div>
      </div>
    </main>
  );
}

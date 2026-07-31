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
          <h1 className="text-2xl font-heading text-heading mb-2">Property not found</h1>
          <Link href="/" className="text-primary-600 hover:underline">← Back to search</Link>
        </div>
      </main>
    );
  }

  const currencySymbols: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' };
  const symbol = currencySymbols[property.currencyCode] || '€';
  const price = `${symbol}${property.price.toLocaleString('en-US')}`;
  const type = property.title.split(' in ')[0] || 'Property';

  return (
    <main className="min-h-screen bg-surface-alt">
      <header className="sticky top-0 z-50 bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-semibold text-primary-600 tracking-tight">Property Search</a>
          <nav className="flex gap-6">
            <a href="#" className="text-sm font-body text-heading hover:text-primary-600 transition-colors">Browse</a>
            <a href="#" className="text-sm font-body text-heading hover:text-primary-600 transition-colors">About</a>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link href="/" className="text-sm text-primary-600 hover:underline mb-6 inline-block">← Back to search</Link>

        <div className="relative aspect-[16/7] bg-surface-alt rounded-lg overflow-hidden mb-8">
          {property.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={property.thumbnail_url} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">No image available</div>
          )}
          {property.image_count > 0 && (
            <span className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded">{property.image_count} photos</span>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading tracking-display text-heading mb-2">{property.title}</h1>
            <p className="text-lg text-muted">{property.locationName}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold text-primary-600">{price}</div>
            <div className="text-sm text-muted mt-1">{property.currencyCode} · {property.eurPrice.toLocaleString()} EUR</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <div className="bg-surface border border-border rounded-lg px-6 py-4 text-center min-w-[100px]">
            <div className="text-2xl font-semibold text-heading">{property.bedrooms ?? '—'}</div>
            <div className="text-xs text-muted uppercase tracking-wide mt-1">Bedrooms</div>
          </div>
          <div className="bg-surface border border-border rounded-lg px-6 py-4 text-center min-w-[100px]">
            <div className="text-2xl font-semibold text-heading">{property.bathrooms ?? '—'}</div>
            <div className="text-xs text-muted uppercase tracking-wide mt-1">Bathrooms</div>
          </div>
          {property.buildSize && (
            <div className="bg-surface border border-border rounded-lg px-6 py-4 text-center min-w-[100px]">
              <div className="text-2xl font-semibold text-heading">{property.buildSize}</div>
              <div className="text-xs text-muted uppercase tracking-wide mt-1">Build m²</div>
            </div>
          )}
          {property.plotSize && (
            <div className="bg-surface border border-border rounded-lg px-6 py-4 text-center min-w-[100px]">
              <div className="text-2xl font-semibold text-heading">{property.plotSize}</div>
              <div className="text-xs text-muted uppercase tracking-wide mt-1">Plot m²</div>
            </div>
          )}
          <div className="bg-surface border border-border rounded-lg px-6 py-4 text-center min-w-[100px]">
            <div className="text-2xl font-semibold text-heading capitalize">{type}</div>
            <div className="text-xs text-muted uppercase tracking-wide mt-1">Type</div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-heading text-heading mb-4">Description</h2>
          <p className="text-body leading-relaxed whitespace-pre-line">{property.description}</p>
        </div>

        <PropertyActions url={property.url} />
      </div>
    </main>
  );
}

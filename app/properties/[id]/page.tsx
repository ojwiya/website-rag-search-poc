import { getPropertyById } from '@/lib/rag';
import { propertyToCanonical } from '@/lib/sources/yoh-snapshot';
import { getCountryGuide } from '@/lib/guides';
import Link from 'next/link';
import { PropertyActions } from '@/components/PropertyActions';
import { BrandLogo } from '@/components/BrandLogo';
import { CountryGuidePanel } from '@/components/CountryGuidePanel';
import { LeadForm } from '@/components/LeadForm';

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

  const canonical = propertyToCanonical(property);
  const guide = getCountryGuide(canonical.country);

  const currencySymbols: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' };
  const symbol = currencySymbols[canonical.currency] || '€';
  const price = `${symbol}${canonical.price.toLocaleString('en-US')}`;

  const specs = [
    { label: 'Bedrooms', value: canonical.beds ?? '—' },
    { label: 'Bathrooms', value: canonical.baths ?? '—' },
    ...(typeof canonical.extras?.buildSize === 'number'
      ? [{ label: 'Build m²', value: canonical.extras.buildSize as number }]
      : []),
    ...(typeof canonical.extras?.plotSize === 'number'
      ? [{ label: 'Plot m²', value: canonical.extras.plotSize as number }]
      : []),
    { label: 'Type', value: canonical.property_type },
  ];

  return (
    <main className="min-h-screen bg-surface-alt">
      <header className="sticky top-0 z-50 bg-surface border-b" style={{ borderColor: '#E7EEF8' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" aria-label="Homes in the Sun — home">
            <BrandLogo variant="header" />
          </a>
          <nav className="flex gap-6">
            <Link href="/" className="text-sm font-medium hover:underline" style={{ color: '#1E3A5F' }}>Browse</Link>
            <Link href="/guides/spain" className="text-sm font-medium hover:underline" style={{ color: '#1E3A5F' }}>Buying guide</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <Link href="/" className="text-sm font-medium mb-5 inline-block hover:underline" style={{ color: '#2B6CF6' }}>← Back to search</Link>

        <div className="relative aspect-[16/9] bg-surface rounded-lg overflow-hidden border" style={{ borderColor: '#E7EEF8' }}>
          {canonical.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={canonical.thumbnail_url} alt={canonical.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-faint">No image available</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mt-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-display">{canonical.title}</h1>
            <p className="text-[15px] mt-1" style={{ color: '#5B6B82' }}>{canonical.location}</p>
            <p className="text-[13px] mt-2" style={{ color: '#8A97A8' }}>
              Listed via {canonical.source_name} · {canonical.country}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-heading">{price}</div>
            <div className="text-sm mt-1" style={{ color: '#5B6B82' }}>{canonical.currency}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          {specs.map((s) => (
            <div key={s.label} className="bg-surface border rounded-pill px-5 py-2.5 text-center" style={{ borderColor: '#E7EEF8' }}>
              <div className="text-lg font-semibold text-heading">{s.value}</div>
              <div className="text-[11px] uppercase tracking-wide mt-0.5" style={{ color: '#8A97A8' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Thin teaser — full description lives on the source site */}
        <div className="bg-surface border rounded-lg p-6 mt-6" style={{ borderColor: '#E7EEF8' }}>
          <h2 className="text-xl font-bold text-heading mb-3">Overview</h2>
          <p className="text-[15px] leading-relaxed" style={{ color: '#1E3A5F' }}>
            {canonical.snippet || 'See the full listing on the source site for complete details and photos.'}
          </p>
          <p className="text-xs mt-3" style={{ color: '#8A97A8' }}>
            Homes in the Sun is a discovery aggregator. Full listing content and photos are on the source website.
          </p>
        </div>

        <div className="mt-6">
          <PropertyActions
            canonicalUrl={canonical.canonical_url}
            listingId={canonical.id}
            source={canonical.source}
            sourceName={canonical.source_name}
          />
        </div>

        {guide && <CountryGuidePanel guide={guide} />}

        <section className="bg-surface border rounded-lg p-6 mt-6" style={{ borderColor: '#E7EEF8' }}>
          <h2 className="text-xl font-bold text-heading mb-2">Request an intro</h2>
          <p className="text-sm mb-4" style={{ color: '#5B6B82' }}>
            Tell us you are interested. In this MVP phase we record your request for human review —
            we do not auto-forward to agents.
          </p>
          <LeadForm
            kind="request_intro"
            listingId={canonical.id}
            source={canonical.source}
            country={canonical.country}
          />
        </section>
      </div>
    </main>
  );
}

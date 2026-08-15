import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { getCountryGuide, listGuideCountries } from '@/lib/guides';

export function generateStaticParams() {
  return listGuideCountries().map((country) => ({ country }));
}

export default function CountryGuidePage({ params }: { params: { country: string } }) {
  const guide = getCountryGuide(params.country);
  if (!guide) notFound();

  return (
    <main className="min-h-screen bg-surface-alt">
      <header className="sticky top-0 z-50 bg-surface border-b" style={{ borderColor: '#E7EEF8' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" aria-label="Homes in the Sun — home">
            <BrandLogo variant="header" />
          </Link>
          <Link href="/" className="text-sm font-medium hover:underline" style={{ color: '#2B6CF6' }}>
            Search homes
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#8A97A8' }}>
          Country guide · updated {guide.updated_at}
        </p>
        <h1 className="text-3xl font-extrabold text-heading mt-2 tracking-display">{guide.title}</h1>

        <div className="mt-8 space-y-6">
          {guide.sections.map((s) => (
            <section key={s.id}>
              <h2 className="text-lg font-bold text-heading">{s.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed" style={{ color: '#5B6B82' }}>
                {s.body}
              </p>
            </section>
          ))}
        </div>

        <section className="mt-10 pt-6 border-t" style={{ borderColor: '#E7EEF8' }}>
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#8A97A8' }}>
            Further reading
          </h2>
          <ul className="mt-3 space-y-2">
            {guide.sources.map((src) => (
              <li key={src.url}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#2B6CF6' }}
                >
                  {src.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs mt-6" style={{ color: '#8A97A8' }}>
            {guide.disclaimer}
          </p>
        </section>
      </article>
    </main>
  );
}

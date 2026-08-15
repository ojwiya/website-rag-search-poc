import Link from 'next/link';
import type { CountryGuide } from '@/lib/guides';

export function CountryGuidePanel({ guide }: { guide: CountryGuide }) {
  return (
    <section
      className="bg-surface border rounded-lg p-6 mt-6"
      style={{ borderColor: '#E7EEF8' }}
      aria-labelledby="country-guide-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 id="country-guide-heading" className="text-xl font-bold text-heading">
          {guide.title}
        </h2>
        <Link
          href={`/guides/${guide.country}`}
          className="text-sm font-semibold hover:underline"
          style={{ color: '#2B6CF6' }}
        >
          Full country guide →
        </Link>
      </div>

      <div className="space-y-4">
        {guide.sections.slice(0, 4).map((s) => (
          <div key={s.id}>
            <h3 className="text-sm font-semibold text-heading">{s.title}</h3>
            <p className="text-[15px] leading-relaxed mt-1" style={{ color: '#5B6B82' }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>

      {guide.sources.length > 0 && (
        <div className="mt-5 pt-4 border-t" style={{ borderColor: '#E7EEF8' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#8A97A8' }}>
            Further reading
          </p>
          <ul className="space-y-1">
            {guide.sources.map((src) => (
              <li key={src.url}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                  style={{ color: '#2B6CF6' }}
                >
                  {src.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs mt-4 leading-relaxed" style={{ color: '#8A97A8' }}>
        {guide.disclaimer}
      </p>
    </section>
  );
}

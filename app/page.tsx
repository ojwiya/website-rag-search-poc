'use client';

import { useState, useEffect, useCallback } from 'react';
import { PropertyCard } from '@/components/PropertyCard';
import { BrandLogo } from '@/components/BrandLogo';
import { Property } from '@/lib/rag';

const EXAMPLES = ['Villa with pool, Costa del Sol', 'Properties €300,000 and below', 'New build, sea view'];

const FAQS = [
  {
    q: 'What is the average price of an apartment in Spain?',
    a: 'Average apartment prices vary widely by region — coastal hotspots like the Costa del Sol typically start around €250,000, while inland towns can be significantly lower.',
  },
  {
    q: 'Can foreigners buy property in Spain?',
    a: 'Yes. There are no restrictions on foreign buyers owning property in Spain, and the process is well established for overseas purchasers.',
  },
  {
    q: 'What taxes and fees should I budget for?',
    a: 'Budget roughly 10–12% on top of the purchase price for transfer tax, notary, legal fees, and registry costs. Annual running costs are separate.',
  },
  {
    q: 'How many properties fall under €300,000?',
    a: 'A large share of our listings sit under €300,000. Use the natural-language search — try “apartment under €300,000” — to see current matches.',
  },
];

function Price({ value, currencyCode }: { value: number; currencyCode: string }) {
  const symbol = { EUR: '€', GBP: '£', USD: '$' }[currencyCode] || '€';
  return <>{symbol}{value.toLocaleString('en-US')}</>;
}

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('best');
  const [page, setPage] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query);
    params.set('page', page.toString());
    params.set('limit', '20');
    params.set('sort', sort);

    try {
      const res = await fetch(`/api/properties?${params.toString()}`);
      const data = await res.json();
      const results = (data.properties || []) as Property[];

      setProperties(results);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [query, sort, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchProperties, 300);
    return () => clearTimeout(debounce);
  }, [fetchProperties]);

  const start = total === 0 ? 0 : (page - 1) * 20 + 1;
  const end = Math.min(page * 20, total);

  return (
    <main className="min-h-screen bg-surface-alt">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface border-b" style={{ borderColor: '#E7EEF8' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" aria-label="Homes in the Sun — home">
            <BrandLogo variant="header" />
          </a>
          <nav className="flex gap-6">
            <a href="#" className="text-sm font-medium hover:underline" style={{ color: '#1E3A5F' }}>Browse</a>
            <a href="#" className="text-sm font-medium hover:underline" style={{ color: '#1E3A5F' }}>About</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        className="px-6 pt-12 pb-8 text-center"
        style={{ background: 'radial-gradient(circle at 50% 0%, #FBF6EA 0%, rgba(251,246,234,0) 55%)' }}
      >
        <h1 className="text-[40px] sm:text-[48px] font-extrabold text-heading leading-tight tracking-display">
          Find your next home in the sun
        </h1>
        <p className="text-[15px] mt-3" style={{ color: '#5B6B82' }}>
          Search thousands of verified listings with natural language.
        </p>

        {/* Search pill */}
        <div className="max-w-2xl mx-auto mt-7 flex items-center gap-2 bg-white border rounded-pill shadow-pill pl-6 pr-2 py-2" style={{ borderColor: '#DCE6F5' }}>
          <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B6CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder={'Try "3-bed villa with pool near Marbella"...'}
            className="flex-1 px-2 py-2 bg-transparent text-heading text-sm focus:outline-none placeholder:text-faint"
          />
          <button
            type="button"
            aria-label="Search"
            className="text-white rounded-pill p-2.5 transition-colors"
            style={{ background: '#2B6CF6' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1E56D6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#2B6CF6')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>

        {/* Example chips */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => { setQuery(ex); setPage(1); }}
              className="text-xs font-medium rounded-pill px-3 py-1.5 bg-white transition-colors"
              style={{ color: '#1E3A5F', border: '1px solid #DCE6F5' }}
            >
              {ex}
            </button>
          ))}
        </div>
      </section>

      {/* Results bar — replaces the filter row */}
      <div
        className="sticky top-[73px] z-40 flex items-center justify-between flex-wrap gap-4 px-6 sm:px-12 py-4 bg-white"
        style={{ borderTop: '1px solid #E7EEF8', borderBottom: '1px solid #E7EEF8', boxShadow: '0 2px 6px rgba(30,58,95,0.03)' }}
      >
        <div className="flex items-center gap-2.5 flex-wrap text-sm" style={{ color: '#5B6B82' }}>
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A97A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            {query.trim() ? (
              <span className="font-semibold" style={{ color: '#1E3A5F' }}>{`"${query.trim()}"`}</span>
            ) : (
              <span className="font-semibold" style={{ color: '#1E3A5F' }}>All listings</span>
            )}
          </span>
          <span>
            <strong style={{ color: '#1E3A5F' }}>{start}–{end}</strong> of <strong style={{ color: '#1E3A5F' }}>{total.toLocaleString()}</strong> matches
          </span>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-sm font-semibold rounded-md px-3.5 py-2.5 bg-white cursor-pointer"
          style={{ border: '1px solid #DCE6F5', color: '#1E3A5F' }}
        >
          <option value="best">Sort: Best match</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="newest">Newest listings</option>
        </select>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12 pt-8">
        {loading ? (
          <div className="text-center py-20" style={{ color: '#5B6B82' }}>Loading…</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#5B6B82' }}>No properties found. Try adjusting your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}

        {total > 20 && (
          <div className="flex justify-center items-center gap-3 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2.5 text-sm font-semibold rounded-pill transition-colors disabled:opacity-40 disabled:cursor-default"
              style={{ border: '1px solid #DCE6F5', color: '#1E3A5F' }}
            >
              ← Prev
            </button>
            <span className="text-sm px-2" style={{ color: '#5B6B82' }}>Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="px-5 py-2.5 text-sm font-semibold rounded-pill transition-colors disabled:opacity-40 disabled:cursor-default"
              style={{ border: '1px solid #DCE6F5', color: '#1E3A5F' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Trust / guide CTA band */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="aspect-[16/10] rounded-lg bg-card border overflow-hidden" style={{ borderColor: '#E7EEF8' }}>
            {/* image slot — no stock illustration per spec; subtle placeholder */}
            <div className="w-full h-full flex items-center justify-center text-faint text-sm">Guide preview</div>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#F5A623' }}>Free guide</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-heading mt-2 tracking-display">
              Plan your Spain viewing trip
            </h2>
            <ul className="mt-5 space-y-3">
              {[
                'A checklist of regions and what each is known for',
                'Questions to ask agents before you fly out',
                'A budget template covering taxes and fees',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[15px]" style={{ color: '#5B6B82' }}>
                  <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B6CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-6 px-6 py-3 text-white text-sm font-semibold rounded-pill transition-colors"
              style={{ background: '#2B6CF6' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1E56D6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#2B6CF6')}
            >
              Download the guide
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface-alt">
        <div className="max-w-[820px] mx-auto px-6 py-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-heading text-center tracking-display">
            Frequently asked questions
          </h2>
          <div className="mt-8 divide-y" style={{ borderColor: '#E7EEF8' }}>
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} style={{ borderColor: '#E7EEF8' }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className="font-semibold text-heading text-[15px]">{item.q}</span>
                    <svg
                      className="shrink-0 transition-transform duration-200"
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6B82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {open && (
                    <p className="pb-4 text-[15px] leading-relaxed" style={{ color: '#5B6B82' }}>{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { PropertyCard } from '@/components/PropertyCard';
import { Property } from '@/lib/rag';

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [minBeds, setMinBeds] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query);
    if (minBeds) params.set('minBeds', minBeds);
    if (maxPrice) params.set('maxPrice', maxPrice.replace(/[^0-9]/g, ''));
    params.set('page', page.toString());
    params.set('limit', '20');

    try {
      const res = await fetch(`/api/properties?${params.toString()}`);
      const data = await res.json();
      let results = data.properties || [];

      // Client-side sort
      if (sort === 'price-asc') results = [...results].sort((a, b) => a.price - b.price);
      if (sort === 'price-desc') results = [...results].sort((a, b) => b.price - a.price);

      setProperties(results);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [query, sort, minBeds, maxPrice, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchProperties, 300);
    return () => clearTimeout(debounce);
  }, [fetchProperties]);

  return (
    <main className="min-h-screen bg-surface-alt">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface border-b border-borderSoft">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-extrabold text-rausch tracking-tight">
            property<span className="text-heading">search</span>
          </a>
          <nav className="flex gap-6">
            <a href="#" className="text-sm font-medium text-heading hover:text-rausch transition-colors">
              Browse
            </a>
            <a href="#" className="text-sm font-medium text-heading hover:text-rausch transition-colors">
              About
            </a>
          </nav>
        </div>
      </header>

      {/* Hero + Airbnb pill search */}
      <section className="bg-surface px-6 pt-10 pb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-heading mb-2 tracking-display">
          Find your next stay
        </h1>
        <p className="text-[15px] text-muted mb-6">
          Search thousands of homes with natural language.
        </p>

        {/* Search pill */}
        <div className="max-w-2xl mx-auto flex items-center gap-2 bg-surface border border-border rounded-pill shadow-pill hover:shadow-pillHover transition-shadow pl-6 pr-2 py-2">
          <svg className="text-heading shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Try “cheap house in France”…"
            className="flex-1 px-2 py-2 bg-transparent text-heading text-sm focus:outline-none placeholder:text-foggy"
          />
          <button
            type="button"
            aria-label="Search"
            className="bg-rausch hover:bg-rausch-600 text-white rounded-pill p-2.5 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>

        {/* Example chips */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {['cheap house in France', 'luxury villa spain', 'apartment with pool'].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => { setQuery(ex); setPage(1); }}
              className="text-xs font-medium text-heading border border-border rounded-pill px-3 py-1.5 hover:border-heading transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-heading uppercase tracking-wide">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm font-medium border border-border rounded-pill px-4 py-2 bg-surface text-heading focus:outline-none focus:border-heading cursor-pointer"
          >
            <option value="recent">Recently Added</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-heading uppercase tracking-wide">Beds</label>
          <select
            value={minBeds}
            onChange={(e) => { setMinBeds(e.target.value); setPage(1); }}
            className="text-sm font-medium border border-border rounded-pill px-4 py-2 bg-surface text-heading focus:outline-none focus:border-heading cursor-pointer"
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-heading uppercase tracking-wide">Max €</label>
          <input
            type="text"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            placeholder="500,000"
            className="w-32 text-sm font-medium border border-border rounded-pill px-4 py-2 bg-surface text-heading focus:outline-none focus:border-heading"
          />
        </div>

        <div className="ml-auto text-sm text-muted">
          <strong className="text-heading">{total.toLocaleString()}</strong> properties
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="text-center py-20 text-muted">Loading…</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 text-muted">No properties found. Try adjusting your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center items-center gap-3 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2.5 text-sm font-semibold border border-border rounded-pill hover:border-heading disabled:opacity-40 disabled:cursor-default transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm text-muted px-2">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="px-5 py-2.5 text-sm font-semibold border border-border rounded-pill hover:border-heading disabled:opacity-40 disabled:cursor-default transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

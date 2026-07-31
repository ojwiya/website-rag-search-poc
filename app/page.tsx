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
      <header className="sticky top-0 z-50 bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-semibold text-primary-600 tracking-tight">
            Property Search
          </a>
          <nav className="flex gap-6">
            <a href="#" className="text-sm font-body text-heading hover:text-primary-600 transition-colors">
              Browse
            </a>
            <a href="#" className="text-sm font-body text-heading hover:text-primary-600 transition-colors">
              About
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-surface border-b border-border px-6 py-12 text-center">
        <h1 className="text-4xl font-heading tracking-display text-heading mb-3">
          Find your dream property
        </h1>
        <p className="text-lg text-muted mb-8 max-w-lg mx-auto">
          Search thousands of properties with natural language. Browse listings, compare details, and find the perfect home.
        </p>
        <div className="max-w-xl mx-auto relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by location, price, or features..."
            className="w-full px-4 py-3 pl-11 pr-4 border border-borderInput rounded-md bg-surface text-heading text-sm shadow-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
          />
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted uppercase tracking-wide">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border border-border rounded px-3 py-2 bg-surface text-heading focus:outline-none focus:border-primary-600"
          >
            <option value="recent">Recently Added</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted uppercase tracking-wide">Beds</label>
          <select
            value={minBeds}
            onChange={(e) => { setMinBeds(e.target.value); setPage(1); }}
            className="text-sm border border-border rounded px-3 py-2 bg-surface text-heading focus:outline-none focus:border-primary-600"
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
          <label className="text-xs font-medium text-muted uppercase tracking-wide">Max €</label>
          <input
            type="text"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            placeholder="500,000"
            className="w-28 text-sm border border-border rounded px-3 py-2 bg-surface text-heading focus:outline-none focus:border-primary-600"
          />
        </div>

        <div className="ml-auto text-sm text-muted">
          <strong className="text-heading">{total.toLocaleString()}</strong> properties
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="text-center py-20 text-muted">Loading...</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 text-muted">No properties found. Try adjusting your search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-border rounded hover:border-primary-600 hover:text-primary-600 disabled:opacity-40 disabled:cursor-default"
            >
              ← Prev
            </button>
            <span className="text-sm text-muted px-2">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="px-4 py-2 text-sm border border-border rounded hover:border-primary-600 hover:text-primary-600 disabled:opacity-40 disabled:cursor-default"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

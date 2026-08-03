import { NextResponse } from 'next/server';
import { loadProperties, searchProperties, filterProperties } from '@/lib/rag';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const minBeds = searchParams.get('minBeds');
  const propertyType = searchParams.get('type');
  const country = searchParams.get('country');
  const sort = searchParams.get('sort') || 'best';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  let results = loadProperties();

  // Apply structured filters first
  results = filterProperties(results, {
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    minBeds: minBeds ? parseInt(minBeds) : undefined,
    propertyType: propertyType || undefined,
    country: country || undefined,
  });

  // Then semantic/text search if query provided.
  // Pass a large limit so searchProperties returns the FULL matched set
  // (it slices internally to `limit`); we compute the true total from the
  // full set and paginate ourselves below.
  if (q.trim()) {
    results = searchProperties(results, q, 1_000_000);
  }

  // Sort the FULL matched set before paginating so ordering is consistent
  // across pages (not just within the current page).
  switch (sort) {
    case 'price-asc':
      results = [...results].sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      results = [...results].sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      // No date field in the dataset; use id desc as a recency proxy.
      results = [...results].sort((a, b) => b.id - a.id);
      break;
    case 'best':
    default:
      // Leave in relevance order returned by searchProperties.
      break;
  }

  const total = results.length;
  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);

  return NextResponse.json({
    properties: paginated,
    total,
    page,
    limit,
    hasMore: start + limit < total,
  });
}

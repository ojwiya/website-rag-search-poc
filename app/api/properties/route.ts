import { NextResponse } from 'next/server';
import { loadProperties, filterProperties } from '@/lib/rag';
import { getMilvusPort, searchListings } from '@/lib/milvus';
import { getPublicPropertyById, toPublicProperties } from '@/lib/public-listing';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get('id');
  if (idParam) {
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const property = getPublicPropertyById(id);
    if (!property) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    return NextResponse.json({ property });
  }

  const q = searchParams.get('q') || '';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const minBeds = searchParams.get('minBeds');
  const maxBeds = searchParams.get('maxBeds');
  const propertyType = searchParams.get('type');
  const country = searchParams.get('country');
  const sort = searchParams.get('sort') || 'best';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const apiFilters = {
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    minBeds: minBeds ? parseInt(minBeds) : undefined,
    maxBeds: maxBeds ? parseInt(maxBeds) : undefined,
    propertyType: propertyType || undefined,
    country: country || undefined,
  };

  let results = loadProperties();

  // NL search is async at this boundary so Zilliz can rank the full corpus.
  // Comparators (parseSearchIntent / AND-gate) stay in lib/rag.ts.
  if (q.trim()) {
    results = await searchListings(results, q, 1_000_000, getMilvusPort());
  }

  results = filterProperties(results, apiFilters);

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
      // Leave in relevance order returned by searchListings.
      break;
  }

  const total = results.length;
  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);

  return NextResponse.json({
    properties: toPublicProperties(paginated),
    total,
    page,
    limit,
    hasMore: start + limit < total,
  });
}

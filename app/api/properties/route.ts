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

  // Then semantic/text search if query provided
  if (q.trim()) {
    results = searchProperties(results, q);
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

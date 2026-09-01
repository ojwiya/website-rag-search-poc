import { NextResponse } from 'next/server';
import { loadProperties } from '@/lib/rag';
import { getMilvusPort, searchListings } from '@/lib/milvus';
import { toPublicProperties } from '@/lib/public-listing';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ properties: [], total: 0 });
  }

  const properties = loadProperties();
  const results = await searchListings(properties, q, 20, getMilvusPort());

  return NextResponse.json({
    properties: toPublicProperties(results),
    total: results.length,
  });
}

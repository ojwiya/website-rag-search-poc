import { NextResponse } from 'next/server';
import { loadProperties, searchProperties } from '@/lib/rag';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ properties: [], total: 0 });
  }

  const properties = loadProperties();
  const results = searchProperties(properties, q, 20);

  return NextResponse.json({
    properties: results,
    total: results.length,
  });
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { validateRedirectTarget } from '@/lib/urls';

function appendRedirectLog(entry: Record<string, unknown>) {
  try {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'redirects.jsonl');
    fs.appendFileSync(file, `${JSON.stringify(entry)}\n`, 'utf-8');
  } catch {
    // Best-effort on serverless (filesystem may be read-only) — still redirect.
  }
}

/**
 * Tracked outbound handoff — buyer-agent `redirect` tool contract.
 * GET /api/redirect?url=&listingId=&source=
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url') || '';
  const listingId = searchParams.get('listingId');
  const source = searchParams.get('source');

  const parsed = validateRedirectTarget(target);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  appendRedirectLog({
    ts: new Date().toISOString(),
    url: parsed.href,
    listingId,
    source,
  });

  return NextResponse.redirect(parsed.href, 302);
}

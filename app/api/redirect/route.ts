import { NextResponse } from 'next/server';
import { validateRedirectTarget } from '@/lib/urls';
import { recordEvent } from '@/lib/event-log';

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

  await recordEvent({
    kind: 'redirect',
    ts: new Date().toISOString(),
    url: parsed.href,
    listingId,
    source,
  });

  return NextResponse.redirect(parsed.href, 302);
}

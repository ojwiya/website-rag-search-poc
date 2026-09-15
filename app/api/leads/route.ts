import { NextResponse } from 'next/server';
import { recordEvent } from '@/lib/event-log';

export type LeadKind = 'waitlist' | 'request_intro';

interface LeadBody {
  kind?: LeadKind;
  email?: string;
  name?: string;
  message?: string;
  listingId?: string | number;
  source?: string;
  country?: string;
  consent?: boolean;
}

/**
 * Phase-gated leads: waitlist always OK; request_intro records intent
 * to connect toward the source agent — no silent partner forward in MVP.
 */
export async function POST(request: Request) {
  let body: LeadBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const kind: LeadKind = body.kind === 'request_intro' ? 'request_intro' : 'waitlist';
  const email = (body.email || '').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }
  if (!body.consent) {
    return NextResponse.json({ error: 'Consent required' }, { status: 400 });
  }

  const entry = {
    ts: new Date().toISOString(),
    kind,
    email,
    name: (body.name || '').trim() || null,
    message: (body.message || '').trim() || null,
    listingId: body.listingId ?? null,
    source: body.source ?? null,
    country: body.country ?? null,
    phase: 'mvp-phase-0',
    note:
      kind === 'request_intro'
        ? 'Intent recorded; human/partner forward is draft-first (not automated in MVP).'
        : 'Waitlist / feedback only.',
  };

  await recordEvent({ ...entry, kind: 'lead', leadKind: kind });

  return NextResponse.json({ ok: true, lead: entry });
}

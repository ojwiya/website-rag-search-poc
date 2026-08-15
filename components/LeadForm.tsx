'use client';

import { useState } from 'react';

export function LeadForm({
  kind = 'waitlist',
  listingId,
  source,
  country,
}: {
  kind?: 'waitlist' | 'request_intro';
  listingId?: string | number;
  source?: string;
  country?: string;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          email,
          name,
          message,
          listingId,
          source,
          country,
          consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStatus('ok');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  if (status === 'ok') {
    return (
      <p className="text-sm" style={{ color: '#1E3A5F' }}>
        Thanks — we recorded your {kind === 'request_intro' ? 'intro request' : 'interest'}.
        We will not forward details to partners automatically in this MVP phase.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium" style={{ color: '#1E3A5F' }}>Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-pill border px-4 py-2 text-sm"
            style={{ borderColor: '#DCE6F5' }}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium" style={{ color: '#1E3A5F' }}>Name (optional)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-pill border px-4 py-2 text-sm"
            style={{ borderColor: '#DCE6F5' }}
          />
        </label>
      </div>
      {kind === 'request_intro' && (
        <label className="block text-sm">
          <span className="font-medium" style={{ color: '#1E3A5F' }}>Message (optional)</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border px-4 py-2 text-sm"
            style={{ borderColor: '#DCE6F5' }}
          />
        </label>
      )}
      <label className="flex items-start gap-2 text-xs" style={{ color: '#5B6B82' }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I agree to be contacted about Homes in the Sun.
          {kind === 'request_intro'
            ? ' Intro requests are recorded for human review — not auto-sent to agents in this phase.'
            : ' This is a waitlist / feedback signup, not a booking.'}
        </span>
      </label>
      {status === 'error' && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-5 py-2.5 text-white text-sm font-semibold rounded-pill disabled:opacity-60"
        style={{ background: '#2B6CF6' }}
      >
        {status === 'loading'
          ? 'Sending…'
          : kind === 'request_intro'
            ? 'Request intro'
            : 'Join waitlist'}
      </button>
    </form>
  );
}

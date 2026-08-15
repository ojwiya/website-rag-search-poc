'use client';

import { buildRedirectPath } from '@/lib/urls';

export function PropertyActions({
  canonicalUrl,
  listingId,
  source,
  sourceName,
}: {
  canonicalUrl?: string | null;
  listingId?: string | number;
  source?: string;
  sourceName?: string;
}) {
  const label = sourceName ? `View full listing on ${sourceName}` : 'View full listing on source site';
  const href =
    canonicalUrl &&
    buildRedirectPath({
      url: canonicalUrl,
      listingId,
      source,
    });

  return (
    <div className="flex flex-wrap gap-3">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 text-white text-sm font-semibold rounded-pill transition-colors"
          style={{ background: '#2B6CF6' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1E56D6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#2B6CF6')}
        >
          {label}
        </a>
      ) : null}
      <button
        type="button"
        className="px-6 py-3 border text-sm font-semibold rounded-pill transition-colors"
        style={{ borderColor: '#DCE6F5', color: '#1E3A5F' }}
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
        }}
      >
        Share this page
      </button>
    </div>
  );
}

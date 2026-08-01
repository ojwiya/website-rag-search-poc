'use client';

export function PropertyActions({ url }: { url?: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className="px-6 py-3 bg-rausch hover:bg-rausch-600 text-white text-sm font-semibold rounded-pill transition-colors"
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
        }}
      >
        Share this property
      </button>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 border border-border hover:border-heading text-heading text-sm font-semibold rounded-pill transition-colors"
        >
          View original listing
        </a>
      )}
    </div>
  );
}

'use client';

export function PropertyActions({ url }: { url?: string }) {
  return (
    <div className="flex gap-3">
      <button
        className="px-6 py-3 bg-primary-600 text-white text-sm font-body rounded-md hover:bg-primary-700 transition-colors"
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          alert('Link copied to clipboard');
        }}
      >
        Share this property
      </button>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 border border-border text-heading text-sm font-body rounded-md hover:border-primary-600 hover:text-primary-600 transition-colors"
        >
          View original listing
        </a>
      )}
    </div>
  );
}

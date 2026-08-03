'use client';

export function PropertyActions({ url }: { url?: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className="px-6 py-3 text-white text-sm font-semibold rounded-pill transition-colors"
        style={{ background: '#2B6CF6' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#1E56D6')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#2B6CF6')}
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
          className="px-6 py-3 border text-sm font-semibold rounded-pill transition-colors"
          style={{ borderColor: '#DCE6F5', color: '#1E3A5F' }}
        >
          View original listing
        </a>
      )}
    </div>
  );
}

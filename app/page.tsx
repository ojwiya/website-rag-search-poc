export default function Home() {
  return (
    <main className="min-h-screen bg-surface-alt">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-semibold text-primary-600 tracking-tight">
            Property Search
          </a>
          <nav className="flex gap-6">
            <a href="#" className="text-sm font-body text-heading hover:text-primary-600 transition-colors">
              Browse
            </a>
            <a href="#" className="text-sm font-body text-heading hover:text-primary-600 transition-colors">
              About
            </a>
          </nav>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-heading tracking-display text-heading mb-4">
          Find your dream property
        </h1>
        <p className="text-lg text-muted mb-10 max-w-lg mx-auto">
          Search thousands of properties with natural language. Browse listings, compare details, and find the perfect home.
        </p>
        <div className="max-w-md mx-auto relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input
            type="text"
            placeholder="Search by location, price, or features..."
            className="w-full px-4 py-3 pl-11 pr-4 border border-borderInput rounded-md bg-surface text-heading text-sm shadow-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
          />
        </div>
      </section>
    </main>
  );
}
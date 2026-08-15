import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { buildLabelFromEnv } from '@/lib/build-info';

export function Footer() {
  const buildLabel = buildLabelFromEnv();
  return (
    <footer style={{ background: '#152A45' }} className="text-footer-muted">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <BrandLogo variant="footer" />
          <p className="mt-4 text-sm leading-relaxed max-w-xs" style={{ color: '#8FA0B8' }}>
            Overseas and holiday-home discovery — search in plain English, then view the full listing on the source site.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: '#8FA0B8' }}>
            Resources
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/guides/spain" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>
                Buying guide (Spain)
              </Link>
            </li>
            <li>
              <a href="#faq" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: '#8FA0B8' }}>
            Company
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/#waitlist" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>
                Contact / waitlist
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: '#8FA0B8' }}>
            Legal
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <span style={{ color: '#8FA0B8' }}>
                We are a discovery aggregator. Listings link out to source sites. Guides are educational, not legal advice.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: '#24405F' }}>
        <div className="max-w-7xl mx-auto px-6 py-5 text-xs flex items-center justify-between gap-4" style={{ color: '#7E90A8' }}>
          <span>© {new Date().getFullYear()} Homes in the Sun. All rights reserved.</span>
          <span style={{ color: '#5A6B80' }}>{buildLabel}</span>
        </div>
      </div>
    </footer>
  );
}

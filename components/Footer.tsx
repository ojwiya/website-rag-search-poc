import { BrandLogo } from '@/components/BrandLogo';

export function Footer() {
  return (
    <footer style={{ background: '#152A45' }} className="text-footer-muted">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand block */}
        <div>
          <BrandLogo variant="footer" />
          <p className="mt-4 text-sm leading-relaxed max-w-xs" style={{ color: '#8FA0B8' }}>
            Verified overseas property listings, searchable in plain English.
          </p>
          <p className="mt-4 text-sm font-semibold" style={{ color: '#8FA0B8' }}>
            +34 900 123 456
          </p>
        </div>

        {/* Resources */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: '#8FA0B8' }}>
            Resources
          </h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>Buying guide</a></li>
            <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>Area guides</a></li>
            <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>Mortgage calculator</a></li>
            <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>FAQ</a></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: '#8FA0B8' }}>
            Company
          </h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>About us</a></li>
            <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>How it works</a></li>
            <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>Contact</a></li>
            <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>Careers</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: '#8FA0B8' }}>
            Legal
          </h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>Privacy policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>Terms of use</a></li>
            <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>Cookie policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors" style={{ color: '#8FA0B8' }}>Disclaimer</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: '#24405F' }}>
        <div className="max-w-7xl mx-auto px-6 py-5 text-xs" style={{ color: '#7E90A8' }}>
          © {new Date().getFullYear()} Homes in the Sun. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

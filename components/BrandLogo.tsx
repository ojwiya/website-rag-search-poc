type Variant = 'header' | 'footer';

function SunHouseIcon({ idSuffix, size }: { idSuffix: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id={`skyGrad-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF9F6E" />
          <stop offset="55%" stopColor="#FFC65A" />
          <stop offset="100%" stopColor="#FFDD8C" />
        </linearGradient>
        <clipPath id={`badgeClip-${idSuffix}`}>
          <rect x="1" y="1" width="38" height="38" rx="11" />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill={`url(#skyGrad-${idSuffix})`} />
      <g clipPath={`url(#badgeClip-${idSuffix})`}>
        <circle cx="27" cy="13" r="7" fill="#FFE566" />
        <path d="M2 30 C9 25, 14 25, 20 29 C26 25, 31 25, 38 30 L38 40 L2 40 Z" fill="#17A398" />
        <path d="M16 17 L27 27 L27 37 L5 37 L5 27 Z" fill="#fff" />
        <rect x="14" y="30" width="5" height="7" fill="#1E3A5F" />
      </g>
    </svg>
  );
}

export function BrandLogo({ variant = 'header' }: { variant?: Variant }) {
  if (variant === 'footer') {
    return (
      <div className="flex items-center gap-3">
        <SunHouseIcon idSuffix="Footer" size={34} />
        <div className="leading-none">
          <div className="text-white font-extrabold" style={{ fontSize: 20, letterSpacing: '-0.01em' }}>
            Homes<span style={{ color: '#F5A623' }}>.</span>
          </div>
          <div
            className="font-bold uppercase"
            style={{ fontSize: 10, letterSpacing: '0.16em', color: '#8FA0B8', marginTop: 2 }}
          >
            In The Sun
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[13px]">
      <SunHouseIcon idSuffix="Header" size={50} />
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.05 }}>
        <div style={{ color: '#1E3A5F' }}>
          Homes<span style={{ color: '#F5A623' }}>.</span>
        </div>
        <div
          className="font-bold uppercase"
          style={{ fontSize: 12, letterSpacing: '0.16em', color: '#8A97A8', marginTop: 2 }}
        >
          In The Sun
        </div>
      </div>
    </div>
  );
}

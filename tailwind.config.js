module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Airbnb "Rausch" coral — the single brand accent
        rausch: {
          DEFAULT: '#FF385C',
          50: '#FFE9EE',
          100: '#FFD4DE',
          200: '#FFB3C6',
          500: '#FF385C',
          600: '#E31C5F',
          700: '#D70466',
          dark: '#BD1E59',
        },
        // Airbnb secondary teal (legacy/alt accent + hovers)
        babu: '#008489',
        // Map legacy tokens to Airbnb values so component classes keep working
        primary: {
          50: '#FFE9EE',
          100: '#FFD4DE',
          200: '#FFB3C6',
          500: '#FF385C',
          600: '#FF385C',
          700: '#E31C5F',
        },
        surface: {
          DEFAULT: '#ffffff',
          alt: '#F7F7F7', // page background
        },
        // Airbnb text/neutral scale
        heading: '#222222', // primary text (was #061b31)
        body: '#222222', // body text
        muted: '#717171', // secondary text (was #6B7280)
        border: '#DDDDDD', // was #E5E7EB
        borderInput: '#B0B0B0',
        borderSoft: '#EBEBEB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Source Code Pro', 'monospace'],
      },
      fontWeight: {
        heading: 600,
        body: 400,
        button: 600,
      },
      letterSpacing: {
        display: '-0.02em',
      },
      borderRadius: {
        // Airbnb uses generous, soft rounding
        sm: '8px',
        md: '12px',
        lg: '16px',
        pill: '9999px',
      },
      boxShadow: {
        // Soft, low-contrast shadows instead of hard borders
        card: '0 6px 16px rgba(0,0,0,0.12)',
        cardHover: '0 10px 24px rgba(0,0,0,0.16)',
        pill: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
        pillHover: '0 2px 4px rgba(0,0,0,0.18)',
        sm: '0 1px 2px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};

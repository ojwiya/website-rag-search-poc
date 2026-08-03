module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary interactive (links, buttons, search icon, active heart)
        primary: {
          DEFAULT: '#2B6CF6',
          600: '#1E56D6',
        },
        // Legacy alias kept so old class names keep resolving
        rausch: {
          DEFAULT: '#2B6CF6',
          600: '#1E56D6',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#EAF2FB', // page background
        },
        // Navy — headings / prices / locations
        heading: '#1E3A5F',
        body: '#1E3A5F',
        // Muted text (subtext, hero subhead)
        muted: '#5B6B82',
        // Faint muted (card meta, agent-verified, property-type tag)
        faint: '#8A97A8',
        // Card + hairline borders
        border: '#E7EEF8',
        borderSoft: '#E7EEF8',
        borderInput: '#DCE6F5',
        card: {
          DEFAULT: '#F8FAFD',
          border: '#E7EEF8',
          hover: '#FFFFFF',
          hoverBorder: '#DCE6F5',
        },
        // Orange — wordmark dot + Free guide kicker only
        orange: '#F5A623',
        // Listing tag text (white pill)
        tag: '#B87A1B',
        // Footer
        footer: {
          DEFAULT: '#152A45',
          muted: '#8FA0B8',
          border: '#24405F',
          copyright: '#7E90A8',
        },
        // Sea teal — logo icon only
        teal: '#17A398',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Source Code Pro', 'monospace'],
      },
      fontWeight: {
        heading: 700,
        body: 400,
        button: 600,
      },
      letterSpacing: {
        display: '-0.02em',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(30,58,95,0.06)',
        cardHover: '0 6px 16px rgba(30,58,95,0.08)',
        pill: '0 1px 2px rgba(30,58,95,0.05)',
        stripe: '0 2px 6px rgba(30,58,95,0.03)',
        sm: '0 1px 2px rgba(30,58,95,0.05)',
      },
    },
  },
  plugins: [],
};

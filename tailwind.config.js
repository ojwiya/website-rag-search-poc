module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        surface: {
          DEFAULT: '#ffffff',
          alt: '#F8FAFC',
        },
        heading: '#061b31',
        body: '#374151',
        muted: '#6B7280',
        border: '#E5E7EB',
        borderInput: '#D1D5DB',
      },
      fontFamily: {
        sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
        mono: ['Source Code Pro', 'monospace'],
      },
      fontWeight: {
        heading: 300,
        body: 400,
        button: 400,
      },
      letterSpacing: {
        display: '-0.02em',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        card: 'rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px',
        cardHover: 'rgba(50,50,93,0.25) 0px 36px 52px -28px, rgba(0,0,0,0.1) 0px 24px 42px -18px',
        sm: 'rgba(23,23,23,0.08) 0px 3px 6px',
      },
    },
  },
  plugins: [],
};

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces — deep midnight blue
        cream: {
          DEFAULT: '#0F1828',   // was page-bg cream — now main card surface
          dark: '#142136',      // elevated surface
        },
        // Primary accent — soft blue (was sage green)
        sage: {
          DEFAULT: '#95B0D9',
          light: '#6E8AB8',
          pale: '#1B2D48',      // subtle surface tint
        },
        // Secondary accent
        rose: {
          DEFAULT: '#C99CA0',
          light: '#B08488',
          pale: '#1E1618',
        },
        // Text scale — inverted for dark mode
        // 900 = lightest (primary text), 100 = darkest (borders/surfaces)
        warm: {
          900: '#E6E1D7',       // primary text (was near-black)
          700: '#B8B0A2',       // body / sub text
          500: '#8A8276',       // muted
          400: '#736B65',       // dim-muted
          300: '#5C5750',       // dim
          100: '#1B2D48',       // borders / line
          50:  '#0F1828',       // surface bg (for inputs etc.)
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 20px rgba(10,18,32,0.5)',
        card: '0 1px 8px rgba(10,18,32,0.6)',
      },
    },
  },
  plugins: [],
};

export default config;

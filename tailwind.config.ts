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
        cream: {
          DEFAULT: '#FAF8F4',
          dark: '#F0EBE3',
        },
        sage: {
          DEFAULT: '#7A9A6E',
          light: '#A8C09E',
          pale: '#D4E5CF',
        },
        rose: {
          DEFAULT: '#C4959B',
          light: '#DEB8BC',
          pale: '#F0D8DA',
        },
        warm: {
          900: '#3D3530',
          700: '#6B5F59',
          500: '#9B8E88',
          300: '#C8BFB9',
          100: '#EDE8E3',
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
        soft: '0 2px 16px rgba(61,53,48,0.06)',
        card: '0 1px 8px rgba(61,53,48,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;

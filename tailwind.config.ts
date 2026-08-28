import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        matte: {
          black: '#08090c',
          panel: '#0e1015',
          border: '#1c2029',
        },
        neon: {
          DEFAULT: '#3ea6ff',
          blue: '#3ea6ff',
          glow: '#7fd4ff',
        },
      },
      fontFamily: {
        display: ['var(--font-geometric)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(62, 166, 255, 0.35)',
        'glow-sm': '0 0 12px rgba(62, 166, 255, 0.25)',
      },
      backgroundImage: {
        glass: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
      },
    },
  },
  plugins: [],
};

export default config;

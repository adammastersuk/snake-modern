import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        modern: {
          bg: '#0b1020',
          card: '#101a32'
        },
        retro: {
          bg: '#05070a',
          card: '#11120d'
        }
      }
    }
  },
  plugins: []
} satisfies Config;

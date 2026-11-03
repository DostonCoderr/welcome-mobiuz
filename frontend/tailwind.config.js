/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mobiuz: {
          50: '#fff1f2',
          100: '#ffe1e3',
          200: '#ffc8cc',
          300: '#ff9ea5',
          400: '#ff6470',
          500: '#f52a39',
          600: '#e30613',
          700: '#b00410',
          800: '#8b030d',
          900: '#6b020a',
        },
        snow: '#f6f8fb',
        gold: '#fbbf24',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'shimmer': 'shimmer 1.4s ease-in-out infinite',
        'drift': 'drift 60s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        drift: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};
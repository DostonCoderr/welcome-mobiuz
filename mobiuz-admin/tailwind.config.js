/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe0e2',
          400: '#fb4a56',
          500: '#f5222f',
          600: '#e30613',
          700: '#b00410',
          800: '#8a030d',
        },
        ink: {
          950: '#0b0d10',
          900: '#0e1013',
          800: '#16181d',
          700: '#1c1f26',
          600: '#252932',
        },
      },
      boxShadow: {
        glow: '0 10px 40px -10px rgba(227, 6, 19, 0.45)',
        soft: '0 8px 30px -12px rgba(0, 0, 0, 0.6)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
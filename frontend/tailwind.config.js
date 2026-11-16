/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        coral: '#f9735b',
        cream: '#fffaf3',
      },
      boxShadow: {
        card: '0 18px 50px -28px rgba(15, 23, 42, 0.35)',
      },
    },
  },
  plugins: [],
};

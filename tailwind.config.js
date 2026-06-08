/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: { ink: '#0b0f17', panel: '#121826', edge: '#1f2937', accent: '#6ee7b7' },
    },
  },
  plugins: [],
}

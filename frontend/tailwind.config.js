/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-bg': '#0E0A06',
        'navy-surface': '#1A1008',
        'fire-bg': '#0E0A06',
        'fire-surface': '#1A1008',
        'orange': '#FF6B00',
        'gold': '#FFB800',
        'orange-alert': '#FF6B00',
        'green-success': '#00E676',
      }
    },
  },
  plugins: [],
}

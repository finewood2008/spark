/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/frontend/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        secondary: '#1E3A5F',
        accent: '#FFB347',
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
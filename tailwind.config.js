/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
    "./dist/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        'hn': {
          'bg': '#f6f6ef',
          'text': '#333',
          'orange': '#ff6600', 
          'link': '#0066cc',
          'gray': '#999',
          'border': '#e0e0e0',
        }
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  // Optimize for production
  future: {
    hoverOnlyWhenSupported: true,
  },
  corePlugins: {
    // Disable unused plugins to reduce bundle size
    container: false,
    float: false,
    clear: false,
    skew: false,
    caretColor: false,
    sepia: false,
  },
};
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        market: {
          ink: '#16201d',
          leaf: '#1f7a5c',
          lime: '#b7d553',
          clay: '#c45b3f',
          sky: '#4c8ed9'
        }
      }
    }
  },
  plugins: []
};

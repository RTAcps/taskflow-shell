/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f8fa',
          100: '#e9f1f6',
          200: '#d5e4ed',
          300: '#b3cde0',
          400: '#89b0d1',
          500: '#6694c1',
          600: '#4d79b0',
          700: '#3d639d',
          800: '#355180',
          900: '#2d4468',
          950: '#1e2c45',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

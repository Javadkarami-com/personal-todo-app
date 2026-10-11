/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./app.js",
    "./fa.js",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FBEAEA',
          100: '#F6D5D5',
          200: '#EEAAAA',
          300: '#E27676',
          400: '#D54545',
          500: '#C1121F',
          600: '#A4161A',
          700: '#8B1217',
          800: '#720E13',
          900: '#5A0B0E',
          950: '#380608',
        },
        ivory: '#FBF8F5',
        charcoal: '#1F2022',
        muted: '#7A7471',
        gold: {
          DEFAULT: '#C9A227',
          soft: '#FBF5E5',
          border: 'rgba(201, 162, 39, 0.45)'
        },
        borderwarm: '#EDE6E0'
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Nunito', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      letterSpacing: {
        normal: '0',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(31, 32, 34, 0.05)',
        'float': '0 6px 20px rgba(164, 22, 26, 0.28)',
      }
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Deep navy for text and civic structure
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#1e3a56',
          900: '#0f2744',
          950: '#0a192f',
        },
        // Restrained civic green for actions, resolutions, and highlights
        civic: {
          50: '#f2f9f4',
          100: '#e1f2e6',
          200: '#c5e5ce',
          300: '#99d2a9',
          400: '#66b87e',
          500: '#3f9d5a',
          600: '#2f8146',
          700: '#276639',
          800: '#225130',
          900: '#1d4329',
          950: '#0c2415',
        },
        brand: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          500: '#0f2744',
          600: '#0a192f',
        },
      },
    },
  },
  plugins: [],
}

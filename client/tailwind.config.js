/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#faf9f7',
          100: '#f5f3f0',
          200: '#e8e3dd',
          300: '#d9cfc5',
          400: '#b8a796',
          500: '#8b6f47',
          600: '#6b4e29',
          700: '#4a3620',
          800: '#3a2a18',
          900: '#2d1f0f',
        },
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d66',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

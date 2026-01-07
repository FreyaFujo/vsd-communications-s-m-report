/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./views/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        'vsd-blue': {
          light: '#3E92CC',
          DEFAULT: '#005A9C',
          dark: '#003B66',
        },
      },
    },
  },
  plugins: [],
}

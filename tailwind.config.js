/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: '#667eea',
          success: '#10b981',
          danger: '#ef4444'
        }
      },
    },
    plugins: [],
  }
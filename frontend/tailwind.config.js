/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        duo: {
          green: "#58CC02",
          greenDark: "#58A700",
          coral: "#FF4B4B",
          coralDark: "#EA2B2B",
          blue: "#1CB0F6",
          blueDark: "#1899D6",
          gold: "#FFC800",
          goldDark: "#E5B400",
          gray: "#E5E5E5",
          grayDark: "#AFAFAF",
          grayText: "#777777",
          card: "#FFFFFF",
          bg: "#F7F7F7",
        },
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

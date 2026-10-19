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
          greenDark: "#46A302",
          blue: "#1CB0F6",
          blueDark: "#1899D6",
          yellow: "#FFC800",
          yellowDark: "#E5A400",
          purple: "#CE82FF",
          purpleDark: "#A55EEA",
          red: "#FF4B4B",
          redDark: "#EA2B2B",
          gray: "#E5E5E5",
          grayDark: "#AFAFAF",
          card: "#FFFFFF",
          bg: "#F7F7F7",
        },
      },
    },
  },
  plugins: [],
}

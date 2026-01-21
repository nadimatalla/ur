/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        royal: {
          blue: "#1e3a8a", // Lapis Lazuli
          gold: "#f59e0b", // Gold highlights
        },
        stone: {
          light: "#f3f4f6",
          dark: "#1f2937",
        }
      },
    },
  },
  plugins: [],
}

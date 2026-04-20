/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Deep Amber — primary brand color
        amber: {
          950: "#1a0f00",
          900: "#2d1a00",
          800: "#4a2800",
          700: "#6b3a00",
          600: "#8c4d00",
          500: "#b36200",
          400: "#d4820a",
          300: "#e6a030",
          200: "#f0c060",
          100: "#fae0a0",
          50: "#fff8e8",
        },
        // Slate Grey — background & surface
        slate: {
          950: "#0a0c10",
          900: "#111318",
          800: "#1a1d24",
          700: "#252830",
          600: "#363a44",
          500: "#4a4f5a",
          400: "#6b7080",
          300: "#9098a8",
          200: "#c0c8d8",
          100: "#e0e4ee",
          50: "#f5f6fa",
        },
        // Foam White — text & accents
        foam: {
          DEFAULT: "#FFF8F0",
          50: "#FFFCF8",
          100: "#FFF8F0",
          200: "#FFEFD6",
          300: "#FFE4B8",
        },
      },
    },
  },
  plugins: [],
};

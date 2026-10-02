import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        foundation: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        // AMOLED-inspired dark theme mapping with zero navy/blue tint
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#a3a3a3", // secondary text in dark mode
          500: "#737373", // muted text in dark mode
          600: "#525252",
          700: "#242424", // standard border in dark mode
          800: "#1a1a1a", // subtle border in dark mode
          850: "#151515", // secondary surface in dark mode
          900: "#0a0a0a", // primary surface in dark mode
          950: "#050505", // app background in dark mode
        },
        amoled: {
          bg: "#050505",
          surface: "#0A0A0A",
          elevated: "#101010",
          secondary: "#151515",
          input: "#0D0D0D",
          border: "#242424",
          borderSubtle: "#1A1A1A",
          text: "#F5F5F5",
          textSecondary: "#A3A3A3",
          textMuted: "#737373",
        },
      },
    },
  },
  plugins: [],
};

export default config;

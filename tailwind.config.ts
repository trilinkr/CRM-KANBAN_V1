import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#2d2d2d", muted: "#716b67", canvas: "#fff8f3", line: "#eadfd7", brand: "#f56600", accent: "#fff0e5" },
      boxShadow: { soft: "0 8px 30px rgba(23,32,38,.06)" },
    },
  },
  plugins: [],
} satisfies Config;

import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#172026", muted: "#66727d", canvas: "#f6f8f9", line: "#e5eaed", brand: "#236b5e", accent: "#e7f4ef" },
      boxShadow: { soft: "0 8px 30px rgba(23,32,38,.06)" },
    },
  },
  plugins: [],
} satisfies Config;

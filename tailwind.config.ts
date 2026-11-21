import type { Config } from "tailwindcss";
export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#04060f",
        panel: "#0b1124",
        edge: "#1e2742",
        iris: "#6366f1",
        "iris-bright": "#8b8cff",
        nebula: "#a78bfa",
        star: "#e0e7ff",
        gold: "#8b8cff",
        gain: "#10b981",
        loss: "#f43f5e",
      },
    },
  },
  plugins: [],
} satisfies Config;

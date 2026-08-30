import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        matte: {
          950: "#050608",
          900: "#0a0c10",
          800: "#12151b",
          700: "#1b1f28",
          600: "#262b36",
        },
        neon: {
          400: "#5ce8ff",
          500: "#00d4ff",
          600: "#00a8cc",
        },
      },
      boxShadow: {
        glow: "0 0 24px 0 rgba(0, 212, 255, 0.35)",
        "glow-sm": "0 0 12px 0 rgba(0, 212, 255, 0.25)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 20% -10%, rgba(0,212,255,0.12), transparent 45%)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

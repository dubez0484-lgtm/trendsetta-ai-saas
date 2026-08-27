import type { Config } from "tailwindcss";

// THETRENDSETTA brand system: Cyberpunk Luxury.
// Matte black background, electric neon blue accents, glassmorphism, mobile-first.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        matte: {
          black: "#0a0a0c",
          surface: "#121216",
          border: "#22222a",
        },
        neon: {
          blue: "#2e6bff",
          glow: "#5b8dff",
        },
      },
      boxShadow: {
        "neon-glow": "0 0 24px 0 rgba(46, 107, 255, 0.35)",
      },
      backdropBlur: {
        glass: "16px",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

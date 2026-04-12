import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0a0c10",
          muted: "#121722",
          soft: "#1a2230",
        },
        paper: "#f6f4ef",
        /** Primary accent — purple on ink/black */
        brand: {
          DEFAULT: "#7c3aed",
          bright: "#c4b5fd",
          dim: "#5b21b6",
        },
      },
    },
  },
  plugins: [],
};

export default config;

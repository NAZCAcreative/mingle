import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        blush: "rgb(var(--color-blush) / <alpha-value>)",
        mingle: "rgb(var(--color-mingle) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 12px 32px rgba(255, 95, 134, 0.10)",
        card: "0 8px 24px rgba(40, 20, 20, 0.06)"
      },
      borderRadius: {
        card: "24px",
        button: "18px"
      }
    }
  },
  plugins: []
};

export default config;

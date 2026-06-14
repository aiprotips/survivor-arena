import type { Config } from "tailwindcss";

const config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./src/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          background: "var(--color-background)",
          card: "var(--color-card)",
          gold: "var(--color-gold)",
          yellow: "var(--color-yellow)",
          white: "var(--color-white)",
          muted: "var(--color-muted)",
          elimination: "var(--color-elimination)",
          survival: "var(--color-survival)",
          ink: "var(--color-ink)",
          border: "var(--color-border)",
        },
      },
      fontFamily: {
        sans: ["var(--font-arena)"],
        display: ["var(--font-display)"],
      },
      borderRadius: {
        arena: "var(--radius-base)",
        "arena-card": "var(--radius-card)",
        "arena-button": "var(--radius-button)",
      },
      boxShadow: {
        "arena-card": "var(--shadow-card)",
        "arena-glow": "var(--shadow-glow)",
        "arena-button": "var(--shadow-button)",
      },
      spacing: {
        "arena-page": "var(--spacing-page-x)",
        "arena-section": "var(--spacing-section-y)",
        "arena-stack": "var(--spacing-stack)",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;

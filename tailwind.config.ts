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
          surface: "var(--color-surface)",
          card: "var(--color-card)",
          "card-strong": "var(--color-card-strong)",
          "surface-elevated": "var(--color-surface-elevated)",
          blue: "var(--color-blue)",
          "blue-hover": "var(--color-blue-hover)",
          "blue-soft": "var(--color-blue-soft)",
          gold: "var(--color-gold)",
          "gold-strong": "var(--color-gold-strong)",
          white: "var(--color-white)",
          muted: "var(--color-muted)",
          "muted-soft": "var(--color-muted-soft)",
          "text-primary": "var(--color-text-primary)",
          "text-secondary": "var(--color-text-secondary)",
          ink: "var(--color-ink)",
          border: "var(--color-border)",
          "border-strong": "var(--color-border-strong)",
        },
      },
      fontFamily: {
        sans: ["var(--font-arena)"],
        display: ["var(--font-display)"],
      },
      borderRadius: {
        arena: "var(--radius-base)",
        "arena-card": "var(--radius-card)",
        "arena-panel": "var(--radius-panel)",
        "arena-pill": "var(--radius-pill)",
      },
      boxShadow: {
        "arena-card": "var(--shadow-card)",
        "arena-glow": "var(--shadow-glow)",
        "arena-gold-glow": "var(--shadow-gold-glow)",
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

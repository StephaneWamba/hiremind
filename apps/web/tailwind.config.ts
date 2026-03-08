import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-app":        "var(--bg-app)",
        "bg-card":       "var(--bg-card)",
        "text-primary":  "var(--text-primary)",
        "text-muted":    "var(--text-muted)",
        "text-subtle":   "var(--text-subtle)",
        border:          "var(--border)",
        primary:         "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "primary-bg":    "var(--primary-bg)",
        success:         "var(--success)",
        warning:         "var(--warning)",
        danger:          "var(--danger)",
        "iv-bg":         "var(--iv-bg)",
        "iv-surface":    "var(--iv-surface)",
        "iv-border":     "var(--iv-border)",
        "iv-text":       "var(--iv-text)",
        "iv-text-muted": "var(--iv-text-muted)",
        "iv-accent":     "var(--iv-accent)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

export default config

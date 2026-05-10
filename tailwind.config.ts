import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand tokens — reference CSS variables so they adapt to light/dark theme.
        // Format: space-separated RGB for Tailwind opacity modifier support (bg-gem-onyx/50).
        "gem-onyx": "rgb(var(--gem-onyx) / <alpha-value>)",
        "gem-slate": "rgb(var(--gem-slate) / <alpha-value>)",
        "gem-mist": "rgb(var(--gem-mist) / <alpha-value>)",
        "gem-offwhite": "rgb(var(--gem-offwhite) / <alpha-value>)",
        "gem-muted": "rgb(var(--gem-muted) / <alpha-value>)",
        "gem-border": "rgb(var(--gem-border) / <alpha-value>)",
        "gem-hover": "rgb(var(--gem-hover) / <alpha-value>)",
        "gem-blue": "rgb(var(--gem-blue) / <alpha-value>)",
        "law-gold": "rgb(var(--law-gold) / <alpha-value>)",
        "law-dark": "rgb(var(--law-dark) / <alpha-value>)",
        "law-accent": "rgb(var(--law-accent) / <alpha-value>)",
        "law-amber": "#b45309",

        // Shadcn semantic aliases — let shadcn primitives respect our theme.
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
      },
      fontFamily: {
        serif: ['"Crimson Pro"', "serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

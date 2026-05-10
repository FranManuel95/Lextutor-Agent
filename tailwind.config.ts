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
        // All brand tokens reference CSS variables so they adapt to light/dark theme.
        // Format: space-separated RGB for Tailwind opacity modifier support (bg-gem-onyx/50).
        "gem-onyx": "rgb(var(--gem-onyx) / <alpha-value>)",
        "gem-slate": "rgb(var(--gem-slate) / <alpha-value>)",
        "gem-mist": "rgb(var(--gem-mist) / <alpha-value>)",
        "gem-offwhite": "rgb(var(--gem-offwhite) / <alpha-value>)",
        "gem-blue": "rgb(var(--gem-blue) / <alpha-value>)",
        "law-gold": "rgb(var(--law-gold) / <alpha-value>)",
        "law-dark": "rgb(var(--law-dark) / <alpha-value>)",
        "law-accent": "rgb(var(--law-accent) / <alpha-value>)",
        "law-amber": "#b45309",
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

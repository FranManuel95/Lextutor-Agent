import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "law-dark": "#020617", // updated to match gem-onyx/deep navy
                "law-gold": "#FDBF11", // brighter gold from screenshot
                "law-amber": "#b45309",
                "law-accent": "#1e293b", // slate for glassy backgrounds
                "gem-onyx": "#020617",
                "gem-slate": "#0f172a",
                "gem-mist": "#1e293b",
                "gem-offwhite": "#f8fafc",
                "gem-blue": "#3b82f6",
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

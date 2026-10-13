/**
 * Tailwind CSS config.
 *
 * This project runs Tailwind CSS v4, whose design tokens live in the
 * `@theme` block at the top of `src/index.css`. This file is loaded from
 * there via `@config` so editors, plugins and anyone used to the classic
 * v3 setup have a familiar place to look. Keep the values here in sync
 * with `@theme`.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#08090b",
        surface: "#0f1114",
        paper: "#f2f3ef",
        dim: "#a0a6af",
        line: "#22262d",
        accent: { DEFAULT: "#c6f432", dim: "#86a32b", soft: "#1b2410" },
        faint: "#7d838c",
        tide: "#3ad6c3",
      },
      fontFamily: {
        display: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
        script: ["Cedarville Cursive", "cursive"],
      },
    },
  },
  plugins: [],
};

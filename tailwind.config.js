/** Colors come from CSS variables (see index.css) so light/dark share one set of utility classes. */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"), surface: v("surface"), sunk: v("sunk"), ink: v("ink"), mute: v("mute"), line: v("line"),
        brand: { DEFAULT: v("brand"), soft: v("brand-soft"), ink: v("brand-ink") },
        flag: { blue: "#1D5FA8", green: "#2E8B57", yellow: "#E8B422" },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Hanken Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "14px", "2xl": "20px" },
      boxShadow: { card: "0 1px 0 rgb(var(--line)), 0 8px 24px -16px rgb(14 26 43 / .25)" },
    },
  },
  plugins: [],
};

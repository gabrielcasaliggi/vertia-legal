/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        corp: {
          bg: "#eef4fb",
          panel: "rgba(255, 255, 255, 0.88)",
          surface: "#eaf2fb",
          border: "rgba(148, 163, 184, 0.36)",
          text: "#0f172a",
          muted: "#64748b",
          highlight: "#fef08a",
          olive: "#ecfccb",
          emerald: "#059669",
          amber: "#d97706",
          terracotta: "#c2410c",
        },
        vertia: {
          navy: "#f8fafc",
          deep: "#ffffff",
          panel: "#ffffff",
          steel: "#f1f5f9",
          border: "#e2e8f0",
          "border-muted": "#cbd5e1",
          cyan: "#64748b",
          "cyan-muted": "#94a3b8",
          teal: "#475569",
          emerald: "#059669",
          "emerald-bright": "#10b981",
          crimson: "#c2410c",
          amber: "#d97706",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "Arial", "sans-serif"],
      },
      borderRadius: {
        corp: "8px",
      },
      boxShadow: {
        corp: "0 20px 70px rgba(15, 23, 42, 0.08)",
        "corp-md": "0 16px 40px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
};

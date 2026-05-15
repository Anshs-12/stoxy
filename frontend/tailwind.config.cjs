/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "var(--color-bg-base)",
        surface: "var(--color-bg-surface)",
        neutral: "var(--color-bg-neutral)",
        primary: "var(--color-text-primary)",
        muted: "var(--color-text-muted)",
        'muted-heavy': "var(--color-text-muted-heavy)",
        border: "var(--color-border)",
        'border-light': "var(--color-border-light)",
        positive: "var(--color-positive)",
        negative: "var(--color-negative)",
        black: "#121212",
        outline: "rgba(18, 18, 18, 0.15)",
      },
      fontFamily: {
        manrope: ["Manrope", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      boxShadow: {
        ambient:
          "0 4px 24px -1px rgba(18, 18, 18, 0.04), 0 2px 8px -1px rgba(18, 18, 18, 0.02)",
      },
      animation: {
        'in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
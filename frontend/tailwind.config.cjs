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
        accent: "var(--color-accent)",
      },
      fontFamily: {
        sans: ["Inter", "DM Sans", "system-ui", "sans-serif"],
        heading: ["Inter", "DM Sans", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "SF Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
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
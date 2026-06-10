/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        panel: 'var(--color-panel)',
        border: 'var(--color-border)',
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        // Semantic custom statuses
        success: '#22C55E',
        warning: '#F97316',
        danger: '#EF4444',
        info: '#EAB308'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
      }
    },
  },
  plugins: [],
}

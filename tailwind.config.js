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
        surface: 'var(--color-surface)',
        'surface-high': 'var(--color-surface-high)',
        accent: '#4F6EF7',
        'accent-dim': 'var(--color-accent-dim)',
        gold: '#C9973A',
        'gold-dim': 'var(--color-gold-dim)',
        teal: '#14B8A6',
        'teal-dim': 'var(--color-teal-dim)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-muted': 'var(--color-on-surface-muted)',
        'on-surface-subtle': 'var(--color-on-surface-subtle)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      maxWidth: {
        bio: '468px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.45s ease-out forwards',
      },
    },
  },
  plugins: [],
}

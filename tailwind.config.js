/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#07091A',
        surface: '#0B0E20',
        'surface-high': '#111528',
        accent: '#4F6EF7',
        'accent-dim': 'rgba(79,110,247,0.12)',
        gold: '#C9973A',
        'gold-dim': 'rgba(201,151,58,0.12)',
        teal: '#14B8A6',
        'teal-dim': 'rgba(20,184,166,0.12)',
        'on-surface': '#E2E8F5',
        'on-surface-muted': '#7A8BAD',
        'on-surface-subtle': '#3B4A68',
        border: 'rgba(255,255,255,0.07)',
        'border-strong': 'rgba(255,255,255,0.12)',
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

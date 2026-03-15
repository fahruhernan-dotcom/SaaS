/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#06090F',
        'bg-1': '#0C1319',
        'bg-2': '#111C24',
        'bg-3': '#162230',
        
        'border-subtle': 'rgba(255, 255, 255, 0.05)',
        'border-default': 'rgba(255, 255, 255, 0.09)',
        'border-strong': 'rgba(255, 255, 255, 0.16)',
        'border-accent': 'rgba(16, 185, 129, 0.35)',

        'emerald-50': '#ECFDF5',
        'emerald-300': '#6EE7B7',
        'emerald-400': '#34D399',
        'emerald-500': '#10B981',
        'emerald-600': '#059669',
        'emerald-glow': 'rgba(16, 185, 129, 0.12)',
        'emerald-glow-strong': 'rgba(16, 185, 129, 0.20)',

        'gold-400': '#FBBF24',
        'gold-500': '#F59E0B',
        'gold-glow': 'rgba(245, 158, 11, 0.12)',

        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#4B6478',
        'text-accent': '#34D399',

        'red': '#F87171',
        'red-bg': 'rgba(248, 113, 113, 0.10)',
      },
      fontFamily: {
        'display': ['Sora', 'sans-serif'],
        'body': ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

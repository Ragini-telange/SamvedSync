/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101820',
        'ink-surface': '#17222E',
        'ink-surface-2': '#1E2B3A',
        paper: '#F7F9FA',
        saline: '#4FB8AE',
        'saline-bright': '#6FD4C9',
        'saline-dim': '#2E7069',
        pulse: '#FF6B5B',
        'pulse-dim': '#C74B3E',
        amber: '#F2A93B',
        'amber-dim': '#B9821E'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      }
    }
  },
  plugins: []
};

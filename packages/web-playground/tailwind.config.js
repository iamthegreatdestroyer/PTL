/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ptl: {
          high: '#22c55e',
          medium: '#eab308',
          low: '#ef4444',
          bg: '#1e1e1e',
          surface: '#252526',
          border: '#3e3e42',
          text: '#d4d4d4',
          accent: '#007acc',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

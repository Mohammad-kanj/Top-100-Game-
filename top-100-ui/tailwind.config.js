/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Silkscreen', 'cursive', 'sans-serif'],
        mono: ['Silkscreen', 'monospace', 'sans-serif'],
        silkscreen: ['Silkscreen', 'cursive', 'sans-serif'],
        titan: ['"Titan One"', 'cursive', 'sans-serif'],
      },
      colors: {
        'mint-bright': '#62f6bd',
        'emerald': '#10aa83',
        'forest-teal': '#087d6a',
        'ocean-slate': '#003c5a',
        'ice-cyan': '#9cf6ff',
        'sky-cyan': '#00b6de',
        'marine-blue': '#0071b4',
        'midnight-navy': '#0c1079',
        'soft-mint': '#6ad6cd',
        'electric-blue': '#107dee',
        'cobalt': '#3120cd',
        'velvet-purple': '#4a089c',
        'periwinkle': '#787bd1',
        'royal-violet': '#4a34de',
        'steel-slate': '#4d6b75',
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Archivo"', 'system-ui', 'sans-serif'],
        mono: ['"Archivo"', 'monospace'],
        title: ['"Titan One"', '"Archivo"', 'cursive', 'sans-serif'],
      },
      colors: {
        /* Core Palette */
        crimson:     '#891c1c',
        black:       '#0d0d0d',
        lemon:       '#fffbd4',
        navy:        '#0a0f23',
        coral:       '#ef5368',
        /* Semantic Aliases */
        mint:        '#fffbd4',
        emerald:     '#ef5368',
        forest:      '#891c1c',
        ocean:       '#0a0f23',
        marine:      '#891c1c',
        electric:    '#ef5368',
        midnight:    '#0d0d0d',
        ice:         '#fffbd4',
        sky:         '#ef5368',
        softmint:    '#fffbd4',
        cobalt:      '#891c1c',
        velvet:      '#0d0d0d',
        periwinkle:  '#891c1c',
        royal:       '#891c1c',
        steel:       '#ef5368',
      },
    },
  },
  plugins: [],
};

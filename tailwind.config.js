export default {
  content: [
    "./index.html",
    "./{components,contexts,hooks,pages,services}/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
        colors: {
              'cyan': {
                50: '#ecfeff',
                100: '#cffafe',
                200: '#a5f3fd',
                300: '#67e8f9',
                400: '#22d3ee',
                500: '#06b6d4',
                600: '#0891b2',
                700: '#0e7490',
                800: '#155e75',
                900: '#164e63',
                950: '#083344',
              }
            },
            fontFamily: {
              'serif': ['"Source Serif 4"', 'serif'],
              'sans': ['"Inter"', 'sans-serif'],
              'mono': ['"Inconsolata"', 'monospace'],
            },
            animation: {
              'fade-in': 'fadeIn 0.5s ease-in-out',
            },
            keyframes: {
              fadeIn: {
                '0%': { opacity: 0, transform: 'translateY(10px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }
    },
  },
  plugins: [],
}
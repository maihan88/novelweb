// maihan88/novelweb/novelweb-d14588e6d469796ca4d76fea103c02df2ebaa5a1/tailwind.config.js
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
              },
            },
            fontFamily: {
              // --- KHÔI PHỤC FONT MẶC ĐỊNH ---
              'sans': ['"Inter"', 'sans-serif'], // Font chính cho UI
              'serif': ['"Source Serif 4"', 'serif'], // Font serif phụ (nếu dùng ở đâu đó)
              'mono': ['"Inconsolata"', 'monospace'], // Font mono phụ (nếu dùng)
              // --- KẾT THÚC KHÔI PHỤC ---

              // --- ĐỊNH NGHĨA FONT CHO READER (SỬ DỤNG KEY MỚI) ---
              'reader-times': ['"Times New Roman"', 'Times', 'serif'],
              'reader-lora': ['"Lora"', 'serif'],
              'reader-antiqua': ['"Book Antiqua"', 'Palatino', 'Palatino Linotype', 'serif'],
              // --- KẾT THÚC ĐỊNH NGHĨA READER ---
            },
            animation: {
              'fade-in': 'fadeIn 0.5s ease-in-out',
              'pan-up': 'pan-up 7s ease-in-out forwards',
              'pan-down': 'pan-down 7s ease-in-out forwards',
              'blob': 'blob 7s infinite', // Animation cho đốm sáng
            },
            keyframes: {
              fadeIn: {
                '0%': { opacity: 0, transform: 'translateY(10px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
              'pan-up': {
                '0%': { backgroundPosition: '50% 80%' },
                '100%': { backgroundPosition: '50% 20%' },
              },
              'pan-down': {
                  '0%': { backgroundPosition: '50% 20%' },
                  '100%': { backgroundPosition: '50% 80%' },
              },
              'blob': {
                '0%': { transform: 'translate(0px, 0px) scale(1)' },
                '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                '100%': { transform: 'translate(0px, 0px) scale(1)' },
             },
          }
    },
  },
  plugins: [],
}


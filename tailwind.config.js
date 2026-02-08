// maihan88/novelweb/novelweb-d14588e6d469796ca4d76fea103c02df2ebaa5a1/tailwind.config.js
export default {
  content: [
    "./index.html",
    "./{components,contexts,hooks,pages,services}/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Quan trọng: Giữ nguyên để ThemeContext hoạt động
  theme: {
    extend: {
        colors: {
            // --- HỆ MÀU SUKEM NOVEL (Sử dụng CSS Variables) ---
            sukem: {
                bg: 'var(--color-sukem-bg)',           // Nền chính
                card: 'var(--color-sukem-card)',       // Nền phụ/Card
                text: 'var(--color-sukem-text)',       // Chữ chính
                'text-muted': 'var(--color-sukem-text-muted)', // Chữ phụ
                primary: 'var(--color-sukem-primary)', // Màu chủ đạo (Pink/Red)
                secondary: 'var(--color-sukem-secondary)', // Màu phụ (Green/Latte)
                accent: 'var(--color-sukem-accent)',   // Màu nhấn/Link (Gold/Amber)
                border: 'var(--color-sukem-border)',   // Viền
            },
            // --- GIỮ LẠI MÀU CYAN CŨ ---
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
            'sans': ['"Inter"', 'sans-serif'],
            'serif': ['"Source Serif 4"', 'serif'],
            'mono': ['"Inconsolata"', 'monospace'],
            'reader-times': ['"Times New Roman"', 'Times', 'serif'],
            'reader-lora': ['"Lora"', 'serif'],
            'reader-antiqua': ['"Book Antiqua"', 'Palatino', 'Palatino Linotype', 'serif'],
        },
        animation: {
            'fade-in': 'fadeIn 0.5s ease-in-out',
            'pan-up': 'pan-up 7s ease-in-out forwards',
            'pan-down': 'pan-down 7s ease-in-out forwards',
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
            }
        }
    },
  },
  plugins: [],
}
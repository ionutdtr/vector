/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0A1B',
          surface: '#14142C',
          surface2: '#1C1C3B',
          hero: '#16163A',
        },
        content: {
          primary: '#FFFFFF',
          secondary: '#A6A9C4',
          muted: '#71749A',
          disabled: '#4B4E70',
        },
        accent: {
          DEFAULT: '#3B5BFD',
          hover: '#5A76FF',
          pressed: '#2F49D6',
          wash: 'rgba(59,91,253,0.14)',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#38BDF8',
        hairline: 'rgba(255,255,255,0.07)',
        stroke: 'rgba(255,255,255,0.12)',
      },
      borderRadius: {
        sm: '12px',
        md: '18px',
        lg: '28px',
        card: '32px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};

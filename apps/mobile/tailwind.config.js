/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0B0A14',
          surface: '#17151F',
          surface2: '#201D2B',
          hero: '#262238',
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
        signal: {
          DEFAULT: '#E5A94E',
          hover: '#F2BD68',
          wash: 'rgba(229,169,78,0.14)',
        },
        success: {
          DEFAULT: '#5FA98C',
          wash: 'rgba(95,169,140,0.14)',
        },
        danger: {
          DEFAULT: '#C56B4E',
          wash: 'rgba(197,107,78,0.14)',
        },
        warning: '#F59E0B',
        info: '#38BDF8',
        violet: '#A78BFA',
        hairline: 'rgba(255,255,255,0.07)',
        stroke: 'rgba(255,255,255,0.12)',
      },
      borderRadius: {
        sm: '10px',
        md: '16px',
        lg: '22px',
        card: '24px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};

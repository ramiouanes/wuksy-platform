/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '375px',   // iPhone SE and similar
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Zen-inspired color palette: Sage green + warm neutrals + soft whites
        primary: {
          50: '#f6f8f6',
          100: '#e8f0e8',
          200: '#d3e4d3',
          300: '#b3d1b3',
          400: '#8bb88b',
          500: '#6b9d6b', // Sage green - main accent
          600: '#5a8a5a',
          700: '#4a724a',
          800: '#3d5d3d',
          900: '#334d33',
        },
        secondary: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e', // Warm gray - secondary accent
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        neutral: {
          50: '#fafafa', // Pure white backgrounds
          100: '#f7f7f7',
          200: '#f0f0f0',
          300: '#e8e8e8',
          400: '#d1d1d1',
          500: '#a3a3a3',
          600: '#737373',
          700: '#525252',
          800: '#404040',
          900: '#262626',
        },
        // Soft accent colors for health states
        sage: {
          50: '#f6f8f6',
          500: '#6b9d6b',
          600: '#5a8a5a',
        },
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          500: '#78716c',
          600: '#57534e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-calm': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
}
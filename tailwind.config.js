/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--dynamic-primary, #22c55e)',
          light: 'var(--dynamic-primary, #22c55e)',
          dark: '#1eb154ff'
        },
        secondary: {
          DEFAULT: '#6c757d',
          light: '#8c959e',
          dark: '#495057'
        },
        dark: {
          DEFAULT: '#000',
          100: '#161616',
          200: '#2d2d2d',
          300: '#3d3d3d'
        },
        light: {
          DEFAULT: '#fff',
          100: '#f8f9fa',
          200: '#e9ecef',
          300: '#dee2e6'
        },
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: 'var(--dynamic-primary, #22c55e)',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        }
      },
      boxShadow: {
        'primary': '0 4px 14px 0 var(--dynamic-primary, #22c55e)',
        'primary-sm': '0 2px 7px 0 var(--dynamic-primary, #22c55e)',
        'primary-lg': '0 10px 25px 0 var(--dynamic-primary, #22c55e)',
      },
      ringColor: {
        primary: 'var(--dynamic-primary, #22c55e)',
      },
      ringWidth: {
        primary: '2px',
      }
    }
  },
  plugins: []
};

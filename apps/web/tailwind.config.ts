import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        // Paleta verde inspirada en el logo equmanager
        brand: {
          50: '#f1f8f3',
          100: '#dcedde',
          200: '#bbdcc0',
          300: '#8fc395',
          400: '#5ea568',
          500: '#3f8649',
          600: '#2f6a39',
          700: '#27552f',
          800: '#1f4327',
          900: '#16361e',
          950: '#0c2014',
        },
        accent: {
          50: '#fef9ed',
          100: '#fcefc8',
          200: '#fadc8d',
          300: '#f7c44c',
          400: '#f4b020',
          500: '#dd9510',
          600: '#bb720d',
          700: '#955310',
          800: '#7a4214',
          900: '#653716',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        soft: '0 4px 14px rgba(22, 54, 30, 0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;

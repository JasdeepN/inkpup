import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';
import aspectRatio from '@tailwindcss/aspect-ratio';

const config = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic tokens for light/dark
        bg: {
          DEFAULT: '#0b1220', // dark background
          light: '#fff',
          dark: '#0b1220',
        },
        surface: {
          DEFAULT: '#171e2e', // card/surface
          light: '#fff',
          dark: '#171e2e',
        },
        primary: {
          DEFAULT: '#e6eef8', // main text
          light: '#111827',
          dark: '#e6eef8',
        },
        accent: {
          DEFAULT: '#fb7185', // pink accent
          light: '#ef4444',
          dark: '#fb7185',
        },
        muted: {
          DEFAULT: '#94a3b8',
          light: '#6b7280',
          dark: '#94a3b8',
        },
        border: {
          DEFAULT: '#232b3d',
          light: '#e5e7eb',
          dark: '#232b3d',
        },
        code: {
          DEFAULT: '#1e293b',
          light: '#f3f4f6',
          dark: '#1e293b',
        },
      },
      boxShadow: {
        'card': '0 2px 8px 0 rgba(0,0,0,0.18)',
      },
      borderRadius: {
        'xl': '1rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [
    typography,
    forms,
    aspectRatio,
    function({ addVariant }) {
      addVariant('dark', '.dark &');
    }
  ]
};

export default config;

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
        // Semantic tokens using CSS variables
        bg: {
          DEFAULT: 'var(--bg)',
          light: '#fff',
          dark: '#0b1220',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          light: '#fff',
          dark: '#171e2e',
        },
        primary: {
          DEFAULT: 'var(--text)',
          light: '#111827',
          dark: '#e6eef8',
        },
        accent: {
          DEFAULT: 'var(--brand-accent)',
          light: '#ef4444',
          dark: '#fb7185',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          light: '#6b7280',
          dark: '#94a3b8',
        },
        border: {
          DEFAULT: 'var(--border)',
          light: '#e5e7eb',
          dark: '#232b3d',
        },
        code: {
          DEFAULT: 'var(--surface-elevated)',
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

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ops: {
          950: '#09090b', // Deep rich black
          900: '#121215', // Card charcoal black
          850: '#18181b', // Surface dark grey
          800: '#27272a', // Border grey
          700: '#3f3f46', // Muted border
          600: '#52525b', // Subtle grey
          500: '#71717a', // Muted text grey
          400: '#a1a1aa', // Secondary text grey
          300: '#d4d4d8', // Light text grey
          200: '#e4e4e7', // Subtle surface
          100: '#f4f4f5', // Soft grey
          50: '#fafafa'   // Off white
        },
        brand: {
          black: '#09090b',
          dark: '#121215',
          grey: '#27272a',
          light: '#f4f4f5',
          orange: '#ea580c',
          orangeHover: '#c2410c'
        },
        amber: {
          accent: '#ea580c', // Pure vibrant enterprise orange
          bright: '#f97316', // Crisp bright orange
          glow: '#fb923c'    // Warm orange highlight
        },
        status: {
          draft: '#f97316',
          confirmed: '#10b981',
          cancelled: '#71717a',
          low: '#ef4444',
          active: '#10b981',
          lead: '#3b82f6',
          inactive: '#71717a'
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};

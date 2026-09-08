/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
          orange: '#ff6600', // Electric bright orange
          orangeHover: '#e65c00',
          brightOrange: '#ff781f'
        },
        amber: {
          accent: '#ff6600', // Bright primary orange
          bright: '#ff781f', // Vibrant neon orange
          glow: '#ff944d'    // Glowing orange
        },
        status: {
          draft: '#ff781f',
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

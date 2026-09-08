/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ops: {
          950: '#070a12',
          900: '#0c1220',
          850: '#11192c',
          800: '#17223b',
          700: '#233254',
          600: '#344670',
          500: '#4d6293',
          400: '#7389b8',
          300: '#a3b4d6',
          200: '#d0daf0',
          100: '#edf2fb',
          50: '#f8fafc'
        },
        amber: {
          accent: '#d97706',
          bright: '#f59e0b',
          glow: '#fbbf24'
        },
        status: {
          draft: '#f59e0b',
          confirmed: '#10b981',
          cancelled: '#ef4444',
          low: '#f43f5e',
          active: '#059669',
          lead: '#3b82f6',
          inactive: '#64748b'
        }
      },
      fontFamily: {
        sans: ['"JetBrains Sans"', '"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};

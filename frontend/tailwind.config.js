/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B1120',       // Main Background Navy
          card: '#111827',     // Card Surface Slate
          border: '#1E293B',   // Border Slate 800
          hover: '#334155',    // Slate 700
        },
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',      // Primary SpaceX Royal Blue
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        status: {
          success: '#22C55E',  // Emerald Green
          warning: '#F59E0B',  // Amber Warning
          error: '#EF4444',    // E-STOP Red
          info: '#3B82F6',     // Cyan/Blue
        }
      },
      borderRadius: {
        '2xl': '16px',
        'xl': '12px',
      },
      boxShadow: {
        'soft': '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        'glow-blue': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.4)',
        'glow-green': '0 0 20px -3px rgba(34, 197, 94, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}

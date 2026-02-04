/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}", // Added components folder based on structure
    "./*.{js,ts,jsx,tsx}" // Added root files like App.tsx
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'stacked': '0 2px 1px rgba(0,0,0,0.05), 0 4px 2px rgba(0,0,0,0.05), 0 8px 4px rgba(0,0,0,0.05), 0 16px 8px rgba(0,0,0,0.05)',
        'water-light': 'inset 0 0 12px rgba(255,255,255,0.8), 0 10px 30px rgba(0,0,0,0.08)',
        'water-inner': 'inset 0 0 20px rgba(255,255,255,0.5)',
      },
      colors: {
        'brand': {
          primary: '#0F172A', 
          accent: '#0EA5E9', // Water Blue
          surface: '#E0F2FE', // Light Water Surface
          muted: '#64748B',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'reveal': 'reveal 0.8s cubic-bezier(0.77, 0, 0.175, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        reveal: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        }
      }
    },
  },
  plugins: [],
}
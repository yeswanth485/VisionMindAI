/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19', // Deep dark blue
        surface: 'rgba(26, 35, 58, 0.6)', // Glassmorphism dark
        surfaceHover: 'rgba(30, 41, 65, 0.8)',
        primary: '#3B82F6',
        primaryGlow: 'rgba(59, 130, 246, 0.5)',
        secondary: '#8B5CF6',
        accent: '#10B981',
        textMain: '#F8FAFC',
        textMuted: '#94A3B8'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

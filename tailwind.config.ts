import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blox': {
          teal: {
            light: '#4AC4E8',
            DEFAULT: '#36B0D9',
            dark: '#2A8CB0'
          },
          purple: {
            light: '#A78BFA',
            DEFAULT: '#9333EA',
            dark: '#7C3AED'
          },
          'black-blue': '#001C38',
          'very-dark-blue': '#001D39',
          'second-dark-blue': '#002246',
          white: '#FFFFFF',
          'off-white': '#DDDDDD',
          'light-blue-gray': '#9AB6E0',
          'medium-blue-gray': '#596D8C',
          success: {
            light: '#34D399',
            DEFAULT: '#10B981',  // BLOX Green
            dark: '#059669'
          },
          xp: {
            light: '#FCD34D',
            DEFAULT: '#FBBF24',  // Golden Yellow
            dark: '#D97706'
          },
          streak: {
            light: '#FB923C',
            DEFAULT: '#EF4444',  // Fire Red
            dark: '#DC2626'
          },
          glass: {
            teal: 'rgba(54, 176, 217, 0.1)',
            light: 'rgba(54, 176, 217, 0.05)',
            border: 'rgba(54, 176, 217, 0.2)'
          }
        }
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1782AC 0%, #053A56 100%)',
        'teal-gradient': 'linear-gradient(135deg, #36B0D9 0%, #1782AC 100%)',
        'dark-gradient': 'linear-gradient(135deg, #001D39 0%, #002246 100%)'
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'teal-glow': 'tealGlow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-left': 'floatLeft 3s ease-in-out infinite',
        'float-right': 'floatRight 3s ease-in-out infinite',
        'sparkle-1': 'sparkle1 2s ease-in-out infinite',
        'sparkle-2': 'sparkle2 2.5s ease-in-out infinite',
        'sparkle-3': 'sparkle3 3s ease-in-out infinite',
        'gradient-rotate': 'gradientRotate 3s linear infinite',
      },
      keyframes: {
        floatLeft: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-6px) rotate(-5deg)' },
        },
        floatRight: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-6px) rotate(5deg)' },
        },
        sparkle1: {
          '0%, 100%': { opacity: '0', transform: 'scale(0) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1) rotate(180deg)' },
        },
        sparkle2: {
          '0%, 100%': { opacity: '0', transform: 'scale(0) rotate(0deg)' },
          '50%': { opacity: '0.8', transform: 'scale(1) rotate(-180deg)' },
        },
        sparkle3: {
          '0%, 100%': { opacity: '0', transform: 'scale(0) rotate(0deg)' },
          '50%': { opacity: '0.6', transform: 'scale(1) rotate(360deg)' },
        },
        gradientRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      boxShadow: {
        'teal-glow': '0 0 20px rgba(54, 176, 217, 0.5)',
        'teal-glow-lg': '0 0 40px rgba(54, 176, 217, 0.6)',
        'card': '0 4px 20px rgba(0, 29, 57, 0.5)',
        'card-hover': '0 8px 30px rgba(54, 176, 217, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      }
    }
  },
  plugins: [],
}

export default config
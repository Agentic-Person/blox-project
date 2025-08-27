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
          'dark-blue': '#001E3A',
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
          },
          // Module color scheme - distinct colors
          'module-green': {
            light: '#6EE7B7',
            DEFAULT: '#10B981',  // Module 1 - Green
            dark: '#059669'
          },
          'module-blue': {
            light: '#60A5FA',
            DEFAULT: '#3B82F6',  // Module 2 - Blue
            dark: '#2563EB'
          },
          'module-violet': {
            light: '#C084FC',
            DEFAULT: '#A855F7',  // Module 3 - Violet
            dark: '#9333EA'
          },
          'module-red': {
            light: '#F87171',
            DEFAULT: '#EF4444',  // Module 4 - Red
            dark: '#DC2626'
          },
          'module-orange': {
            light: '#FB923C',
            DEFAULT: '#F97316',  // Module 5 - Orange
            dark: '#EA580C'
          },
          'module-yellow': {
            light: '#FDE68A',
            DEFAULT: '#FCD34D',  // Module 6 - Yellow
            dark: '#F59E0B'
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
  safelist: [
    // Module gradient backgrounds
    'from-blox-module-green/30', 'to-blox-module-green/10',
    'from-blox-module-blue/30', 'to-blox-module-blue/10',
    'from-blox-module-violet/30', 'to-blox-module-violet/10',
    'from-blox-module-red/30', 'to-blox-module-red/10',
    'from-blox-module-orange/30', 'to-blox-module-orange/10',
    'from-blox-module-yellow/30', 'to-blox-module-yellow/10',
    
    // Module backgrounds with all opacity variations
    'bg-blox-module-green/10', 'bg-blox-module-green/15', 'bg-blox-module-green/20', 'bg-blox-module-green/25', 'bg-blox-module-green/30', 'bg-blox-module-green/35', 'bg-blox-module-green/40',
    'bg-blox-module-blue/10', 'bg-blox-module-blue/15', 'bg-blox-module-blue/20', 'bg-blox-module-blue/25', 'bg-blox-module-blue/30', 'bg-blox-module-blue/35', 'bg-blox-module-blue/40',
    'bg-blox-module-violet/10', 'bg-blox-module-violet/15', 'bg-blox-module-violet/20', 'bg-blox-module-violet/25', 'bg-blox-module-violet/30', 'bg-blox-module-violet/35', 'bg-blox-module-violet/40',
    'bg-blox-module-red/10', 'bg-blox-module-red/15', 'bg-blox-module-red/20', 'bg-blox-module-red/25', 'bg-blox-module-red/30', 'bg-blox-module-red/35', 'bg-blox-module-red/40',
    'bg-blox-module-orange/10', 'bg-blox-module-orange/15', 'bg-blox-module-orange/20', 'bg-blox-module-orange/25', 'bg-blox-module-orange/30', 'bg-blox-module-orange/35', 'bg-blox-module-orange/40',
    'bg-blox-module-yellow/10', 'bg-blox-module-yellow/15', 'bg-blox-module-yellow/20', 'bg-blox-module-yellow/25', 'bg-blox-module-yellow/30', 'bg-blox-module-yellow/35', 'bg-blox-module-yellow/40',
    
    // Hover backgrounds
    'hover:bg-blox-module-green/10', 'hover:bg-blox-module-green/25', 'hover:bg-blox-module-green/30',
    'hover:bg-blox-module-blue/10', 'hover:bg-blox-module-blue/25', 'hover:bg-blox-module-blue/30',
    'hover:bg-blox-module-violet/10', 'hover:bg-blox-module-violet/25', 'hover:bg-blox-module-violet/30',
    'hover:bg-blox-module-red/10', 'hover:bg-blox-module-red/25', 'hover:bg-blox-module-red/30',
    'hover:bg-blox-module-orange/10', 'hover:bg-blox-module-orange/25', 'hover:bg-blox-module-orange/30',
    'hover:bg-blox-module-yellow/10', 'hover:bg-blox-module-yellow/25', 'hover:bg-blox-module-yellow/30',
    
    // Module borders with all variations
    'border-blox-module-green/30', 'border-blox-module-green/40', 'border-blox-module-green/50', 'border-blox-module-green/60', 'border-blox-module-green/70',
    'border-blox-module-blue/30', 'border-blox-module-blue/40', 'border-blox-module-blue/50', 'border-blox-module-blue/60', 'border-blox-module-blue/70',
    'border-blox-module-violet/30', 'border-blox-module-violet/40', 'border-blox-module-violet/50', 'border-blox-module-violet/60', 'border-blox-module-violet/70',
    'border-blox-module-red/30', 'border-blox-module-red/40', 'border-blox-module-red/50', 'border-blox-module-red/60', 'border-blox-module-red/70',
    'border-blox-module-orange/30', 'border-blox-module-orange/40', 'border-blox-module-orange/50', 'border-blox-module-orange/60', 'border-blox-module-orange/70',
    'border-blox-module-yellow/30', 'border-blox-module-yellow/40', 'border-blox-module-yellow/50', 'border-blox-module-yellow/60', 'border-blox-module-yellow/70',
    
    // Hover borders
    'hover:border-blox-module-green/50', 'hover:border-blox-module-green/60', 'hover:border-blox-module-green/70',
    'hover:border-blox-module-blue/50', 'hover:border-blox-module-blue/60', 'hover:border-blox-module-blue/70',
    'hover:border-blox-module-violet/50', 'hover:border-blox-module-violet/60', 'hover:border-blox-module-violet/70',
    'hover:border-blox-module-red/50', 'hover:border-blox-module-red/60', 'hover:border-blox-module-red/70',
    'hover:border-blox-module-orange/50', 'hover:border-blox-module-orange/60', 'hover:border-blox-module-orange/70',
    'hover:border-blox-module-yellow/50', 'hover:border-blox-module-yellow/60', 'hover:border-blox-module-yellow/70',
    
    // Text colors
    'text-blox-module-green', 'text-blox-module-blue', 'text-blox-module-violet', 'text-blox-module-red', 'text-blox-module-orange', 'text-blox-module-yellow',
    
    // Ring colors for selection states
    'ring-blox-module-green', 'ring-blox-module-blue', 'ring-blox-module-violet', 'ring-blox-module-red', 'ring-blox-module-orange', 'ring-blox-module-yellow',
    'ring-blox-module-green/50', 'ring-blox-module-blue/50', 'ring-blox-module-violet/50', 'ring-blox-module-red/50', 'ring-blox-module-orange/50', 'ring-blox-module-yellow/50',
    'ring-offset-blox-very-dark-blue', 'ring-offset-blox-module-green/20', 'ring-offset-blox-module-blue/20', 'ring-offset-blox-module-violet/20', 'ring-offset-blox-module-red/20', 'ring-offset-blox-module-orange/20', 'ring-offset-blox-module-yellow/20',
    
    // Shadow colors
    'shadow-blox-module-green/15', 'shadow-blox-module-green/20', 'shadow-blox-module-green/30',
    'shadow-blox-module-blue/15', 'shadow-blox-module-blue/20', 'shadow-blox-module-blue/30',
    'shadow-blox-module-violet/15', 'shadow-blox-module-violet/20', 'shadow-blox-module-violet/30',
    'shadow-blox-module-red/15', 'shadow-blox-module-red/20', 'shadow-blox-module-red/30',
    'shadow-blox-module-orange/15', 'shadow-blox-module-orange/20', 'shadow-blox-module-orange/30',
    'shadow-blox-module-yellow/15', 'shadow-blox-module-yellow/20', 'shadow-blox-module-yellow/30',
    
    // Progress bar colors
    'bg-blox-module-green', 'bg-blox-module-blue', 'bg-blox-module-violet', 'bg-blox-module-red', 'bg-blox-module-orange', 'bg-blox-module-yellow',
    
    // Border-2 classes
    'border-2',
    
    // Ring classes for focus states
    'ring-2', 'ring-4', 'ring-offset-2'
  ],
  plugins: [],
}

export default config
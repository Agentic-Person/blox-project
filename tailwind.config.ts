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
          'black-blue': '#001C38',
          'very-dark-blue': '#001D39',
          'second-dark-blue': '#002246',
          white: '#FFFFFF',
          'off-white': '#DDDDDD',
          'light-blue-gray': '#9AB6E0',
          'medium-blue-gray': '#596D8C',
          success: {
            light: '#34D399',
            DEFAULT: '#10B981',
            dark: '#059669'
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
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  },
  plugins: [],
}

export default config
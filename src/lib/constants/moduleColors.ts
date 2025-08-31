// Module color constants with explicit Tailwind classes
// These are used throughout the navigation to ensure consistent color coding

export const moduleColorScheme = {
  // Module gradient backgrounds - More vibrant for better visibility
  moduleGradients: [
    'from-blox-module-green/30 to-blox-module-green/10',     // Module 1 - Green
    'from-blox-module-blue/30 to-blox-module-blue/10',       // Module 2 - Blue
    'from-blox-module-violet/30 to-blox-module-violet/10',   // Module 3 - Violet
    'from-blox-module-red/30 to-blox-module-red/10',         // Module 4 - Red
    'from-blox-module-orange/30 to-blox-module-orange/10',   // Module 5 - Orange
    'from-blox-module-yellow/30 to-blox-module-yellow/10'    // Module 6 - Yellow
  ],

  // Module border colors with hover states - Thicker borders for clarity
  moduleBorders: [
    'border-2 border-blox-module-green/50 hover:border-blox-module-green/70 hover:shadow-lg hover:shadow-blox-module-green/30',
    'border-2 border-blox-module-blue/50 hover:border-blox-module-blue/70 hover:shadow-lg hover:shadow-blox-module-blue/30',
    'border-2 border-blox-module-violet/50 hover:border-blox-module-violet/70 hover:shadow-lg hover:shadow-blox-module-violet/30',
    'border-2 border-blox-module-red/50 hover:border-blox-module-red/70 hover:shadow-lg hover:shadow-blox-module-red/30',
    'border-2 border-blox-module-orange/50 hover:border-blox-module-orange/70 hover:shadow-lg hover:shadow-blox-module-orange/30',
    'border-2 border-blox-module-yellow/50 hover:border-blox-module-yellow/70 hover:shadow-lg hover:shadow-blox-module-yellow/30'
  ],

  // Module accent colors (text and solid backgrounds)
  moduleAccents: [
    'blox-module-green',   // Module 1
    'blox-module-blue',    // Module 2
    'blox-module-violet',  // Module 3
    'blox-module-red',     // Module 4
    'blox-module-orange',  // Module 5
    'blox-module-yellow'   // Module 6
  ],

  // Week card backgrounds - Increased opacity for visibility (30% base)
  weekBackgrounds: [
    'bg-blox-module-green/20',
    'bg-blox-module-blue/20',
    'bg-blox-module-violet/20',
    'bg-blox-module-red/20',
    'bg-blox-module-orange/20',
    'bg-blox-module-yellow/20'
  ],

  // Week card active backgrounds - Even more visible when active
  weekActiveBackgrounds: [
    'bg-blox-module-green/30',
    'bg-blox-module-blue/30',
    'bg-blox-module-violet/30',
    'bg-blox-module-red/30',
    'bg-blox-module-orange/30',
    'bg-blox-module-yellow/30'
  ],

  // Week card borders - Prominent colored borders
  weekBorders: [
    'border-2 border-blox-module-green/40 hover:border-blox-module-green/60',
    'border-2 border-blox-module-blue/40 hover:border-blox-module-blue/60',
    'border-2 border-blox-module-violet/40 hover:border-blox-module-violet/60',
    'border-2 border-blox-module-red/40 hover:border-blox-module-red/60',
    'border-2 border-blox-module-orange/40 hover:border-blox-module-orange/60',
    'border-2 border-blox-module-yellow/40 hover:border-blox-module-yellow/60'
  ],

  // Week card active borders - Strong borders when active
  weekActiveBorders: [
    'border-2 border-blox-module-green/70 shadow-lg shadow-blox-module-green/20',
    'border-2 border-blox-module-blue/70 shadow-lg shadow-blox-module-blue/20',
    'border-2 border-blox-module-violet/70 shadow-lg shadow-blox-module-violet/20',
    'border-2 border-blox-module-red/70 shadow-lg shadow-blox-module-red/20',
    'border-2 border-blox-module-orange/70 shadow-lg shadow-blox-module-orange/20',
    'border-2 border-blox-module-yellow/70 shadow-lg shadow-blox-module-yellow/20'
  ],

  // Day card backgrounds - Visible tinted backgrounds
  dayBackgrounds: [
    'bg-blox-module-green/15',
    'bg-blox-module-blue/15',
    'bg-blox-module-violet/15',
    'bg-blox-module-red/15',
    'bg-blox-module-orange/15',
    'bg-blox-module-yellow/15'
  ],

  // Day card hover backgrounds - Clear hover state
  dayHoverBackgrounds: [
    'hover:bg-blox-module-green/25',
    'hover:bg-blox-module-blue/25',
    'hover:bg-blox-module-violet/25',
    'hover:bg-blox-module-red/25',
    'hover:bg-blox-module-orange/25',
    'hover:bg-blox-module-yellow/25'
  ],

  // Day card active backgrounds - Strong active state
  dayActiveBackgrounds: [
    'bg-blox-module-green/35',
    'bg-blox-module-blue/35',
    'bg-blox-module-violet/35',
    'bg-blox-module-red/35',
    'bg-blox-module-orange/35',
    'bg-blox-module-yellow/35'
  ],

  // Day card borders - Colored borders for clarity
  dayBorders: [
    'border-2 border-blox-module-green/30 hover:border-blox-module-green/50',
    'border-2 border-blox-module-blue/30 hover:border-blox-module-blue/50',
    'border-2 border-blox-module-violet/30 hover:border-blox-module-violet/50',
    'border-2 border-blox-module-red/30 hover:border-blox-module-red/50',
    'border-2 border-blox-module-orange/30 hover:border-blox-module-orange/50',
    'border-2 border-blox-module-yellow/30 hover:border-blox-module-yellow/50'
  ],

  // Day card active borders - Prominent active borders
  dayActiveBorders: [
    'border-2 border-blox-module-green/60 shadow-md shadow-blox-module-green/15',
    'border-2 border-blox-module-blue/60 shadow-md shadow-blox-module-blue/15',
    'border-2 border-blox-module-violet/60 shadow-md shadow-blox-module-violet/15',
    'border-2 border-blox-module-red/60 shadow-md shadow-blox-module-red/15',
    'border-2 border-blox-module-orange/60 shadow-md shadow-blox-module-orange/15',
    'border-2 border-blox-module-yellow/60 shadow-md shadow-blox-module-yellow/15'
  ],

  // Text colors for labels
  textColors: [
    'text-blox-module-green',
    'text-blox-module-blue',
    'text-blox-module-violet',
    'text-blox-module-red',
    'text-blox-module-orange',
    'text-blox-module-yellow'
  ],

  // Badge backgrounds
  badgeBackgrounds: [
    'bg-blox-module-green/20',
    'bg-blox-module-blue/20',
    'bg-blox-module-violet/20',
    'bg-blox-module-red/20',
    'bg-blox-module-orange/20',
    'bg-blox-module-yellow/20'
  ],

  // Progress bar colors
  progressBarColors: [
    'bg-blox-module-green',
    'bg-blox-module-blue',
    'bg-blox-module-violet',
    'bg-blox-module-red',
    'bg-blox-module-orange',
    'bg-blox-module-yellow'
  ],

  // Ring colors for active states
  ringColors: [
    'ring-blox-module-green',
    'ring-blox-module-blue',
    'ring-blox-module-violet',
    'ring-blox-module-red',
    'ring-blox-module-orange',
    'ring-blox-module-yellow'
  ],
  
  // Selection ring classes for focused/selected states
  selectionRings: [
    'ring-2 ring-blox-module-green ring-offset-2 ring-offset-blox-very-dark-blue',
    'ring-2 ring-blox-module-blue ring-offset-2 ring-offset-blox-very-dark-blue',
    'ring-2 ring-blox-module-violet ring-offset-2 ring-offset-blox-very-dark-blue',
    'ring-2 ring-blox-module-red ring-offset-2 ring-offset-blox-very-dark-blue',
    'ring-2 ring-blox-module-orange ring-offset-2 ring-offset-blox-very-dark-blue',
    'ring-2 ring-blox-module-yellow ring-offset-2 ring-offset-blox-very-dark-blue'
  ],
  
  // Strong selection rings for important elements
  strongSelectionRings: [
    'ring-4 ring-blox-module-green ring-offset-2 ring-offset-blox-very-dark-blue',
    'ring-4 ring-blox-module-blue ring-offset-2 ring-offset-blox-very-dark-blue',
    'ring-4 ring-blox-module-violet ring-offset-2 ring-offset-blox-very-dark-blue',
    'ring-4 ring-blox-module-red ring-offset-2 ring-offset-blox-very-dark-blue',
    'ring-4 ring-blox-module-orange ring-offset-2 ring-offset-blox-very-dark-blue',
    'ring-4 ring-blox-module-yellow ring-offset-2 ring-offset-blox-very-dark-blue'
  ],

  // Module card backgrounds - For the main viewport cards
  moduleBackgrounds: [
    'bg-gradient-to-br from-blox-module-green/15 via-blox-second-dark-blue/80 to-blox-very-dark-blue',
    'bg-gradient-to-br from-blox-module-blue/15 via-blox-second-dark-blue/80 to-blox-very-dark-blue',
    'bg-gradient-to-br from-blox-module-violet/15 via-blox-second-dark-blue/80 to-blox-very-dark-blue',
    'bg-gradient-to-br from-blox-module-red/15 via-blox-second-dark-blue/80 to-blox-very-dark-blue',
    'bg-gradient-to-br from-blox-module-orange/15 via-blox-second-dark-blue/80 to-blox-very-dark-blue',
    'bg-gradient-to-br from-blox-module-yellow/15 via-blox-second-dark-blue/80 to-blox-very-dark-blue'
  ],

  // Module card hover backgrounds - Enhanced on hover
  moduleHoverBackgrounds: [
    'hover:from-blox-module-green/25 hover:via-blox-second-dark-blue/90',
    'hover:from-blox-module-blue/25 hover:via-blox-second-dark-blue/90',
    'hover:from-blox-module-violet/25 hover:via-blox-second-dark-blue/90',
    'hover:from-blox-module-red/25 hover:via-blox-second-dark-blue/90',
    'hover:from-blox-module-orange/25 hover:via-blox-second-dark-blue/90',
    'hover:from-blox-module-yellow/25 hover:via-blox-second-dark-blue/90'
  ],

  // Module card hover borders - Enhanced borders on hover
  moduleHoverBorders: [
    'hover:border-blox-module-green/80',
    'hover:border-blox-module-blue/80',
    'hover:border-blox-module-violet/80',
    'hover:border-blox-module-red/80',
    'hover:border-blox-module-orange/80',
    'hover:border-blox-module-yellow/80'
  ],

  // Button backgrounds - For action buttons
  buttonBackgrounds: [
    'bg-blox-module-green',
    'bg-blox-module-blue',
    'bg-blox-module-violet',
    'bg-blox-module-red',
    'bg-blox-module-orange',
    'bg-blox-module-yellow'
  ],

  // Button hover backgrounds - Darker on hover
  buttonHoverBackgrounds: [
    'hover:bg-blox-module-green/80',
    'hover:bg-blox-module-blue/80',
    'hover:bg-blox-module-violet/80',
    'hover:bg-blox-module-red/80',
    'hover:bg-blox-module-orange/80',
    'hover:bg-blox-module-yellow/80'
  ]
}
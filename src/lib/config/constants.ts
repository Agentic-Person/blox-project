export const APP_CONFIG = {
  name: 'BLOX BUDDY',
  description: 'Free learning and community platform for young Roblox developers',
  version: '0.1.0',
  url: 'http://localhost:3000',
  author: 'Blox Buddy Team',
}

export const CURRICULUM_CONFIG = {
  totalModules: 6,
  totalDays: 120,
  avgVideosPerDay: 2,
  maxProgressPercentage: 100,
}

export const TEAM_CONFIG = {
  maxTeamSize: 6,
  minTeamSize: 2,
  skillCategories: [
    'Building', 'Scripting', 'UI Design', 'Game Design', 
    'Animation', 'Modeling', 'Leadership', 'Art'
  ],
}

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  LEARNING: '/learning',
  TEAMS: '/teams',
  PROGRESS: '/progress',
  DISCORD: '/discord',
  NOTES: '/notes',
  BLOX_WIZARD: '/blox-wizard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  HELP: '/help',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  ONBOARDING: '/onboarding',
}
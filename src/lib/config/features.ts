// Feature flags for progressive enhancement
export const FEATURES = {
  // Core Features (Always On in Dev)
  USE_MOCK_AUTH: true,
  USE_MOCK_DATA: true,
  SHOW_DEV_CONTROLS: true,
  
  // Features to Enable Progressively
  USE_REAL_AUTH: false,
  USE_REAL_DB: false,
  USE_DISCORD_INTEGRATION: false,
  USE_TEAM_FEATURES: true,
  USE_NOTES_FEATURE: true,
  USE_AI_ASSISTANT: false,
  USE_STRIPE_PAYMENTS: false,
  USE_SOLANA_WALLET: false,
  
  // UI Features
  ENABLE_ANIMATIONS: true,
  ENABLE_KEYBOARD_SHORTCUTS: true,
  ENABLE_MOBILE_GESTURES: false,
  
  // Content Features
  ENABLE_VIDEO_COMMENTS: false,
  ENABLE_ACHIEVEMENTS: true,
  ENABLE_LEADERBOARD: false,
}
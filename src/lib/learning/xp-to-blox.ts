// XP to BLOX Token Conversion Utilities

/**
 * Conversion rate: 100 XP = 1 BLOX token
 */
const XP_TO_BLOX_RATE = 100

/**
 * Convert XP points to BLOX tokens
 */
export function xpToBLOX(xp: number): number {
  return Math.floor(xp / XP_TO_BLOX_RATE)
}

/**
 * Format BLOX amount for display
 */
export function formatBLOXAmount(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M BLOX`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K BLOX`
  }
  return `${amount} BLOX`
}

/**
 * Calculate bonus BLOX based on streak
 */
export function calculateStreakBonus(baseBlox: number, streakDays: number): number {
  // 5% bonus per week of streak, max 50%
  const weekBonus = Math.min(Math.floor(streakDays / 7) * 0.05, 0.5)
  return Math.floor(baseBlox * (1 + weekBonus))
}

/**
 * Calculate BLOX rewards for completing a module
 */
export function calculateModuleCompletionBonus(
  moduleXP: number,
  completionTime: number,
  estimatedTime: number
): number {
  const baseBlox = xpToBLOX(moduleXP)
  
  // Speed bonus: 20% if completed 25% faster than estimated
  const speedBonus = completionTime < estimatedTime * 0.75 ? 0.2 : 0
  
  return Math.floor(baseBlox * (1 + speedBonus))
}

/**
 * Get BLOX tier based on total earned
 */
export function getBLOXTier(totalBlox: number): {
  tier: string
  color: string
  nextTier: number | null
  progress: number
} {
  const tiers = [
    { name: 'Bronze', min: 0, max: 100, color: 'text-orange-600' },
    { name: 'Silver', min: 100, max: 500, color: 'text-gray-400' },
    { name: 'Gold', min: 500, max: 2000, color: 'text-yellow-500' },
    { name: 'Platinum', min: 2000, max: 10000, color: 'text-cyan-400' },
    { name: 'Diamond', min: 10000, max: 50000, color: 'text-blue-400' },
    { name: 'Master', min: 50000, max: null, color: 'text-purple-500' }
  ]
  
  const currentTier = tiers.find(tier => 
    totalBlox >= tier.min && (tier.max === null || totalBlox < tier.max)
  ) || tiers[0]
  
  const tierIndex = tiers.indexOf(currentTier)
  const nextTier = tierIndex < tiers.length - 1 ? tiers[tierIndex + 1] : null
  
  const progress = currentTier.max 
    ? ((totalBlox - currentTier.min) / (currentTier.max - currentTier.min)) * 100
    : 100
  
  return {
    tier: currentTier.name,
    color: currentTier.color,
    nextTier: nextTier?.min || null,
    progress
  }
}

/**
 * Calculate daily BLOX reward based on activities
 */
export function calculateDailyReward(
  videosWatched: number,
  practiceCompleted: boolean,
  quizScore: number = 0
): number {
  let blox = 0
  
  // 10 BLOX per video watched
  blox += videosWatched * 10
  
  // 25 BLOX for completing practice
  if (practiceCompleted) {
    blox += 25
  }
  
  // Quiz bonus: 1 BLOX per % score
  blox += Math.floor(quizScore)
  
  return blox
}

/**
 * Format time until next BLOX bonus
 */
export function getNextBonusTime(): string {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  const diff = tomorrow.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${hours}h ${minutes}m`
}
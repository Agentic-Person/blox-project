import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { connection } from './wallet'
import { REWARDS } from './tokens'

// BLOX Token Program Configuration
export const BLOX_TOKEN_CONFIG = {
  // Token details
  name: 'BLOX Token',
  symbol: 'BLOX',
  decimals: 9,
  
  // Conversion rates
  xpToBloxRate: 100, // 100 XP = 1 BLOX
  
  // Bonus multipliers
  streakMultiplier: 0.05, // 5% per week
  speedMultiplier: 0.2, // 20% for fast completion
  qualityMultiplier: 0.3, // 30% for high quality
  
  // Daily limits
  maxDailyEarning: 1000, // 1000 BLOX per day max
  maxDailyClaim: 500, // 500 BLOX claim limit
  
  // Minimum amounts
  minClaimAmount: 10, // Minimum 10 BLOX to claim
  minTransferAmount: 1, // Minimum 1 BLOX to transfer
}

// Activity rewards in BLOX
export const ACTIVITY_REWARDS = {
  // Video watching
  VIDEO_SHORT: 1, // < 5 min
  VIDEO_MEDIUM: 2, // 5-15 min
  VIDEO_LONG: 5, // > 15 min
  
  // Module completion
  DAY_COMPLETE: 10,
  WEEK_COMPLETE: 50,
  MODULE_COMPLETE: 300,
  
  // Community activities
  HELP_PEER: 15,
  ANSWER_QUESTION: 10,
  SHARE_PROJECT: 25,
  
  // Challenges
  DAILY_CHALLENGE: 20,
  WEEKLY_CHALLENGE: 100,
  SPECIAL_EVENT: 200,
  
  // Streaks
  DAILY_LOGIN: 5,
  WEEK_STREAK: 50,
  MONTH_STREAK: 250,
}

// Calculate BLOX rewards for an activity
export function calculateActivityReward(
  activity: keyof typeof ACTIVITY_REWARDS,
  multipliers?: {
    streak?: number
    speed?: number
    quality?: number
  }
): number {
  const baseReward = ACTIVITY_REWARDS[activity] || 0
  
  if (!multipliers) {
    return baseReward
  }
  
  let totalMultiplier = 1
  
  // Apply streak multiplier (5% per week, max 50%)
  if (multipliers.streak) {
    const streakBonus = Math.min(
      Math.floor(multipliers.streak / 7) * BLOX_TOKEN_CONFIG.streakMultiplier,
      0.5
    )
    totalMultiplier += streakBonus
  }
  
  // Apply speed multiplier (20% for fast completion)
  if (multipliers.speed) {
    totalMultiplier += BLOX_TOKEN_CONFIG.speedMultiplier
  }
  
  // Apply quality multiplier (up to 30% for high quality)
  if (multipliers.quality) {
    totalMultiplier += multipliers.quality * BLOX_TOKEN_CONFIG.qualityMultiplier
  }
  
  return Math.floor(baseReward * totalMultiplier)
}

// Check if user can claim rewards
export function canClaimRewards(
  pendingAmount: number,
  lastClaimTime: Date | null
): { canClaim: boolean; reason?: string } {
  // Check minimum amount
  if (pendingAmount < BLOX_TOKEN_CONFIG.minClaimAmount) {
    return {
      canClaim: false,
      reason: `Minimum claim amount is ${BLOX_TOKEN_CONFIG.minClaimAmount} BLOX`
    }
  }
  
  // Check daily limit
  if (lastClaimTime) {
    const today = new Date()
    const lastClaim = new Date(lastClaimTime)
    
    if (
      today.getDate() === lastClaim.getDate() &&
      today.getMonth() === lastClaim.getMonth() &&
      today.getFullYear() === lastClaim.getFullYear()
    ) {
      // Already claimed today - check if under daily limit
      // This would need to track daily claimed amount
      // For now, allow multiple claims per day
    }
  }
  
  return { canClaim: true }
}

// Estimate daily earning potential
export function estimateDailyEarnings(
  videosPerDay: number = 3,
  completePractice: boolean = true,
  currentStreak: number = 0
): number {
  let dailyTotal = 0
  
  // Videos (assume medium length)
  dailyTotal += videosPerDay * ACTIVITY_REWARDS.VIDEO_MEDIUM
  
  // Daily practice
  if (completePractice) {
    dailyTotal += ACTIVITY_REWARDS.DAY_COMPLETE
  }
  
  // Daily login bonus
  dailyTotal += ACTIVITY_REWARDS.DAILY_LOGIN
  
  // Apply streak multiplier
  const streakMultiplier = 1 + Math.min(
    Math.floor(currentStreak / 7) * BLOX_TOKEN_CONFIG.streakMultiplier,
    0.5
  )
  
  return Math.min(
    Math.floor(dailyTotal * streakMultiplier),
    BLOX_TOKEN_CONFIG.maxDailyEarning
  )
}

// Format transaction memo for on-chain tracking
export function createTransactionMemo(
  type: 'earn' | 'claim' | 'transfer' | 'spend',
  amount: number,
  description: string
): string {
  return JSON.stringify({
    app: 'BloxBuddy',
    type,
    amount,
    description,
    timestamp: Date.now()
  })
}

// Mock function to simulate claiming rewards
// In production, this would create an actual Solana transaction
export async function claimRewardsTransaction(
  userWallet: PublicKey,
  amount: number
): Promise<{ success: boolean; txId?: string; error?: string }> {
  try {
    // In development mode, just simulate
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return {
        success: true,
        txId: `mock_claim_${Date.now()}`
      }
    }
    
    // Production: Create actual transaction
    // This would involve:
    // 1. Creating a token transfer instruction
    // 2. Getting recent blockhash
    // 3. Creating and signing transaction
    // 4. Sending to network
    
    return {
      success: false,
      error: 'Production claiming not yet implemented'
    }
  } catch (error) {
    console.error('Error claiming rewards:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get leaderboard data
export interface LeaderboardEntry {
  rank: number
  username: string
  walletAddress: string
  totalEarned: number
  weeklyEarned: number
  tier: string
}

export async function getLeaderboard(
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time',
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  // Mock data for development
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    return [
      {
        rank: 1,
        username: 'CryptoBuilder',
        walletAddress: 'Crypto...1234',
        totalEarned: 15420,
        weeklyEarned: 850,
        tier: 'Diamond'
      },
      {
        rank: 2,
        username: 'RobloxMaster',
        walletAddress: 'Roblox...5678',
        totalEarned: 12350,
        weeklyEarned: 720,
        tier: 'Diamond'
      },
      {
        rank: 3,
        username: 'BuilderPro',
        walletAddress: 'Builder...9012',
        totalEarned: 9870,
        weeklyEarned: 650,
        tier: 'Platinum'
      },
      // Add more mock entries as needed
    ].slice(0, limit)
  }
  
  // Production: Fetch from API or blockchain
  return []
}

// Track token metrics
export interface TokenMetrics {
  totalSupply: number
  circulatingSupply: number
  totalHolders: number
  totalTransactions: number
  averageHolding: number
  topHolders: Array<{
    address: string
    balance: number
    percentage: number
  }>
}

export async function getTokenMetrics(): Promise<TokenMetrics> {
  // Mock data for development
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    return {
      totalSupply: 1000000000, // 1 billion
      circulatingSupply: 5000000, // 5 million
      totalHolders: 1250,
      totalTransactions: 45000,
      averageHolding: 4000,
      topHolders: [
        { address: 'Treasury...', balance: 2000000, percentage: 40 },
        { address: 'Rewards...', balance: 1500000, percentage: 30 },
        { address: 'Team...', balance: 500000, percentage: 10 },
      ]
    }
  }
  
  // Production: Fetch from blockchain
  return {
    totalSupply: 0,
    circulatingSupply: 0,
    totalHolders: 0,
    totalTransactions: 0,
    averageHolding: 0,
    topHolders: []
  }
}
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { connection } from './wallet'

// BLOX Token configuration (mock for development)
export const BLOX_TOKEN_MINT = new PublicKey('11111111111111111111111111111111') // Placeholder
export const BLOX_TOKEN_DECIMALS = 9
export const BLOX_TOKEN_SYMBOL = 'BLOX'

// Token conversion rates
export const BLOX_TO_SOL_RATE = 0.001 // 1 BLOX = 0.001 SOL
export const SOL_TO_BLOX_RATE = 1000 // 1 SOL = 1000 BLOX

// Token operations
export async function getTokenBalance(walletAddress: string): Promise<number> {
  try {
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      // Return mock balance in development
      return 1000
    }

    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    return balance / LAMPORTS_PER_SOL * SOL_TO_BLOX_RATE
  } catch (error) {
    console.error('Error fetching token balance:', error)
    return 0
  }
}

export async function transferTokens(
  fromWallet: PublicKey,
  toWallet: PublicKey,
  amount: number
): Promise<string> {
  try {
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      // Return mock transaction ID in development
      return `mock_tx_${Date.now()}`
    }

    // Convert BLOX to lamports
    const lamports = Math.floor(amount * BLOX_TO_SOL_RATE * LAMPORTS_PER_SOL)

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromWallet,
        toPubkey: toWallet,
        lamports,
      })
    )

    // This would normally be signed and sent
    // For now, return a placeholder
    return 'transaction_placeholder'
  } catch (error) {
    console.error('Error transferring tokens:', error)
    throw error
  }
}

// Reward calculations
export const REWARDS = {
  MODULE_COMPLETION: 75,
  DAILY_LOGIN: 10,
  WEEKLY_STREAK: 50,
  HELP_TEAMMATE: 15,
  PROJECT_COMPLETION: 150,
  CODE_CHALLENGE: 50,
}

export function calculateReward(action: keyof typeof REWARDS): number {
  return REWARDS[action] || 0
}
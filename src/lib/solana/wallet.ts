import { PublicKey, Connection } from '@solana/web3.js'

// Wallet configuration for Solana integration
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

// Initialize Solana connection
export const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

// Wallet adapter configuration
export const walletConfig = {
  network: SOLANA_NETWORK,
  autoConnect: false,
  commitment: 'confirmed' as const,
}

// Helper functions for wallet operations
export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

export const getExplorerUrl = (address: string, type: 'account' | 'tx' = 'account'): string => {
  const baseUrl = SOLANA_NETWORK === 'mainnet-beta' 
    ? 'https://explorer.solana.com'
    : `https://explorer.solana.com?cluster=${SOLANA_NETWORK}`
  
  return `${baseUrl}/${type}/${address}`
}
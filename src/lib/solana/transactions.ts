import { PublicKey, Transaction, TransactionSignature } from '@solana/web3.js'
import { connection } from './wallet'

export interface TransactionRecord {
  signature: string
  timestamp: number
  from: string
  to: string
  amount: number
  status: 'success' | 'pending' | 'failed'
  type: 'transfer' | 'reward' | 'purchase'
}

// Get transaction history for a wallet
export async function getTransactionHistory(
  walletAddress: string,
  limit = 10
): Promise<TransactionRecord[]> {
  try {
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      // Return mock transactions in development
      return getMockTransactions()
    }

    const publicKey = new PublicKey(walletAddress)
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit })
    
    const transactions: TransactionRecord[] = []
    
    for (const sig of signatures) {
      transactions.push({
        signature: sig.signature,
        timestamp: sig.blockTime || Date.now() / 1000,
        from: walletAddress,
        to: 'unknown',
        amount: 0,
        status: sig.err ? 'failed' : 'success',
        type: 'transfer',
      })
    }
    
    return transactions
  } catch (error) {
    console.error('Error fetching transaction history:', error)
    return []
  }
}

// Check transaction status
export async function getTransactionStatus(
  signature: string
): Promise<'success' | 'pending' | 'failed'> {
  try {
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      return 'success'
    }

    const status = await connection.getSignatureStatus(signature)
    
    if (!status || !status.value) {
      return 'pending'
    }
    
    if (status.value.err) {
      return 'failed'
    }
    
    return status.value.confirmationStatus === 'finalized' ? 'success' : 'pending'
  } catch (error) {
    console.error('Error checking transaction status:', error)
    return 'failed'
  }
}

// Mock transactions for development
function getMockTransactions(): TransactionRecord[] {
  return [
    {
      signature: 'mock_sig_1',
      timestamp: Date.now() / 1000 - 3600,
      from: 'DevWa11et1111111111111111111111111111111111',
      to: 'TeamWa11et222222222222222222222222222222222',
      amount: 50,
      status: 'success',
      type: 'reward',
    },
    {
      signature: 'mock_sig_2',
      timestamp: Date.now() / 1000 - 7200,
      from: 'DevWa11et1111111111111111111111111111111111',
      to: 'StoreWa11et33333333333333333333333333333333',
      amount: 100,
      status: 'success',
      type: 'purchase',
    },
    {
      signature: 'mock_sig_3',
      timestamp: Date.now() / 1000 - 10800,
      from: 'RewardWa11et4444444444444444444444444444444',
      to: 'DevWa11et1111111111111111111111111111111111',
      amount: 25,
      status: 'success',
      type: 'reward',
    },
  ]
}
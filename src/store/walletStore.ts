import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PublicKey } from '@solana/web3.js'
import { getTokenBalance } from '@/lib/solana/tokens'

interface Transaction {
  id: string
  type: 'earned' | 'spent' | 'claimed' | 'transferred'
  amount: number
  description: string
  timestamp: Date
  status: 'pending' | 'confirmed' | 'failed'
}

interface WalletState {
  // Wallet connection
  isConnected: boolean
  publicKey: string | null
  walletName: string | null
  walletType: 'custodial' | 'external' | null
  isLoading: boolean
  
  // Token balances
  bloxBalance: number
  solBalance: number
  pendingRewards: number
  
  // Transaction history
  transactions: Transaction[]
  
  // Claiming
  lastClaimTime: Date | null
  claimableAmount: number
  
  // Custodial wallet specific
  custodialWalletId: string | null
  migrationStatus: 'none' | 'pending' | 'completed'
  
  // Actions
  setWalletConnection: (publicKey: string | null, walletName: string | null, walletType?: 'custodial' | 'external') => void
  updateBalances: () => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void
  claimRewards: () => Promise<boolean>
  getRecentTransactions: (limit?: number) => Transaction[]
  getTotalEarned: () => number
  getTotalSpent: () => number
  clearWalletData: () => void
  initializeCustodialWallet: () => Promise<void>
  migrateToExternalWallet: (externalPublicKey: string) => Promise<boolean>
  disconnect: () => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      publicKey: null,
      walletName: null,
      walletType: null,
      isLoading: false,
      bloxBalance: 0,
      solBalance: 0,
      pendingRewards: 0,
      transactions: [],
      lastClaimTime: null,
      claimableAmount: 0,
      custodialWalletId: null,
      migrationStatus: 'none',
      
      // Set wallet connection
      setWalletConnection: (publicKey: string | null, walletName: string | null, walletType: 'custodial' | 'external' = 'external') => {
        set({
          isConnected: !!publicKey,
          publicKey,
          walletName,
          walletType: publicKey ? walletType : null
        })
        
        // Update balances when wallet connects
        if (publicKey) {
          get().updateBalances()
        }
      },
      
      // Update token balances
      updateBalances: async () => {
        const { publicKey } = get()
        if (!publicKey) return
        
        try {
          const balance = await getTokenBalance(publicKey)
          set({ bloxBalance: balance })
          
          // Also update SOL balance if needed
          // const connection = new Connection(...)
          // const solBalance = await connection.getBalance(new PublicKey(publicKey))
          // set({ solBalance: solBalance / LAMPORTS_PER_SOL })
        } catch (error) {
          console.error('Error updating balances:', error)
        }
      },
      
      // Add a transaction to history
      addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        }
        
        set((state) => ({
          transactions: [newTransaction, ...state.transactions].slice(0, 100) // Keep last 100
        }))
        
        // Update balance based on transaction type
        if (transaction.status === 'confirmed') {
          set((state) => ({
            bloxBalance: transaction.type === 'earned' || transaction.type === 'claimed'
              ? state.bloxBalance + transaction.amount
              : state.bloxBalance - transaction.amount
          }))
        }
      },
      
      // Claim pending rewards
      claimRewards: async () => {
        const { claimableAmount, publicKey } = get()
        
        if (!publicKey || claimableAmount <= 0) {
          return false
        }
        
        try {
          // Add pending transaction
          get().addTransaction({
            type: 'claimed',
            amount: claimableAmount,
            description: 'Claimed pending rewards',
            status: 'pending'
          })
          
          // Simulate claiming (replace with actual blockchain transaction)
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Update transaction status
          set((state) => {
            const transactions = [...state.transactions]
            const pendingTx = transactions.find(tx => tx.status === 'pending')
            if (pendingTx) {
              pendingTx.status = 'confirmed'
            }
            
            return {
              transactions,
              claimableAmount: 0,
              lastClaimTime: new Date(),
              pendingRewards: 0
            }
          })
          
          // Update balances
          await get().updateBalances()
          
          return true
        } catch (error) {
          console.error('Error claiming rewards:', error)
          
          // Update transaction status to failed
          set((state) => {
            const transactions = [...state.transactions]
            const pendingTx = transactions.find(tx => tx.status === 'pending')
            if (pendingTx) {
              pendingTx.status = 'failed'
            }
            return { transactions }
          })
          
          return false
        }
      },
      
      // Get recent transactions
      getRecentTransactions: (limit: number = 5) => {
        return get().transactions.slice(0, limit)
      },
      
      // Calculate total earned
      getTotalEarned: () => {
        const { transactions } = get()
        return transactions
          .filter(tx => (tx.type === 'earned' || tx.type === 'claimed') && tx.status === 'confirmed')
          .reduce((total, tx) => total + tx.amount, 0)
      },
      
      // Calculate total spent
      getTotalSpent: () => {
        const { transactions } = get()
        return transactions
          .filter(tx => tx.type === 'spent' && tx.status === 'confirmed')
          .reduce((total, tx) => total + tx.amount, 0)
      },
      
      // Initialize custodial wallet for new users
      initializeCustodialWallet: async () => {
        set({ isLoading: true })
        
        try {
          // This would call Supabase edge function to create wallet
          // For now, simulating with mock data
          const mockPublicKey = 'CustodialWallet' + Math.random().toString(36).substr(2, 9)
          
          set({
            isConnected: true,
            publicKey: mockPublicKey,
            walletName: 'Blox Buddy Managed Wallet',
            walletType: 'custodial',
            custodialWalletId: 'cust_' + Date.now(),
            isLoading: false
          })
          
          // Add welcome bonus
          get().addTransaction({
            type: 'earned',
            amount: 10,
            description: 'Welcome bonus!',
            status: 'confirmed'
          })
          
        } catch (error) {
          console.error('Error initializing custodial wallet:', error)
          set({ isLoading: false })
        }
      },
      
      // Migrate from custodial to external wallet
      migrateToExternalWallet: async (externalPublicKey: string) => {
        const { custodialWalletId, bloxBalance } = get()
        
        if (!custodialWalletId || bloxBalance <= 0) {
          return false
        }
        
        set({ migrationStatus: 'pending' })
        
        try {
          // Simulate migration process
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          // Update wallet info
          set({
            publicKey: externalPublicKey,
            walletType: 'external',
            migrationStatus: 'completed',
            custodialWalletId: null
          })
          
          // Add migration transaction
          get().addTransaction({
            type: 'transferred',
            amount: bloxBalance,
            description: 'Migrated to external wallet',
            status: 'confirmed'
          })
          
          return true
        } catch (error) {
          console.error('Error migrating wallet:', error)
          set({ migrationStatus: 'none' })
          return false
        }
      },
      
      // Disconnect wallet
      disconnect: () => {
        get().clearWalletData()
      },
      
      // Clear all wallet data
      clearWalletData: () => {
        set({
          isConnected: false,
          publicKey: null,
          walletName: null,
          walletType: null,
          isLoading: false,
          bloxBalance: 0,
          solBalance: 0,
          pendingRewards: 0,
          transactions: [],
          lastClaimTime: null,
          claimableAmount: 0,
          custodialWalletId: null,
          migrationStatus: 'none'
        })
      }
    }),
    {
      name: 'wallet-store',
      partialize: (state) => ({
        transactions: state.transactions,
        lastClaimTime: state.lastClaimTime
      })
    }
  )
)
'use client'

import { createContext, useContext, useState, ReactNode, useMemo } from 'react'

interface MockWallet {
  publicKey: string | null
  connected: boolean
  connecting: boolean
  disconnect: () => Promise<void>
}

interface WalletContextType {
  wallets: any[]
  wallet: MockWallet | null
  publicKey: string | null
  connected: boolean
  connecting: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  sendTransaction: (transaction: any) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

// Mock wallet address for development
const MOCK_WALLET_ADDRESS = 'DevWa11et1111111111111111111111111111111111'

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const wallet: MockWallet = useMemo(() => ({
    publicKey: connected ? MOCK_WALLET_ADDRESS : null,
    connected,
    connecting,
    disconnect: async () => {
      setConnected(false)
      console.log('[Mock Wallet] Disconnected')
    }
  }), [connected, connecting])

  const connect = async () => {
    setConnecting(true)
    
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      setConnected(true)
      console.log('[Mock Wallet] Connected:', MOCK_WALLET_ADDRESS)
    } else {
      console.warn('Real wallet connection not yet implemented')
    }
    
    setConnecting(false)
  }

  const disconnect = async () => {
    await wallet.disconnect()
  }

  const sendTransaction = async (transaction: any) => {
    console.log('[Mock Wallet] Sending transaction:', transaction)
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const mockTxId = `mock_tx_${Date.now()}`
    console.log('[Mock Wallet] Transaction sent:', mockTxId)
    
    return mockTxId
  }

  const value: WalletContextType = {
    wallets: [],
    wallet,
    publicKey: wallet.publicKey,
    connected,
    connecting,
    connect,
    disconnect,
    sendTransaction
  }

  return (
    <WalletContext.Provider value={value}>
      {process.env.NEXT_PUBLIC_DEV_MODE === 'true' && connected && (
        <div className="fixed bottom-4 left-32 bg-purple-500/20 text-purple-500 text-xs px-2 py-1 rounded z-50">
          Mock Wallet Connected
        </div>
      )}
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

// Mock connection provider for Solana
export function ConnectionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// Mock for @solana/wallet-adapter-react
export function useConnection() {
  return {
    connection: {
      rpcEndpoint: 'https://api.devnet.solana.com',
      getBalance: async (publicKey: any) => {
        console.log('[Mock Connection] Getting balance for:', publicKey)
        return 1000000000 // 1 SOL in lamports
      }
    }
  }
}

// Mock for @solana/web3.js
export const MockPublicKey = {
  toString: () => MOCK_WALLET_ADDRESS
}
'use client'

import { useState, useEffect } from 'react'
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { useWallet } from '@/lib/providers/wallet-provider'
import { useWalletStore } from '@/store/walletStore'
import { shortenAddress, getExplorerUrl } from '@/lib/solana/wallet'
import { getTokenBalance } from '@/lib/solana/tokens'
import { formatBLOXAmount } from '@/lib/learning/xp-to-blox'
import { WalletModal } from './WalletModal'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export function WalletButton() {
  const { connected, connecting, publicKey, connect, disconnect } = useWallet()
  const walletStore = useWalletStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  // Fetch balance when connected
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
    }
  }, [connected, publicKey])

  const fetchBalance = async () => {
    if (!publicKey) return
    setLoading(true)
    try {
      const tokenBalance = await getTokenBalance(publicKey)
      setBalance(tokenBalance)
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    setShowModal(true)
  }

  const handleDisconnect = async () => {
    await disconnect()
    setShowDropdown(false)
    toast.success('Wallet disconnected')
  }

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey)
      toast.success('Address copied to clipboard')
    }
  }

  const openExplorer = () => {
    if (publicKey) {
      window.open(getExplorerUrl(publicKey), '_blank')
    }
  }

  // Connected state
  if (connected && publicKey) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-2 bg-blox-glass-bg border border-blox-teal/30 rounded-lg hover:border-blox-teal/50 transition-all duration-200 group"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blox-success rounded-full animate-pulse" />
            <div className="text-right">
              <div className="text-xs text-blox-medium-blue-gray">BLOX Balance</div>
              <div className="text-sm font-semibold text-blox-teal">
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  formatBLOXAmount(balance)
                )}
              </div>
            </div>
          </div>
          <div className="border-l border-blox-glass-border pl-2">
            <div className="text-sm text-blox-white font-medium">
              {shortenAddress(publicKey)}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-blox-medium-blue-gray group-hover:text-blox-teal transition-colors" />
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-64 bg-blox-second-dark-blue border border-blox-glass-border rounded-lg shadow-xl z-50 overflow-hidden"
            >
              {/* Balance Section */}
              <div className="p-4 border-b border-blox-glass-border">
                <div className="text-xs text-blox-medium-blue-gray mb-1">Total Balance</div>
                <div className="text-2xl font-bold text-blox-teal">
                  {formatBLOXAmount(balance)}
                </div>
                <button
                  onClick={fetchBalance}
                  className="mt-2 text-xs text-blox-light-blue-gray hover:text-blox-teal transition-colors"
                >
                  Refresh Balance
                </button>
              </div>

              {/* Wallet Info */}
              <div className="p-4 border-b border-blox-glass-border">
                <div className="text-xs text-blox-medium-blue-gray mb-2">Wallet Address</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-blox-white bg-blox-black-blue px-2 py-1 rounded flex-1">
                    {shortenAddress(publicKey, 6)}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="p-1 hover:bg-blox-glass-bg rounded transition-colors"
                    title="Copy address"
                  >
                    <Copy className="w-3 h-3 text-blox-medium-blue-gray" />
                  </button>
                  <button
                    onClick={openExplorer}
                    className="p-1 hover:bg-blox-glass-bg rounded transition-colors"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-3 h-3 text-blox-medium-blue-gray" />
                  </button>
                </div>
              </div>

              {/* Network Status */}
              <div className="p-4 border-b border-blox-glass-border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-blox-medium-blue-gray">Network</div>
                    <div className="text-sm text-blox-white">Solana Devnet</div>
                  </div>
                  <div className="px-2 py-1 bg-blox-purple/20 text-blox-purple text-xs rounded">
                    Testnet
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={handleDisconnect}
                className="w-full p-3 flex items-center gap-2 text-sm text-blox-off-white hover:bg-blox-glass-bg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Disconnect Wallet
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Disconnected state
  return (
    <>
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blox-teal to-blox-purple text-white rounded-lg hover:shadow-teal-glow transition-all duration-200 disabled:opacity-50"
      >
        {connecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">Connect Wallet</span>
          </>
        )}
      </button>

      <WalletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={connect}
      />
    </>
  )
}
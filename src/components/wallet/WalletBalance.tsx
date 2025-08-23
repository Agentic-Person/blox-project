'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { useWallet } from '@/lib/providers/wallet-provider'
import { getTokenBalance } from '@/lib/solana/tokens'
import { formatBLOXAmount } from '@/lib/learning/xp-to-blox'
import { useLearningStore } from '@/store/learningStore'
import { motion } from 'framer-motion'

export function WalletBalance() {
  const { connected, publicKey } = useWallet()
  const { totalXP, totalBLOXEarned } = useLearningStore()
  const [balance, setBalance] = useState(0)
  const [previousBalance, setPreviousBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
    }
  }, [connected, publicKey, totalBLOXEarned])

  const fetchBalance = async () => {
    if (!publicKey) return
    setLoading(true)
    try {
      const tokenBalance = await getTokenBalance(publicKey)
      setPreviousBalance(balance)
      setBalance(tokenBalance)
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setLoading(false)
    }
  }

  const balanceChange = balance - previousBalance
  const percentageChange = previousBalance > 0 ? ((balanceChange / previousBalance) * 100).toFixed(1) : 0

  if (!connected) {
    return (
      <div className="glass-card p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blox-purple/20 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-blox-purple" />
          </div>
          <div>
            <p className="text-xs text-blox-medium-blue-gray">Connect wallet to see</p>
            <p className="text-sm font-semibold text-blox-white">BLOX Balance</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="glass-card p-4 rounded-lg card-hover-glow"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blox-teal to-blox-purple rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-blox-medium-blue-gray">BLOX Balance</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-blox-white">
                {loading ? '...' : formatBLOXAmount(balance)}
              </p>
              {balanceChange !== 0 && !loading && (
                <span className={`flex items-center gap-1 text-xs ${balanceChange > 0 ? 'text-blox-success' : 'text-red-500'}`}>
                  {balanceChange > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {percentageChange}%
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="text-right">
          <p className="text-xs text-blox-medium-blue-gray">Pending</p>
          <p className="text-sm font-semibold text-blox-teal">
            +{Math.floor(totalXP / 100 - totalBLOXEarned)} BLOX
          </p>
        </div>
      </div>

      {/* Progress to next BLOX */}
      <div className="mt-3 pt-3 border-t border-blox-glass-border">
        <div className="flex items-center justify-between text-xs text-blox-medium-blue-gray mb-1">
          <span>Progress to next BLOX</span>
          <span>{totalXP % 100}/100 XP</span>
        </div>
        <div className="w-full h-2 bg-blox-black-blue rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-blox-teal to-blox-purple"
            initial={{ width: 0 }}
            animate={{ width: `${(totalXP % 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
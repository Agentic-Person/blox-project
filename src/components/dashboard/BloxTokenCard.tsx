'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, TrendingUp, Gift, Clock, ArrowRight, 
  Trophy, Target, Sparkles, ChevronRight,
  Wallet, ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLearningStore } from '@/store/learningStore'
import { useWallet } from '@/lib/providers/wallet-provider'
import { 
  formatBLOXAmount, 
  xpToBLOX, 
  getBLOXTier,
  getNextBonusTime,
  calculateDailyReward
} from '@/lib/learning/xp-to-blox'
import { getTokenBalance } from '@/lib/solana/tokens'
import Link from 'next/link'
import toast from 'react-hot-toast'

export function BloxTokenCard() {
  const { 
    totalXP, 
    totalBLOXEarned, 
    currentStreak,
    claimDailyBonus,
    completedVideos
  } = useLearningStore()
  
  const { connected, publicKey, connect } = useWallet()
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [canClaimDaily, setCanClaimDaily] = useState(false)
  
  // Calculate pending rewards
  const pendingBLOX = xpToBLOX(totalXP) - totalBLOXEarned
  const tier = getBLOXTier(totalBLOXEarned)
  const nextBonusTime = getNextBonusTime()
  
  // Today's earnings estimate
  const todaysPotentialEarnings = calculateDailyReward(3, true, 80)
  
  // Fetch wallet balance
  useEffect(() => {
    if (connected && publicKey) {
      fetchWalletBalance()
    }
  }, [connected, publicKey])
  
  // Check if daily bonus can be claimed
  useEffect(() => {
    const lastClaim = localStorage.getItem('lastDailyBonusClaim')
    if (!lastClaim) {
      setCanClaimDaily(true)
      return
    }
    
    const lastClaimDate = new Date(lastClaim)
    const now = new Date()
    const hoursSinceLastClaim = (now.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60)
    
    setCanClaimDaily(hoursSinceLastClaim >= 24)
  }, [])
  
  const fetchWalletBalance = async () => {
    if (!publicKey) return
    setLoading(true)
    try {
      const balance = await getTokenBalance(publicKey)
      setWalletBalance(balance)
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleClaimDaily = () => {
    if (!canClaimDaily) {
      toast.error('Daily bonus already claimed! Come back tomorrow.')
      return
    }
    
    const bonusAmount = claimDailyBonus()
    localStorage.setItem('lastDailyBonusClaim', new Date().toISOString())
    setCanClaimDaily(false)
    
    toast.success(`Claimed ${bonusAmount} BLOX daily bonus! 🎉`)
  }
  
  const handleConnectWallet = async () => {
    await connect()
  }

  return (
    <Card className="card-hover border-blox-purple/20 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blox-teal/5 via-transparent to-blox-purple/5 opacity-50" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blox-teal to-blox-purple rounded-xl flex items-center justify-center shadow-teal-glow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-blox-white">
                BLOX Tokens
              </CardTitle>
              <p className="text-xs text-blox-medium-blue-gray">
                Your learning rewards on Solana
              </p>
            </div>
          </div>
          
          {/* Tier Badge */}
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r from-blox-glass-bg to-blox-second-dark-blue border border-blox-glass-border`}>
            <span className={`text-sm font-semibold ${tier.color}`}>
              {tier.tier} Tier
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        {/* Balance Overview */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            className="bg-blox-glass-bg rounded-lg p-3 border border-blox-glass-border"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-blox-teal" />
              <span className="text-xs text-blox-medium-blue-gray">Total Earned</span>
            </div>
            <p className="text-2xl font-bold text-blox-white">
              {formatBLOXAmount(totalBLOXEarned)}
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-blox-glass-bg rounded-lg p-3 border border-blox-glass-border"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blox-purple" />
              <span className="text-xs text-blox-medium-blue-gray">Pending</span>
            </div>
            <p className="text-2xl font-bold text-blox-purple">
              +{pendingBLOX}
            </p>
          </motion.div>
        </div>
        
        {/* Wallet Connection / Balance */}
        {connected ? (
          <div className="bg-gradient-to-r from-blox-teal/10 to-blox-purple/10 rounded-lg p-3 border border-blox-teal/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-blox-teal" />
                  <span className="text-xs text-blox-medium-blue-gray">Wallet Balance</span>
                </div>
                <p className="text-xl font-bold text-blox-teal">
                  {loading ? '...' : formatBLOXAmount(walletBalance)}
                </p>
              </div>
              <button
                onClick={fetchWalletBalance}
                className="p-2 hover:bg-blox-glass-bg rounded-lg transition-colors"
                title="Refresh balance"
              >
                <TrendingUp className="w-4 h-4 text-blox-teal" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleConnectWallet}
            className="w-full bg-gradient-to-r from-blox-teal to-blox-purple text-white rounded-lg p-3 hover:shadow-teal-glow transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4" />
              <span className="font-medium">Connect Wallet to Claim</span>
            </div>
          </button>
        )}
        
        {/* Progress to Next Tier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-blox-medium-blue-gray">Progress to {tier.nextTier ? `${tier.nextTier} BLOX` : 'Max Tier'}</span>
            <span className="text-blox-teal font-medium">{Math.round(tier.progress)}%</span>
          </div>
          <div className="w-full h-2 bg-blox-black-blue rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blox-teal to-blox-purple"
              initial={{ width: 0 }}
              animate={{ width: `${tier.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
        
        {/* Daily Bonus */}
        <div className="bg-blox-second-dark-blue/50 rounded-lg p-3 border border-blox-glass-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-blox-success" />
              <span className="text-sm font-medium text-blox-white">Daily Bonus</span>
            </div>
            <span className="text-xs text-blox-medium-blue-gray">
              {currentStreak} day streak 🔥
            </span>
          </div>
          
          {canClaimDaily ? (
            <button
              onClick={handleClaimDaily}
              className="w-full bg-blox-success/20 text-blox-success border border-blox-success/30 rounded-lg py-2 hover:bg-blox-success/30 transition-colors"
            >
              <span className="text-sm font-medium">Claim 50 BLOX</span>
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-blox-medium-blue-gray">Next bonus in</span>
              <div className="flex items-center gap-1 text-xs text-blox-off-white">
                <Clock className="w-3 h-3" />
                <span>{nextBonusTime}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/tokenomics"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blox-glass-bg rounded-lg hover:bg-blox-glass-bg/70 transition-colors group"
          >
            <Target className="w-4 h-4 text-blox-teal" />
            <span className="text-xs text-blox-off-white group-hover:text-blox-teal transition-colors">
              How to Earn
            </span>
          </Link>
          
          <Link
            href="/tokenomics#spending"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blox-glass-bg rounded-lg hover:bg-blox-glass-bg/70 transition-colors group"
          >
            <ExternalLink className="w-4 h-4 text-blox-purple" />
            <span className="text-xs text-blox-off-white group-hover:text-blox-purple transition-colors">
              Use BLOX
            </span>
          </Link>
        </div>
        
        {/* Today's Potential */}
        <div className="pt-3 border-t border-blox-glass-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blox-medium-blue-gray">Today's Potential</p>
              <p className="text-lg font-bold text-blox-teal">
                +{todaysPotentialEarnings} BLOX
              </p>
            </div>
            <Link
              href="/learning"
              className="flex items-center gap-1 text-xs text-blox-teal hover:text-blox-white transition-colors"
            >
              <span>Start Learning</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
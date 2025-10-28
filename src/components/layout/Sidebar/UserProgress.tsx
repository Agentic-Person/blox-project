'use client'

import * as Progress from '@radix-ui/react-progress'
import { Trophy, Coins, Zap } from 'lucide-react'

export function UserProgress() {
  // Mock data for Blox tokens - you can replace with actual store data
  const bloxTokens = 1250
  const totalXP = 325
  const progressPercent = 65
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-blox-light-blue-gray">Overall Progress Level</span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blox-xp/20 text-blox-xp text-xs font-semibold border border-blox-xp/30">
          <Zap className="w-3 h-3" />
          {totalXP} XP
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="flex items-center gap-1">
        <Coins className="w-3 h-3 text-blox-success" />
        <p className="text-xs text-blox-success font-semibold">{bloxTokens.toLocaleString()} BLOX</p>
      </div>
    </div>
  )
}
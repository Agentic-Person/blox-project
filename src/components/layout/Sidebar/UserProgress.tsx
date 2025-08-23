'use client'

import * as Progress from '@radix-ui/react-progress'
import { Trophy } from 'lucide-react'

export function UserProgress() {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-blox-light-blue-gray">Level Progress</span>
        <span className="level-badge">Level 3</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '65%' }} />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-blox-teal">325 / 600 XP</p>
        <span className="xp-badge">+50 XP</span>
      </div>
    </div>
  )
}
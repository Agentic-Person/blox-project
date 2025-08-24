'use client'

import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function UpgradeCard() {
  return (
    <div className="relative glass-card border border-blox-golden-yellow/30 p-4 rounded-lg overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blox-golden-yellow/5 via-transparent to-blox-golden-yellow/5" />
      
      <div className="relative space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blox-golden-yellow" />
          <h3 className="text-blox-white font-semibold">Upgrade to Pro</h3>
        </div>
        
        <p className="text-xs text-blox-off-white/90 leading-relaxed">
          Unlock Blox Chat Wizard - your personal AI learning assistant
        </p>
        
        <Link 
          href="/upgrade"
          className="group flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blox-golden-yellow to-blox-golden-yellow-dark text-blox-black-blue font-semibold py-2 px-4 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
        >
          <span className="text-sm">Learn more</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        
        <p className="text-[10px] text-blox-medium-blue-gray text-center">
          Limited Mode
        </p>
      </div>
    </div>
  )
}
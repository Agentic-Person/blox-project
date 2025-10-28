'use client'

import { Hero } from './Hero'
import { Features } from './Features'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blox-very-dark-blue via-blox-dark-blue to-blox-black-blue">
      <Hero />
      <Features />

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-blox-glass-border/20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-blox-off-white/60 text-sm">
            &copy; {new Date().getFullYear()} Blox Buddy. Free learning platform for young Roblox developers.
          </p>
        </div>
      </footer>
    </div>
  )
}

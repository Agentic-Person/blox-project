'use client'

export function QuickStats() {
  return (
    <div className="w-full">
      <h3 className="px-2 mb-3 text-xs font-semibold text-blox-light-blue-gray uppercase tracking-wider">
        Quick Stats
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="glass-card rounded-lg p-3">
          <div className="text-xs text-blox-light-blue-gray">Streak</div>
          <div className="text-lg font-bold text-blox-teal teal-glow-text">7 days</div>
        </div>
        <div className="glass-card rounded-lg p-3">
          <div className="text-xs text-blox-light-blue-gray">Completed</div>
          <div className="text-lg font-bold text-blox-teal">23</div>
        </div>
        <div className="glass-card rounded-lg p-3">
          <div className="text-xs text-blox-light-blue-gray">BLOX</div>
          <div className="text-lg font-bold text-blox-teal teal-glow-text">450</div>
        </div>
        <div className="glass-card rounded-lg p-3">
          <div className="text-xs text-blox-light-blue-gray">Rank</div>
          <div className="text-lg font-bold text-blox-teal">#142</div>
        </div>
      </div>
    </div>
  )
}
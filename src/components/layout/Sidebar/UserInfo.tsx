'use client'

export function UserInfo() {
  return (
    <div className="flex items-center space-x-3">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-r from-blox-teal to-blox-teal-dark rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">BB</span>
        </div>
        <div className="absolute -bottom-1 -right-1 bg-blox-very-dark-blue rounded-full p-0.5">
          <div className="bg-green-500 w-2.5 h-2.5 rounded-full" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blox-white truncate">
          BloxBuilder123
        </p>
        <p className="text-xs text-blox-off-white truncate">
          Level 3 Builder
        </p>
      </div>
    </div>
  )
}
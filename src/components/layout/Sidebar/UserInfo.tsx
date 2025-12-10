'use client'

import { useAuth } from '@/lib/providers/auth-provider'

export function UserInfo() {
  const { user, isAuthenticated } = useAuth()

  // Get initials from username or email
  const getInitials = () => {
    if (!user) return '?'
    const name = user.username || user.email || 'User'
    return name.slice(0, 2).toUpperCase()
  }

  // Get display name
  const getDisplayName = () => {
    if (!user) return 'Not signed in'
    return user.username || user.email?.split('@')[0] || 'User'
  }

  // Get role display
  const getRoleDisplay = () => {
    if (!user) return 'Guest'
    if (user.adminRole) {
      return user.adminRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    return user.role === 'student' ? 'Learner' : user.role.charAt(0).toUpperCase() + user.role.slice(1)
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="relative flex-shrink-0">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={getDisplayName()}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-r from-blox-teal to-blox-teal-dark rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">{getInitials()}</span>
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 bg-blox-very-dark-blue rounded-full p-0.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-gray-500'}`} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blox-white truncate">
          {getDisplayName()}
        </p>
        <p className="text-xs text-blox-off-white truncate">
          {getRoleDisplay()}
        </p>
      </div>
    </div>
  )
}

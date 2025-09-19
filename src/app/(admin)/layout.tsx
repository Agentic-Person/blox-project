/**
 * Admin Layout
 * Protected layout wrapper for all admin pages with navigation and sidebar
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Video, 
  PlaySquare, 
  Activity, 
  BarChart3, 
  Settings, 
  Users, 
  LogOut,
  Menu,
  X,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

import { useAuth } from '@/lib/providers/auth-provider'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
  badge?: number
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Videos', href: '/admin/videos', icon: Video, permission: 'videos.view' },
  { name: 'Playlists', href: '/admin/playlists', icon: PlaySquare, permission: 'playlists.view' },
  { name: 'Queue', href: '/admin/queue', icon: Activity, permission: 'queue.view', badge: 3 },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: 'analytics.view' },
  { name: 'Users', href: '/admin/users', icon: Users, permission: 'users.view' },
  { name: 'Settings', href: '/admin/settings', icon: Settings, permission: 'system.settings' }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAdmin, adminRole, signOut, isLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/unauthorized')
    }
  }, [user, isAdmin, isLoading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // Show loading state
  if (isLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const roleColors = {
    super_admin: 'text-red-600 bg-red-100',
    admin: 'text-blue-600 bg-blue-100',
    moderator: 'text-green-600 bg-green-100'
  }

  const roleColor = roleColors[adminRole as keyof typeof roleColors] || roleColors.moderator

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </motion.div>
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -320 }}
        className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className=\"flex h-full flex-col\">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className=\"flex items-center space-x-3\">
              <div className="bg-blue-600 rounded-lg p-2">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">Blox Buddy</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Admin user info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <img
                className="h-10 w-10 rounded-full"
                src={user.avatar || '/images/avatars/default-admin.jpg'}
                alt={user.username}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.username}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColor}`}>
                {adminRole?.replace('_', ' ').toUpperCase()}
              </span>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              
              return (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-blue-50 hover:text-blue-700"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className=\"flex-1\">{item.name}</span>
                  {item.badge && (
                    <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </motion.a>
              )
            })}
          </nav>

          {/* System status */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-sm font-medium text-green-800">System Status</span>
              </div>
              <div className="mt-1 text-xs text-green-700">
                All services operational
              </div>
            </div>
          </div>

          {/* Sidebar footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <motion.button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              className="p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
            <div></div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
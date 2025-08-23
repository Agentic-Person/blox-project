import { BookOpen, Users, TrendingUp, MessageCircle, FileText, User, Settings, HelpCircle, Home, Bot } from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: any
  description?: string
  badge?: string
}

export const MAIN_NAV: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview of your progress',
  },
  {
    title: 'Learning',
    href: '/learning',
    icon: BookOpen,
    description: 'Structured learning path',
  },
  {
    title: 'Teams',
    href: '/teams',
    icon: Users,
    description: 'Find and join teams',
  },
  {
    title: 'Progress',
    href: '/progress',
    icon: TrendingUp,
    description: 'Track your learning journey',
  },
  {
    title: 'Discord',
    href: '/discord',
    icon: MessageCircle,
    description: 'Community chat',
  },
  {
    title: 'Notes',
    href: '/notes',
    icon: FileText,
    description: 'Your learning notes',
  },
  {
    title: 'Blox Wizard',
    href: '/ai-assistant',
    icon: Bot,
    description: 'AI learning companion',
    badge: 'AI',
  },
]

export const SECONDARY_NAV: NavItem[] = [
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Help',
    href: '/help',
    icon: HelpCircle,
  },
]
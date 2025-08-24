import { Brain, Users, TrendingUp, MessageCircle, FileText, User, Settings, HelpCircle, Home, Bot, UserCog } from 'lucide-react'

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
    title: 'Learning Path',
    href: '/learning',
    icon: Brain,
    description: 'Structured learning path',
  },
  {
    title: 'Progress',
    href: '/progress',
    icon: TrendingUp,
    description: 'Track your learning journey',
  },
  {
    title: 'Notes',
    href: '/notes',
    icon: FileText,
    description: 'Your learning notes',
  },
  {
    title: 'Discord',
    href: '/discord',
    icon: MessageCircle,
    description: 'Community chat',
  },
  {
    title: 'Teams',
    href: '/teams',
    icon: Users,
    description: 'Find and join teams',
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
    title: 'Account',
    href: '/account',
    icon: UserCog,
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
import { User, UserProfile } from '@/types'

export const mockUser: User = {
  id: 'user-1',
  username: 'BloxBuilder123',
  email: 'alex@example.com',
  avatar: '/images/avatars/user-1.png',
  discordId: '123456789012345678',
  createdAt: new Date('2024-01-15'),
  lastLoginAt: new Date(),
  profile: {
    displayName: 'Alex Thompson',
    bio: 'Passionate about game development and Roblox scripting. Looking to join an awesome team!',
    age: 16,
    parentEmail: 'parent@example.com',
    skills: [
      { name: 'Building', level: 'Intermediate', category: 'Core' },
      { name: 'Scripting', level: 'Beginner', category: 'Technical' },
      { name: 'UI Design', level: 'Beginner', category: 'Design' },
    ],
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        discord: true,
        achievements: true,
        teamUpdates: true,
      },
      privacy: {
        profileVisibility: 'public',
        showProgress: true,
        showTeams: true,
      },
    },
    stats: {
      totalVideosWatched: 47,
      totalTimeSpent: 1260, // 21 hours
      streakDays: 12,
      achievementsUnlocked: 8,
      teamsJoined: 2,
    },
  },
}

export const mockUsers: User[] = [
  mockUser,
  {
    id: 'user-2',
    username: 'ScriptMaster',
    email: 'sam@example.com',
    avatar: '/images/avatars/user-2.png',
    discordId: '234567890123456789',
    createdAt: new Date('2024-02-01'),
    lastLoginAt: new Date(Date.now() - 3600000), // 1 hour ago
    profile: {
      displayName: 'Sam Chen',
      bio: 'Advanced scripter with 3+ years of Lua experience',
      age: 19,
      skills: [
        { name: 'Scripting', level: 'Advanced', category: 'Technical' },
        { name: 'Game Design', level: 'Intermediate', category: 'Core' },
        { name: 'Leadership', level: 'Intermediate', category: 'Soft Skills' },
      ],
      preferences: {
        theme: 'dark',
        notifications: {
          email: false,
          discord: true,
          achievements: true,
          teamUpdates: true,
        },
        privacy: {
          profileVisibility: 'public',
          showProgress: true,
          showTeams: true,
        },
      },
      stats: {
        totalVideosWatched: 156,
        totalTimeSpent: 4320, // 72 hours
        streakDays: 45,
        achievementsUnlocked: 23,
        teamsJoined: 4,
      },
    },
  },
]
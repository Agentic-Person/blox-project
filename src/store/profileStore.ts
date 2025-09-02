import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProfileImage {
  id: string
  url: string
  thumbnailUrl?: string
  title?: string
  description?: string
  uploadedAt: string
  isRecentWork?: boolean
  order?: number
}

export interface SocialLink {
  platform: 'discord' | 'twitter' | 'github' | 'youtube' | 'roblox' | 'website'
  url: string
  username?: string
}

export interface Skill {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  category: 'building' | 'scripting' | 'ui-design' | 'game-design' | 'modeling' | 'animation'
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earnedAt: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface ProfileData {
  // Basic Info
  userId: string
  username: string
  fullName: string
  email: string
  avatarUrl?: string
  joinDate: string
  
  // Bio & Status
  background: string
  currentStatus: string
  goals: string
  location?: string
  
  // Links & Social
  personalWebsite?: string
  gameUrl?: string
  socialLinks: SocialLink[]
  
  // Portfolio & Work
  portfolioImages: ProfileImage[]
  recentWork: ProfileImage[]
  
  // Skills & Achievements
  skills: Skill[]
  achievements: Achievement[]
  
  // Stats
  videosWatched: number
  projectsCompleted: number
  teamsJoined: number
  xpEarned: number
  bloxTokens: number
  
  // Settings
  profileVisibility: 'public' | 'friends' | 'private'
  showEmail: boolean
  showLocation: boolean
  allowMessages: boolean
}

interface ProfileStore {
  // State
  profile: ProfileData | null
  isLoading: boolean
  error: string | null
  uploadProgress: number
  activeImageId: string | null
  qrCodeToken: string | null
  
  // Actions - Profile Management
  setProfile: (profile: ProfileData) => void
  updateProfile: (updates: Partial<ProfileData>) => Promise<void>
  loadProfile: (userId: string) => Promise<void>
  
  // Actions - Avatar
  uploadAvatar: (file: File) => Promise<string>
  removeAvatar: () => Promise<void>
  
  // Actions - Images
  uploadImage: (file: File, isRecentWork?: boolean) => Promise<ProfileImage>
  uploadMultipleImages: (files: File[], isRecentWork?: boolean) => Promise<ProfileImage[]>
  deleteImage: (imageId: string) => Promise<void>
  reorderImages: (images: ProfileImage[], isRecentWork?: boolean) => void
  setActiveImage: (imageId: string | null) => void
  
  // Actions - QR Code Upload
  generateQRToken: () => string
  validateQRToken: (token: string) => boolean
  handleQRUpload: (token: string, files: File[]) => Promise<void>
  
  // Actions - Social Links
  addSocialLink: (link: SocialLink) => void
  removeSocialLink: (platform: string) => void
  updateSocialLink: (platform: string, url: string) => void
  
  // Actions - Skills
  addSkill: (skill: Skill) => void
  removeSkill: (skillName: string) => void
  updateSkillLevel: (skillName: string, level: Skill['level']) => void
  
  // Actions - Achievements
  addAchievement: (achievement: Omit<Achievement, 'id' | 'earnedAt'>) => void
  
  // Utility
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setUploadProgress: (progress: number) => void
  clearProfile: () => void
}

// Mock data for development
const mockProfile: ProfileData = {
  userId: 'user-1',
  username: 'blocks-builder-1-2-3',
  fullName: 'Alex Thompson',
  email: 'alex.thompson@example.com',
  avatarUrl: '/images/avatars/JimmyCozyMtns.png',
  joinDate: 'January 15, 2024',
  background: 'I started my journey in game development about 2 years ago when I discovered Roblox Studio.',
  currentStatus: 'Currently working on a multiplayer adventure game called "Mystic Realms"',
  goals: 'My goal is to become a professional game developer and eventually work on larger projects.',
  location: 'United States',
  personalWebsite: 'https://alexthompson.dev',
  gameUrl: 'https://www.roblox.com/games/1234567890/Mystic-Realms',
  socialLinks: [
    { platform: 'discord', url: 'discord.com/users/alex123', username: 'AlexT#1234' },
    { platform: 'twitter', url: 'twitter.com/alexbuilds', username: '@alexbuilds' },
    { platform: 'github', url: 'github.com/alexthompson', username: 'alexthompson' }
  ],
  portfolioImages: [
    {
      id: 'img-1',
      url: 'https://via.placeholder.com/600x400/36B0D9/FFFFFF?text=Mystic+Realms',
      thumbnailUrl: 'https://via.placeholder.com/150x150/36B0D9/FFFFFF?text=MR',
      title: 'Mystic Realms Gameplay',
      description: 'Main gameplay screenshot',
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'img-2',
      url: 'https://via.placeholder.com/600x400/1E3A8A/FFFFFF?text=Ancient+Ruins',
      thumbnailUrl: 'https://via.placeholder.com/150x150/1E3A8A/FFFFFF?text=AR',
      title: 'Ancient Ruins Build',
      description: 'Detailed environment design',
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  recentWork: [
    {
      id: 'recent-1',
      url: 'https://via.placeholder.com/300x300/059669/FFFFFF?text=UI+Update',
      thumbnailUrl: 'https://via.placeholder.com/150x150/059669/FFFFFF?text=UI',
      title: 'New UI System',
      uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isRecentWork: true,
      order: 1
    },
    {
      id: 'recent-2',
      url: 'https://via.placeholder.com/300x300/DC2626/FFFFFF?text=Boss+Fight',
      thumbnailUrl: 'https://via.placeholder.com/150x150/DC2626/FFFFFF?text=BF',
      title: 'Boss Battle System',
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isRecentWork: true,
      order: 2
    }
  ],
  skills: [
    { name: 'Building', level: 'intermediate', category: 'building' },
    { name: 'Lua Scripting', level: 'beginner', category: 'scripting' },
    { name: 'UI Design', level: 'beginner', category: 'ui-design' },
    { name: 'Game Design', level: 'intermediate', category: 'game-design' }
  ],
  achievements: [
    {
      id: 'ach-1',
      title: 'First Project',
      description: 'Completed your first game project',
      icon: '🎮',
      earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      rarity: 'common'
    },
    {
      id: 'ach-2',
      title: 'Team Player',
      description: 'Joined your first team',
      icon: '👥',
      earnedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      rarity: 'common'
    },
    {
      id: 'ach-3',
      title: 'Code Warrior',
      description: 'Wrote 1000+ lines of code',
      icon: '⚔️',
      earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      rarity: 'rare'
    }
  ],
  videosWatched: 47,
  projectsCompleted: 3,
  teamsJoined: 2,
  xpEarned: 2450,
  bloxTokens: 24.5,
  profileVisibility: 'public',
  showEmail: false,
  showLocation: true,
  allowMessages: true
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: mockProfile,
      isLoading: false,
      error: null,
      uploadProgress: 0,
      activeImageId: null,
      qrCodeToken: null,
      
      // Profile Management
      setProfile: (profile) => set({ profile }),
      
      updateProfile: async (updates) => {
        set({ isLoading: true, error: null })
        try {
          // In production, this would call Supabase
          await new Promise(resolve => setTimeout(resolve, 500))
          
          set((state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null,
            isLoading: false
          }))
        } catch (error) {
          set({ error: 'Failed to update profile', isLoading: false })
          throw error
        }
      },
      
      loadProfile: async (userId) => {
        set({ isLoading: true, error: null })
        try {
          // In production, fetch from Supabase
          await new Promise(resolve => setTimeout(resolve, 500))
          set({ profile: mockProfile, isLoading: false })
        } catch (error) {
          set({ error: 'Failed to load profile', isLoading: false })
          throw error
        }
      },
      
      // Avatar Management
      uploadAvatar: async (file) => {
        set({ uploadProgress: 0 })
        try {
          // Simulate upload progress
          for (let i = 0; i <= 100; i += 20) {
            set({ uploadProgress: i })
            await new Promise(resolve => setTimeout(resolve, 200))
          }
          
          // In production, upload to Supabase Storage
          const avatarUrl = URL.createObjectURL(file)
          
          set((state) => ({
            profile: state.profile ? { ...state.profile, avatarUrl } : null,
            uploadProgress: 0
          }))
          
          return avatarUrl
        } catch (error) {
          set({ uploadProgress: 0 })
          throw error
        }
      },
      
      removeAvatar: async () => {
        // In production, delete from Supabase Storage
        set((state) => ({
          profile: state.profile ? { ...state.profile, avatarUrl: undefined } : null
        }))
      },
      
      // Image Management
      uploadImage: async (file, isRecentWork = false) => {
        set({ uploadProgress: 0 })
        try {
          // Simulate upload
          for (let i = 0; i <= 100; i += 25) {
            set({ uploadProgress: i })
            await new Promise(resolve => setTimeout(resolve, 150))
          }
          
          const imageUrl = URL.createObjectURL(file)
          const newImage: ProfileImage = {
            id: `img-${Date.now()}`,
            url: imageUrl,
            thumbnailUrl: imageUrl, // In production, generate thumbnail
            title: file.name,
            uploadedAt: new Date().toISOString(),
            isRecentWork,
            order: isRecentWork ? get().profile?.recentWork.length || 0 : undefined
          }
          
          set((state) => {
            if (!state.profile) return { uploadProgress: 0 }
            
            if (isRecentWork) {
              // Add to recent work, keep only 12 most recent
              const recentWork = [newImage, ...state.profile.recentWork].slice(0, 12)
              return {
                profile: { ...state.profile, recentWork },
                uploadProgress: 0
              }
            } else {
              return {
                profile: {
                  ...state.profile,
                  portfolioImages: [...state.profile.portfolioImages, newImage]
                },
                uploadProgress: 0
              }
            }
          })
          
          return newImage
        } catch (error) {
          set({ uploadProgress: 0 })
          throw error
        }
      },
      
      uploadMultipleImages: async (files, isRecentWork = false) => {
        const images: ProfileImage[] = []
        for (const file of files) {
          const image = await get().uploadImage(file, isRecentWork)
          images.push(image)
        }
        return images
      },
      
      deleteImage: async (imageId) => {
        // In production, delete from Supabase Storage
        set((state) => {
          if (!state.profile) return {}
          
          return {
            profile: {
              ...state.profile,
              portfolioImages: state.profile.portfolioImages.filter(img => img.id !== imageId),
              recentWork: state.profile.recentWork.filter(img => img.id !== imageId)
            }
          }
        })
      },
      
      reorderImages: (images, isRecentWork = false) => {
        set((state) => {
          if (!state.profile) return {}
          
          if (isRecentWork) {
            return {
              profile: { ...state.profile, recentWork: images }
            }
          } else {
            return {
              profile: { ...state.profile, portfolioImages: images }
            }
          }
        })
      },
      
      setActiveImage: (imageId) => set({ activeImageId: imageId }),
      
      // QR Code Upload
      generateQRToken: () => {
        const token = Math.random().toString(36).substring(2, 15)
        set({ qrCodeToken: token })
        
        // Token expires after 10 minutes
        setTimeout(() => {
          if (get().qrCodeToken === token) {
            set({ qrCodeToken: null })
          }
        }, 10 * 60 * 1000)
        
        return token
      },
      
      validateQRToken: (token) => {
        return get().qrCodeToken === token
      },
      
      handleQRUpload: async (token, files) => {
        if (!get().validateQRToken(token)) {
          throw new Error('Invalid or expired token')
        }
        
        await get().uploadMultipleImages(files, true)
        set({ qrCodeToken: null })
      },
      
      // Social Links
      addSocialLink: (link) => {
        set((state) => {
          if (!state.profile) return {}
          
          const socialLinks = state.profile.socialLinks.filter(l => l.platform !== link.platform)
          return {
            profile: { ...state.profile, socialLinks: [...socialLinks, link] }
          }
        })
      },
      
      removeSocialLink: (platform) => {
        set((state) => {
          if (!state.profile) return {}
          
          return {
            profile: {
              ...state.profile,
              socialLinks: state.profile.socialLinks.filter(l => l.platform !== platform)
            }
          }
        })
      },
      
      updateSocialLink: (platform, url) => {
        set((state) => {
          if (!state.profile) return {}
          
          return {
            profile: {
              ...state.profile,
              socialLinks: state.profile.socialLinks.map(l =>
                l.platform === platform ? { ...l, url } : l
              )
            }
          }
        })
      },
      
      // Skills
      addSkill: (skill) => {
        set((state) => {
          if (!state.profile) return {}
          
          const skills = state.profile.skills.filter(s => s.name !== skill.name)
          return {
            profile: { ...state.profile, skills: [...skills, skill] }
          }
        })
      },
      
      removeSkill: (skillName) => {
        set((state) => {
          if (!state.profile) return {}
          
          return {
            profile: {
              ...state.profile,
              skills: state.profile.skills.filter(s => s.name !== skillName)
            }
          }
        })
      },
      
      updateSkillLevel: (skillName, level) => {
        set((state) => {
          if (!state.profile) return {}
          
          return {
            profile: {
              ...state.profile,
              skills: state.profile.skills.map(s =>
                s.name === skillName ? { ...s, level } : s
              )
            }
          }
        })
      },
      
      // Achievements
      addAchievement: (achievementData) => {
        set((state) => {
          if (!state.profile) return {}
          
          const achievement: Achievement = {
            ...achievementData,
            id: `ach-${Date.now()}`,
            earnedAt: new Date().toISOString()
          }
          
          return {
            profile: {
              ...state.profile,
              achievements: [...state.profile.achievements, achievement]
            }
          }
        })
      },
      
      // Utility
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setUploadProgress: (uploadProgress) => set({ uploadProgress }),
      clearProfile: () => set({ profile: null, error: null })
    }),
    {
      name: 'profile-storage',
      version: 1
    }
  )
)
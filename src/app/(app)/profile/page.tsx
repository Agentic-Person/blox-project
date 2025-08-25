'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Edit, Trophy, Users, BookOpen, MapPin, Calendar, Target } from 'lucide-react'
import { ProfileEditModal } from '@/components/profile/ProfileEditModal'
import { PortfolioSection } from '@/components/profile/PortfolioSection'

// Mock profile data for Alex Thompson
const mockProfileData = {
  username: 'blocks-builder-1-2-3',
  fullName: 'Alex Thompson',
  email: 'alex.thompson@example.com',
  joinDate: 'January 15, 2024',
  background: 'I started my journey in game development about 2 years ago when I discovered Roblox Studio. I\'ve always been fascinated by how games work and wanted to create my own experiences. I started with simple building projects and gradually learned Lua scripting.',
  currentStatus: 'Currently working on a multiplayer adventure game called "Mystic Realms" where players explore ancient ruins and solve puzzles together. I\'m also learning advanced UI design and working on improving my building skills.',
  goals: 'My goal is to become a professional game developer and eventually work on larger projects. I want to master advanced scripting techniques, create engaging gameplay mechanics, and build a portfolio of successful games that players love.',
  personalWebsite: 'https://alexthompson.dev',
  gameUrl: 'https://www.roblox.com/games/1234567890/Mystic-Realms',
  portfolioImages: [
    'https://via.placeholder.com/300x200/36B0D9/FFFFFF?text=Mystic+Realms+Gameplay',
    'https://via.placeholder.com/300x200/1E3A8A/FFFFFF?text=Ancient+Ruins+Build',
    'https://via.placeholder.com/300x200/059669/FFFFFF?text=UI+Design+Mockup',
    'https://via.placeholder.com/300x200/DC2626/FFFFFF?text=Puzzle+Mechanics',
    'https://via.placeholder.com/300x200/7C3AED/FFFFFF?text=Character+Design',
    'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Environment+Art'
  ]
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState(mockProfileData)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleSaveProfile = (newData: typeof mockProfileData) => {
    setProfileData(newData)
    // In a real app, you'd save this to your database
    console.log('Profile updated:', newData)
  }
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blox-white">Profile</h1>
        <Button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blox-teal" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blox-teal to-blox-teal-dark rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">AT</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-blox-white">{profileData.fullName}</h2>
                  <p className="text-blox-teal font-medium">@{profileData.username}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-blox-medium-blue-gray">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {profileData.joinDate}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      United States
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blox-teal" />
                    Background
                  </label>
                  <p className="text-blox-off-white leading-relaxed">
                    {profileData.background}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-blox-teal" />
                    Current Status
                  </label>
                  <p className="text-blox-off-white leading-relaxed">
                    {profileData.currentStatus}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blox-teal" />
                    Goals & Aspirations
                  </label>
                  <p className="text-blox-off-white leading-relaxed">
                    {profileData.goals}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2">Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-3 py-1 bg-blox-black-blue text-blox-teal text-sm rounded-md border border-blox-glass-border">
                      Building - Intermediate
                    </span>
                    <span className="px-3 py-1 bg-blox-black-blue text-blox-teal text-sm rounded-md border border-blox-glass-border">
                      Scripting - Beginner
                    </span>
                    <span className="px-3 py-1 bg-blox-black-blue text-blox-teal text-sm rounded-md border border-blox-glass-border">
                      UI Design - Beginner
                    </span>
                    <span className="px-3 py-1 bg-blox-black-blue text-blox-teal text-sm rounded-md border border-blox-glass-border">
                      Game Design - Beginner
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Section */}
          <PortfolioSection
            portfolioImages={profileData.portfolioImages}
            personalWebsite={profileData.personalWebsite}
            gameUrl={profileData.gameUrl}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-blox-teal mr-2" />
                  <span className="text-blox-off-white">Videos Watched</span>
                </div>
                <span className="text-blox-white font-semibold">47</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-blox-off-white">Achievements</span>
                </div>
                <span className="text-blox-white font-semibold">8</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-blox-teal mr-2" />
                  <span className="text-blox-off-white">Teams Joined</span>
                </div>
                <span className="text-blox-white font-semibold">2</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-blox-second-dark-blue/30">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-blox-white">Completed Module 2</p>
                    <p className="text-xs text-blox-off-white">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-blox-second-dark-blue/30">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-blox-white">Joined Team Alpha</p>
                    <p className="text-xs text-blox-off-white">1 day ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-blox-second-dark-blue/30">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-blox-white">Earned 150 XP</p>
                    <p className="text-xs text-blox-off-white">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profileData={profileData}
        onSave={handleSaveProfile}
      />
    </div>
  )
}
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Edit, Trophy, Users, BookOpen, MapPin, Calendar, Target, QrCode, Upload } from 'lucide-react'
import { ProfileEditModal } from '@/components/profile/ProfileEditModal'
import { PortfolioSection } from '@/components/profile/PortfolioSection'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { RecentWorkGrid } from '@/components/profile/RecentWorkGrid'
import { QRCodeUpload } from '@/components/profile/QRCodeUpload'
import { ImageLightbox } from '@/components/profile/ImageLightbox'
import { useProfileStore } from '@/store/profileStore'
import type { ProfileImage } from '@/store/profileStore'


export default function ProfilePage() {
  const { profile, loadProfile, updateProfile, uploadImage, setActiveImage } = useProfileStore()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<ProfileImage[]>([])
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClientComponentClient()
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id
      if (userId) {
        await loadProfile(userId)
      }
    }
    init()
  }, [])

  const handleSaveProfile = async (newData: any) => {
    await updateProfile(newData)
  }

  const handleImageClick = (image: ProfileImage) => {
    const allImages = [...(profile?.recentWork || []), ...(profile?.portfolioImages || [])]
    const index = allImages.findIndex(img => img.id === image.id)
    setLightboxImages(allImages)
    setLightboxInitialIndex(index >= 0 ? index : 0)
    setIsLightboxOpen(true)
  }

  const handleAddImages = () => {
    setIsQRModalOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      await uploadImage(file, true)
    }
  }

  if (!profile) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blox-teal mx-auto"></div>
          <p className="mt-4 text-blox-off-white">Loading profile...</p>
        </div>
      </div>
    )
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

      {/* Hidden file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

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
                <AvatarUpload
                  currentAvatarUrl={profile.avatarUrl}
                  onUpload={(url) => updateProfile({ avatarUrl: url })}
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-blox-white">{profile.fullName}</h2>
                  <p className="text-blox-teal font-medium">@{profile.username}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-blox-medium-blue-gray">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {profile.joinDate}
                    </div>
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                    )}
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
                    {profile.background}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-blox-teal" />
                    Current Status
                  </label>
                  <p className="text-blox-off-white leading-relaxed">
                    {profile.currentStatus}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blox-teal" />
                    Goals & Aspirations
                  </label>
                  <p className="text-blox-off-white leading-relaxed">
                    {profile.goals}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2">Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill.name}
                        className="px-3 py-1 bg-blox-black-blue text-blox-teal text-sm rounded-md border border-blox-glass-border"
                      >
                        {skill.name} - {skill.level.charAt(0).toUpperCase() + skill.level.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Section */}
          <PortfolioSection
            portfolioImages={profile.portfolioImages.map(img => img.url)}
            personalWebsite={profile.personalWebsite}
            gameUrl={profile.gameUrl}
          />
        </div>

        <div className="space-y-6">
          {/* Recent Work Grid */}
          <RecentWorkGrid
            onImageClick={handleImageClick}
            onAddClick={handleAddImages}
          />

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
                <span className="text-blox-white font-semibold">{profile.videosWatched}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-blox-off-white">Achievements</span>
                </div>
                <span className="text-blox-white font-semibold">{profile.achievements.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-blox-teal mr-2" />
                  <span className="text-blox-off-white">Teams Joined</span>
                </div>
                <span className="text-blox-white font-semibold">{profile.teamsJoined}</span>
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
        profileData={{
          username: profile.username,
          fullName: profile.fullName,
          email: profile.email,
          joinDate: profile.joinDate,
          background: profile.background,
          currentStatus: profile.currentStatus,
          goals: profile.goals,
          personalWebsite: profile.personalWebsite || '',
          gameUrl: profile.gameUrl || '',
          portfolioImages: profile.portfolioImages.map(img => img.url)
        }}
        onSave={handleSaveProfile}
      />

      {/* QR Code Upload Modal */}
      <QRCodeUpload
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxInitialIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  )
}
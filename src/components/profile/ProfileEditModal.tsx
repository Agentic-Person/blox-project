'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Globe, Image as ImageIcon, Plus, X, Upload } from 'lucide-react'

interface ProfileData {
  username: string
  fullName: string
  email: string
  joinDate: string
  background: string
  currentStatus: string
  goals: string
  personalWebsite: string
  gameUrl: string
  portfolioImages: string[]
}

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  profileData: ProfileData
  onSave: (data: ProfileData) => void
}

export function ProfileEditModal({ isOpen, onClose, profileData, onSave }: ProfileEditModalProps) {
  const [formData, setFormData] = useState<ProfileData>(profileData)
  const [newImageUrl, setNewImageUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        portfolioImages: [...prev.portfolioImages, newImageUrl.trim()]
      }))
      setNewImageUrl('')
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolioImages: prev.portfolioImages.filter((_, i) => i !== index)
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          setFormData(prev => ({
            ...prev,
            portfolioImages: [...prev.portfolioImages, result]
          }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  const handleReset = () => {
    setFormData(profileData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blox-teal" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 block">
                    Username
                  </label>
                  <Input
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 block">
                    Full Name
                  </label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 block">
                    Join Date
                  </label>
                  <Input
                    value={formData.joinDate}
                    onChange={(e) => handleInputChange('joinDate', e.target.value)}
                    placeholder="Enter join date"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bio & Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-blox-white mb-2 block">
                  Background
                </label>
                <Textarea
                  value={formData.background}
                  onChange={(e) => handleInputChange('background', e.target.value)}
                  placeholder="Tell us about your background in game development..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blox-white mb-2 block">
                  What are you doing now?
                </label>
                <Textarea
                  value={formData.currentStatus}
                  onChange={(e) => handleInputChange('currentStatus', e.target.value)}
                  placeholder="What projects are you currently working on?"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blox-white mb-2 block">
                  What are you looking to do?
                </label>
                <Textarea
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  placeholder="What are your goals and aspirations?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-blox-teal" />
                Links & Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 block">
                    Personal Website
                  </label>
                  <Input
                    value={formData.personalWebsite}
                    onChange={(e) => handleInputChange('personalWebsite', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blox-white mb-2 block">
                    Game URL
                  </label>
                  <Input
                    value={formData.gameUrl}
                    onChange={(e) => handleInputChange('gameUrl', e.target.value)}
                    placeholder="https://roblox.com/games/..."
                  />
                </div>
              </div>

              {/* Portfolio Images */}
              <div>
                <label className="text-sm font-medium text-blox-white mb-2 block">
                  Portfolio Images
                </label>
                <div className="space-y-3">
                  {/* Add new image */}
                  <div className="flex gap-2">
                    <Input
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Enter image URL or upload file"
                    />
                    <Button
                      onClick={handleAddImage}
                      variant="outline"
                      size="sm"
                      disabled={!newImageUrl.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Display existing images */}
                  {formData.portfolioImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {formData.portfolioImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Portfolio ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-blox-glass-border"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  Upload,
  ChevronRight,
  Info,
  Sparkles,
  Shield,
  Target,
  Palette,
  Lock,
  Unlock,
  UserCheck
} from 'lucide-react'
import { useTeamStore } from '@/store/teamStore'
import TeamBetaBadge from '@/components/teams/TeamBetaBadge'

const AVAILABLE_SKILLS = [
  'Building',
  'Scripting',
  'UI Design',
  'Game Design',
  'Art',
  'Animation',
  'Sound Design',
  'Leadership',
  'Marketing',
  'Testing'
]

export default function CreateTeamPage() {
  const router = useRouter()
  const { createTeam } = useTeamStore()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'casual' as 'casual' | 'competitive' | 'learning',
    maxMembers: 4,
    skills: [] as string[],
    recruitmentStatus: 'open' as 'open' | 'selective' | 'closed',
    avatar: '',
    requireApplication: true,
    autoAcceptApplications: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, avatar: 'Image must be less than 5MB' }))
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        handleInputChange('avatar', event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Team name must be at least 3 characters'
    } else if (formData.name.length > 30) {
      newErrors.name = 'Team name must be less than 30 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Team description is required'
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    } else if (formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters'
    }

    if (formData.skills.length === 0) {
      newErrors.skills = 'Select at least one skill'
    } else if (formData.skills.length > 5) {
      newErrors.skills = 'Maximum 5 skills allowed'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Create the team
      const teamId = createTeam({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        avatar: formData.avatar || undefined,
        leader: 'user-1', // Will be replaced with actual user ID from auth
        maxMembers: formData.maxMembers,
        skills: formData.skills,
        recruitmentStatus: formData.recruitmentStatus,
        settings: {
          isPublic: true,
          requireApplication: formData.requireApplication,
          autoAcceptApplications: formData.autoAcceptApplications
        }
      })

      // Redirect to the new team page
      router.push(`/teams/${teamId}`)
    } catch (error) {
      console.error('Error creating team:', error)
      setErrors({ submit: 'Failed to create team. Please try again.' })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-blox-white">Create Your Team</h1>
          <TeamBetaBadge size="md" />
        </div>
        <p className="text-blox-off-white">
          Build amazing Roblox experiences together with your dream team
        </p>
      </div>

      {/* Beta Notice */}
      <Card className="glass-card border-blox-purple/30 bg-blox-purple/5 mb-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blox-purple mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blox-white font-medium mb-1">
                Teams Beta Feature
              </p>
              <p className="text-xs text-blox-off-white">
                You're creating a team during our beta phase. Some features like Discord integration 
                and automated project management are coming soon!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blox-teal" />
              Basic Information
            </CardTitle>
            <CardDescription>Tell us about your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Team Name */}
            <div>
              <label className="text-sm font-medium text-blox-white mb-2 block">
                Team Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your team name"
                maxLength={30}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
              <p className="text-xs text-blox-medium-blue-gray mt-1">
                {formData.name.length}/30 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-blox-white mb-2 block">
                Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="What makes your team special? What are you building?"
                rows={3}
                maxLength={200}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description}</p>
              )}
              <p className="text-xs text-blox-medium-blue-gray mt-1">
                {formData.description.length}/200 characters
              </p>
            </div>

            {/* Team Avatar */}
            <div>
              <label className="text-sm font-medium text-blox-white mb-2 block">
                Team Avatar
              </label>
              <div className="flex items-center gap-4">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Team avatar"
                    className="w-20 h-20 rounded-lg object-cover border border-blox-glass-border"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-blox-second-dark-blue border border-blox-glass-border flex items-center justify-center">
                    <Upload className="h-6 w-6 text-blox-medium-blue-gray" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </div>
                  </label>
                  <p className="text-xs text-blox-medium-blue-gray mt-1">
                    PNG, JPG up to 5MB
                  </p>
                  {errors.avatar && (
                    <p className="text-xs text-red-500 mt-1">{errors.avatar}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Configuration */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blox-teal" />
              Team Configuration
            </CardTitle>
            <CardDescription>Set up your team preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Team Type */}
            <div>
              <label className="text-sm font-medium text-blox-white mb-2 block">
                Team Type *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'casual', label: 'Casual', icon: Palette, description: 'Fun and relaxed' },
                  { value: 'competitive', label: 'Competitive', icon: Target, description: 'Goal-oriented' },
                  { value: 'learning', label: 'Learning', icon: Users, description: 'Growth focused' }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('type', type.value)}
                    className={`p-3 rounded-lg border transition-all ${
                      formData.type === type.value
                        ? 'border-blox-teal bg-blox-teal/10'
                        : 'border-blox-glass-border hover:border-blox-teal/50'
                    }`}
                  >
                    <type.icon className={`h-5 w-5 mx-auto mb-1 ${
                      formData.type === type.value ? 'text-blox-teal' : 'text-blox-medium-blue-gray'
                    }`} />
                    <p className={`text-sm font-medium ${
                      formData.type === type.value ? 'text-blox-white' : 'text-blox-off-white'
                    }`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-blox-medium-blue-gray">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Team Size */}
            <div>
              <label className="text-sm font-medium text-blox-white mb-2 block">
                Maximum Team Size: {formData.maxMembers} members
              </label>
              <input
                type="range"
                min="2"
                max="10"
                value={formData.maxMembers}
                onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-blox-medium-blue-gray mt-1">
                <span>2 (Small)</span>
                <span>6 (Medium)</span>
                <span>10 (Large)</span>
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <label className="text-sm font-medium text-blox-white mb-2 block">
                Required Skills * (Max 5)
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    disabled={!formData.skills.includes(skill) && formData.skills.length >= 5}
                    className={`px-3 py-1 rounded-md text-sm transition-all ${
                      formData.skills.includes(skill)
                        ? 'bg-blox-teal text-white'
                        : 'bg-blox-second-dark-blue text-blox-off-white hover:bg-blox-teal/20 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {errors.skills && (
                <p className="text-xs text-red-500 mt-1">{errors.skills}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recruitment Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blox-teal" />
              Recruitment Settings
            </CardTitle>
            <CardDescription>Control how players can join your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recruitment Status */}
            <div>
              <label className="text-sm font-medium text-blox-white mb-2 block">
                Recruitment Status
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'open', label: 'Open', icon: Unlock, color: 'green' },
                  { value: 'selective', label: 'Selective', icon: UserCheck, color: 'yellow' },
                  { value: 'closed', label: 'Closed', icon: Lock, color: 'red' }
                ].map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleInputChange('recruitmentStatus', status.value)}
                    className={`p-3 rounded-lg border transition-all ${
                      formData.recruitmentStatus === status.value
                        ? `border-${status.color}-500 bg-${status.color}-500/10`
                        : 'border-blox-glass-border hover:border-blox-teal/50'
                    }`}
                  >
                    <status.icon className={`h-5 w-5 mx-auto mb-1 ${
                      formData.recruitmentStatus === status.value 
                        ? `text-${status.color}-500` 
                        : 'text-blox-medium-blue-gray'
                    }`} />
                    <p className={`text-sm font-medium ${
                      formData.recruitmentStatus === status.value ? 'text-blox-white' : 'text-blox-off-white'
                    }`}>
                      {status.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Application Settings */}
            {formData.recruitmentStatus !== 'closed' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blox-second-dark-blue/30 border border-blox-glass-border">
                  <div>
                    <p className="text-sm font-medium text-blox-white">Require Application</p>
                    <p className="text-xs text-blox-medium-blue-gray">
                      Players must apply and be approved to join
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('requireApplication', !formData.requireApplication)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      formData.requireApplication ? 'bg-blox-teal' : 'bg-blox-medium-blue-gray'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      formData.requireApplication ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {formData.requireApplication && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blox-second-dark-blue/30 border border-blox-glass-border">
                    <div>
                      <p className="text-sm font-medium text-blox-white">Auto-Accept Applications</p>
                      <p className="text-xs text-blox-medium-blue-gray">
                        Automatically accept all applications
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('autoAcceptApplications', !formData.autoAcceptApplications)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        formData.autoAcceptApplications ? 'bg-blox-teal' : 'bg-blox-medium-blue-gray'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        formData.autoAcceptApplications ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Message */}
        {errors.submit && (
          <Card className="glass-card border-red-500/30 bg-red-500/5">
            <CardContent className="p-4">
              <p className="text-sm text-red-500">{errors.submit}</p>
            </CardContent>
          </Card>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/teams')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[150px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Create Team
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
'use client'

import { useState, useRef } from 'react'
import { Upload, Camera, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProfileStore } from '@/store/profileStore'
import { validateFile } from '@/lib/supabase/storage'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  onUpload?: (url: string) => void
}

export function AvatarUpload({ currentAvatarUrl, onUpload }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { uploadAvatar, removeAvatar, uploadProgress } = useProfileStore()
  
  const handleFile = async (file: File) => {
    // Validate file
    const validation = validateFile(file, 2, ['image/jpeg', 'image/png', 'image/webp'])
    if (!validation.valid) {
      alert(validation.error)
      return
    }
    
    setIsUploading(true)
    
    try {
      // Create preview
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)
      
      // Upload to storage
      const url = await uploadAvatar(file)
      
      if (onUpload) {
        onUpload(url)
      }
      
      // Clear preview after successful upload
      setPreviewUrl(null)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload avatar')
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }
  
  const handleRemove = async () => {
    if (confirm('Remove your avatar?')) {
      await removeAvatar()
      setPreviewUrl(null)
    }
  }
  
  const displayUrl = previewUrl || currentAvatarUrl
  
  return (
    <div className="relative">
      <div
        className={`
          relative w-32 h-32 rounded-full overflow-hidden
          border-2 border-dashed transition-all
          ${dragActive ? 'border-blox-teal bg-blox-teal/10' : 'border-blox-glass-border'}
          ${!displayUrl ? 'bg-blox-second-dark-blue/50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-12 h-12 text-blox-medium-blue-gray" />
          </div>
        )}
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-blox-teal"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Camera className="h-4 w-4" />
            </Button>
            {displayUrl && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:text-red-500"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Upload progress */}
        {isUploading && uploadProgress > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-blox-glass-border"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${uploadProgress * 1.76} 176`}
                    className="text-blox-teal transition-all"
                  />
                </svg>
              </div>
              <span className="text-xs text-white">{uploadProgress}%</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Upload button for mobile */}
      <Button
        size="sm"
        variant="outline"
        className="absolute -bottom-2 left-1/2 -translate-x-1/2"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="h-3 w-3 mr-1" />
        Upload
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
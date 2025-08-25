'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Upload, Image as ImageIcon, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProfileStore } from '@/store/profileStore'
import { validateFile } from '@/lib/supabase/storage'

export default function MobileUploadPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const { validateQRToken, handleQRUpload } = useProfileStore()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Validate token on mount
  useState(() => {
    if (!validateQRToken(token)) {
      setError('Invalid or expired upload link')
    }
  })
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate files
    const validFiles: File[] = []
    const newPreviews: string[] = []
    
    for (const file of files) {
      const validation = validateFile(file, 5)
      if (validation.valid) {
        validFiles.push(file)
        newPreviews.push(URL.createObjectURL(file))
      } else {
        alert(validation.error)
      }
    }
    
    setSelectedFiles([...selectedFiles, ...validFiles])
    setPreviews([...previews, ...newPreviews])
  }
  
  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    
    setIsUploading(true)
    setError(null)
    
    try {
      await handleQRUpload(token, selectedFiles)
      setUploadSuccess(true)
      
      // Clear previews
      previews.forEach(url => URL.revokeObjectURL(url))
      
      // Show success for 2 seconds then redirect
      setTimeout(() => {
        router.push('/success')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }
  
  if (error && !validateQRToken(token)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blox-very-dark-blue via-blox-dark-blue to-blox-very-dark-blue flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-blox-white mb-2">Upload Link Expired</h2>
            <p className="text-blox-off-white">
              This upload link has expired or is invalid. Please generate a new QR code from your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blox-very-dark-blue via-blox-dark-blue to-blox-very-dark-blue flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-blox-white mb-2">Upload Successful!</h2>
            <p className="text-blox-off-white">
              Your images have been uploaded to your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blox-very-dark-blue via-blox-dark-blue to-blox-very-dark-blue p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blox-teal" />
              Upload Images to Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File input area */}
            <div
              className="border-2 border-dashed border-blox-glass-border rounded-lg p-8 text-center hover:border-blox-teal transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-12 w-12 text-blox-medium-blue-gray mx-auto mb-4" />
              <p className="text-blox-white font-medium mb-2">
                Tap to select images
              </p>
              <p className="text-sm text-blox-off-white">
                Or take a photo with your camera
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            {/* Selected images preview */}
            {previews.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-blox-white">
                  Selected Images ({selectedFiles.length})
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
            
            {/* Upload button */}
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'Image' : 'Images'}
                </>
              )}
            </Button>
            
            {/* Info */}
            <p className="text-xs text-blox-medium-blue-gray text-center">
              Images will be added to your Recent Work section
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
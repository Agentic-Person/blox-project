'use client'

import { useState } from 'react'
import { Plus, Grid, Trash2, Move, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProfileStore } from '@/store/profileStore'
import type { ProfileImage } from '@/store/profileStore'

interface RecentWorkGridProps {
  onImageClick?: (image: ProfileImage) => void
  onAddClick?: () => void
}

export function RecentWorkGrid({ onImageClick, onAddClick }: RecentWorkGridProps) {
  const { profile, deleteImage } = useProfileStore()
  const [isEditMode, setIsEditMode] = useState(false)
  
  const recentWork = profile?.recentWork || []
  
  // Fill empty slots for 2x6 grid (12 total)
  const gridSlots = Array(12).fill(null).map((_, index) => {
    return recentWork[index] || null
  })
  
  const handleDelete = async (imageId: string) => {
    if (confirm('Delete this image?')) {
      await deleteImage(imageId)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Grid className="h-5 w-5 text-blox-teal" />
            Recent Work
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditMode(!isEditMode)}
              className={isEditMode ? 'text-blox-teal' : ''}
            >
              {isEditMode ? 'Done' : 'Edit'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddClick}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {gridSlots.map((image, index) => (
            <div
              key={image?.id || `empty-${index}`}
              className="relative aspect-square group"
            >
              {image ? (
                <>
                  <div
                    className="w-full h-full rounded-lg overflow-hidden border border-blox-glass-border hover:border-blox-teal transition-colors cursor-pointer"
                    onClick={() => !isEditMode && onImageClick?.(image)}
                  >
                    <img
                      src={image.thumbnailUrl || image.url}
                      alt={image.title || `Recent work ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Hover overlay */}
                    {!isEditMode && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ExternalLink className="h-6 w-6 text-white" />
                      </div>
                    )}
                    
                    {/* Edit mode controls */}
                    {isEditMode && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:text-red-500"
                          onClick={() => handleDelete(image.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:text-blox-teal cursor-move"
                        >
                          <Move className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Image title */}
                  {image.title && (
                    <p className="text-xs text-blox-off-white mt-1 truncate">
                      {image.title}
                    </p>
                  )}
                </>
              ) : (
                <button
                  className="w-full h-full rounded-lg border-2 border-dashed border-blox-glass-border hover:border-blox-teal/50 transition-colors flex items-center justify-center bg-blox-second-dark-blue/20"
                  onClick={onAddClick}
                >
                  <Plus className="h-6 w-6 text-blox-medium-blue-gray" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-blox-glass-border flex justify-between text-sm text-blox-off-white">
          <span>{recentWork.length} / 12 slots used</span>
          <span className="text-blox-teal">Showcase your latest work</span>
        </div>
      </CardContent>
    </Card>
  )
}
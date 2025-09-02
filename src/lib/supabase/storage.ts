import { supabase } from './client'

// Storage bucket names
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  PORTFOLIO: 'portfolio',
  RECENT_WORK: 'recent-work',
  PRACTICE_WHITEBOARDS: 'practice-whiteboards'
} as const

// Helper to generate unique file names
export const generateFileName = (originalName: string, userId: string): string => {
  const timestamp = Date.now()
  const extension = originalName.split('.').pop()
  const cleanName = originalName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
  return `${userId}/${timestamp}-${cleanName}`
}

// Upload file to Supabase Storage
export const uploadFile = async (
  bucket: string,
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // Mock implementation for development
  if (!supabase || process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true') {
    // Simulate upload progress
    if (onProgress) {
      for (let i = 0; i <= 100; i += 20) {
        onProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    return URL.createObjectURL(file)
  }

  const fileName = generateFileName(file.name, userId)
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return publicUrl
}

// Upload multiple files
export const uploadMultipleFiles = async (
  bucket: string,
  files: File[],
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  const urls: string[] = []
  const totalFiles = files.length
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileProgress = (i / totalFiles) * 100
    
    if (onProgress) {
      onProgress(fileProgress)
    }
    
    const url = await uploadFile(bucket, file, userId)
    urls.push(url)
  }
  
  if (onProgress) {
    onProgress(100)
  }
  
  return urls
}

// Delete file from Supabase Storage
export const deleteFile = async (
  bucket: string,
  filePath: string
): Promise<void> => {
  // Mock implementation for development
  if (!supabase || process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true') {
    await new Promise(resolve => setTimeout(resolve, 500))
    return
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

// Generate a signed URL for temporary access
export const getSignedUrl = async (
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string> => {
  // Mock implementation for development
  if (!supabase || process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true') {
    return filePath // Return the original URL in mock mode
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn)

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }

  return data.signedUrl
}

// List files in a bucket
export const listFiles = async (
  bucket: string,
  folder?: string,
  limit: number = 100
): Promise<any[]> => {
  // Mock implementation for development
  if (!supabase || process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true') {
    return []
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, {
      limit,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`)
  }

  return data || []
}

// Generate thumbnail from image
export const generateThumbnail = async (
  imageUrl: string,
  maxWidth: number = 150,
  maxHeight: number = 150
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve(imageUrl)
        return
      }
      
      // Calculate new dimensions
      let width = img.width
      let height = img.height
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height)
      
      // Convert to data URL
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob))
        } else {
          resolve(imageUrl)
        }
      }, 'image/jpeg', 0.8)
    }
    
    img.onerror = () => {
      resolve(imageUrl)
    }
    
    img.src = imageUrl
  })
}

// Validate file type and size
export const validateFile = (
  file: File,
  maxSizeMB: number = 5,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
): { valid: boolean; error?: string } => {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    }
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`
    }
  }
  
  return { valid: true }
}

// Upload whiteboard image to practice storage
export const uploadWhiteboardImage = async (
  file: Blob,
  userId: string,
  moduleId: string,
  weekId: string,
  dayId: string
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    // Create a unique filename with timestamp
    const timestamp = Date.now()
    const fileName = `${userId}/${moduleId}/${weekId}/${dayId}/whiteboard-${timestamp}.svg`
    
    // Convert blob to file
    const imageFile = new File([file], fileName, { type: file.type })
    
    // Mock implementation for development
    if (!supabase || process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true') {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Return object URL for mock mode
      const url = URL.createObjectURL(file)
      return { url, error: null }
    }

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.PRACTICE_WHITEBOARDS)
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return { url: null, error }
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKETS.PRACTICE_WHITEBOARDS)
      .getPublicUrl(data.path)

    return { url: publicUrlData.publicUrl, error: null }
    
  } catch (error) {
    console.error('Upload service error:', error)
    return { url: null, error: error as Error }
  }
}

// Create storage buckets (run once during setup)
export const createStorageBuckets = async (): Promise<void> => {
  if (!supabase || process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true') {
    console.log('Mock mode: Skipping bucket creation')
    return
  }

  const buckets = Object.values(STORAGE_BUCKETS)
  
  for (const bucketName of buckets) {
    const bucketConfig = {
      public: true,
      allowedMimeTypes: bucketName === STORAGE_BUCKETS.PRACTICE_WHITEBOARDS 
        ? ['image/svg+xml', 'image/png', 'image/jpeg'] 
        : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    }
    
    const { error } = await supabase.storage.createBucket(bucketName, bucketConfig)
    
    if (error && !error.message.includes('already exists')) {
      console.error(`Failed to create bucket ${bucketName}:`, error)
    } else {
      console.log(`Bucket ${bucketName} ready`)
    }
  }
}
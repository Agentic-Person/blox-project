'use client'

import { useEffect, useState } from 'react'

const testVideos = [
  { 
    title: "Roblox Studio 2024 Complete Beginner Guide", 
    youtubeId: "K0lDWlGMK94",
    creator: "TheDevKing"
  },
  { 
    title: "Modern Studio Interface 2024", 
    youtubeId: "OYwWs5s1KYY",
    creator: "AlvinBlox"
  },
  { 
    title: "2024 Beginner Scripting Series Episode 1", 
    youtubeId: "UyO1tWYswHc",
    creator: "ByteBlox"
  }
]

export default function TestVideosPage() {
  const [thumbnailStatus, setThumbnailStatus] = useState<Record<string, string>>({})

  useEffect(() => {
    // Test thumbnail loading
    testVideos.forEach(video => {
      const img = new Image()
      img.onload = () => {
        setThumbnailStatus(prev => ({ ...prev, [video.youtubeId]: 'loaded' }))
      }
      img.onerror = () => {
        setThumbnailStatus(prev => ({ ...prev, [video.youtubeId]: 'failed' }))
      }
      img.src = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`
    })
  }, [])

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">Video Embedding Test Page</h1>
      
      <div className="space-y-8">
        {testVideos.map(video => (
          <div key={video.youtubeId} className="border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">{video.title}</h2>
            <p className="text-gray-400 mb-4">by {video.creator} • ID: {video.youtubeId}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thumbnail Test */}
              <div>
                <h3 className="text-lg font-medium mb-2">Thumbnail Test</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    Status: <span className={thumbnailStatus[video.youtubeId] === 'loaded' ? 'text-green-400' : 'text-red-400'}>
                      {thumbnailStatus[video.youtubeId] || 'loading...'}
                    </span>
                  </p>
                  <img 
                    src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
                    alt={video.title}
                    className="w-full aspect-video bg-gray-800 rounded"
                    onError={(e) => {
                      const img = e.currentTarget
                      if (!img.dataset.fallback) {
                        img.dataset.fallback = '1'
                        img.src = `https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Embed Test */}
              <div>
                <h3 className="text-lg font-medium mb-2">Embed Test</h3>
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}`}
                  className="w-full aspect-video rounded"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            
            {/* URLs */}
            <div className="mt-4 p-4 bg-gray-800 rounded text-sm font-mono">
              <p>Watch URL: <a href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" className="text-blue-400 hover:underline">
                https://www.youtube.com/watch?v={video.youtubeId}
              </a></p>
              <p>Embed URL: https://www.youtube.com/embed/{video.youtubeId}</p>
              <p>Thumbnail: https://i.ytimg.com/vi/{video.youtubeId}/hqdefault.jpg</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
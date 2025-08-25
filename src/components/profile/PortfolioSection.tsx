'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Image as ImageIcon, Globe, Gamepad2 } from 'lucide-react'

interface PortfolioSectionProps {
  portfolioImages: string[]
  personalWebsite?: string
  gameUrl?: string
}

export function PortfolioSection({ portfolioImages, personalWebsite, gameUrl }: PortfolioSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-blox-teal" />
          Portfolio & Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Links */}
        {(personalWebsite || gameUrl) && (
          <div className="space-y-3">
            {personalWebsite && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blox-second-dark-blue/30 border border-blox-glass-border">
                <Globe className="h-5 w-5 text-blox-teal" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blox-white">Personal Website</p>
                  <p className="text-xs text-blox-off-white truncate">{personalWebsite}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(personalWebsite, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Visit
                </Button>
              </div>
            )}
            
            {gameUrl && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blox-second-dark-blue/30 border border-blox-glass-border">
                <Gamepad2 className="h-5 w-5 text-blox-teal" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blox-white">My Game</p>
                  <p className="text-xs text-blox-off-white truncate">{gameUrl}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(gameUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Play
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Images */}
        {portfolioImages.length > 0 ? (
          <div>
            <h4 className="text-sm font-medium text-blox-white mb-3">Portfolio Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {portfolioImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-blox-glass-border hover:border-blox-teal transition-colors cursor-pointer"
                    onClick={() => window.open(image, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                    <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-blox-medium-blue-gray">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No portfolio images yet</p>
            <p className="text-xs">Add some images to showcase your work</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

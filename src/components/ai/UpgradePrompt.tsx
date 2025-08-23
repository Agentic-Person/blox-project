'use client'

import { Sparkles, Check, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface UpgradePromptProps {
  onUpgrade?: () => void
  onDismiss?: () => void
}

export function UpgradePrompt({ onUpgrade, onDismiss }: UpgradePromptProps) {
  const features = [
    'Unlimited AI questions and assistance',
    'Advanced code debugging and optimization',
    'Personalized learning recommendations',
    'Priority response time',
    'Access to exclusive AI features',
    'Custom project guidance',
  ]

  return (
    <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Upgrade to Premium AI
          </CardTitle>
          {onDismiss && (
            <Button
              onClick={onDismiss}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription className="text-blox-off-white">
          Unlock the full power of Blox Chat Wizard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-yellow-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-yellow-500">500 BLOX</p>
                <p className="text-xs text-blox-off-white">One-time payment</p>
              </div>
              <div className="text-right">
                <p className="text-sm line-through text-blox-off-white/50">1000 BLOX</p>
                <p className="text-xs text-green-500">50% OFF</p>
              </div>
            </div>

            <Button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>

            <p className="text-xs text-center text-blox-off-white/50 mt-2">
              Cancel anytime • Instant activation
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
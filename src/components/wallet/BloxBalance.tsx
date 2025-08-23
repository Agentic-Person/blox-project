'use client'

import { useState, useEffect } from 'react'
import { Coins, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWallet } from '@/lib/providers'

export function BloxBalance() {
  const { connected } = useWallet()
  const [balance, setBalance] = useState(0)
  const [change, setChange] = useState(0)

  useEffect(() => {
    if (connected) {
      // Simulate fetching balance
      setBalance(1000)
      setChange(5.2)
    } else {
      setBalance(0)
      setChange(0)
    }
  }, [connected])

  return (
    <Card className="bg-blox-black-blue/50 border-blox-teal/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-blox-teal" />
          BLOX Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-3xl font-bold gradient-text">{balance.toLocaleString()}</p>
          <div className="flex items-center gap-2">
            {change > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">+{change}%</span>
              </>
            ) : change < 0 ? (
              <>
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">{change}%</span>
              </>
            ) : (
              <span className="text-sm text-blox-off-white">No change</span>
            )}
            <span className="text-xs text-blox-off-white">24h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
'use client'

import { Wallet, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/lib/providers'

export function WalletConnect() {
  const { connected, connecting, connect, disconnect, publicKey } = useWallet()

  if (connected) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-xs text-green-500">Connected</p>
          <p className="text-xs font-mono">
            {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
          </p>
        </div>
        <Button
          onClick={disconnect}
          size="sm"
          variant="ghost"
          className="text-red-500 hover:bg-red-500/10"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={connect}
      disabled={connecting}
      className="bg-gradient-to-r from-purple-500 to-pink-500"
    >
      <Wallet className="h-4 w-4 mr-2" />
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  )
}
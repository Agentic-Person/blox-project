'use client'

import { useState } from 'react'
import { Wallet, Coins, ArrowUpRight, ArrowDownLeft, Trophy, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/lib/providers'

export default function WalletPage() {
  const { connected, connecting, connect, disconnect, publicKey } = useWallet()
  const [activeTab, setActiveTab] = useState<'balance' | 'earn' | 'history'>('balance')

  // Mock data for demonstration
  const balance = connected ? 1000 : 0
  const transactions = [
    { id: 1, type: 'earned', amount: 50, description: 'Completed Module 1', date: '2024-01-15' },
    { id: 2, type: 'earned', amount: 25, description: 'Daily Login Streak', date: '2024-01-14' },
    { id: 3, type: 'spent', amount: 100, description: 'Premium AI Assistant', date: '2024-01-13' },
  ]

  const earnOpportunities = [
    { id: 1, title: 'Complete Module 2', reward: 75, icon: Trophy },
    { id: 2, title: '7-Day Streak', reward: 30, icon: Zap },
    { id: 3, title: 'Help a Team Member', reward: 15, icon: Trophy },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">BLOX Wallet</h1>
        <p className="text-blox-off-white mt-2">
          Manage your BLOX tokens and track your rewards
        </p>
      </div>

      {/* Wallet Connection */}
      <Card className="bg-blox-black-blue/50 border-blox-teal/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blox-teal" />
            Wallet Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blox-off-white">Connected</p>
                  <p className="font-mono text-xs text-blox-teal">
                    {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
                  </p>
                </div>
                <Button
                  onClick={disconnect}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-blox-off-white mb-4">
                Connect your wallet to manage BLOX tokens
              </p>
              <Button
                onClick={connect}
                disabled={connecting}
                className="bg-gradient-to-r from-blox-teal to-blox-teal-dark"
              >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {connected && (
        <>
          {/* Tabs */}
          <div className="flex gap-2">
            {(['balance', 'earn', 'history'] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? 'bg-blox-teal' : ''}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'balance' && (
            <Card className="bg-blox-black-blue/50 border-blox-teal/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-blox-teal" />
                  BLOX Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-5xl font-bold gradient-text">{balance}</p>
                  <p className="text-blox-off-white mt-2">BLOX Tokens</p>
                  <div className="flex gap-4 justify-center mt-6">
                    <Button className="bg-gradient-to-r from-blox-teal to-blox-teal-dark">
                      Send BLOX
                    </Button>
                    <Button variant="outline">Receive BLOX</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'earn' && (
            <div className="space-y-4">
              {earnOpportunities.map((opportunity) => {
                const Icon = opportunity.icon
                return (
                  <Card key={opportunity.id} className="bg-blox-black-blue/50 border-blox-teal/20">
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blox-teal/10 rounded-lg">
                          <Icon className="h-6 w-6 text-blox-teal" />
                        </div>
                        <div>
                          <p className="font-semibold">{opportunity.title}</p>
                          <p className="text-sm text-blox-off-white">
                            Earn {opportunity.reward} BLOX
                          </p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-blox-teal to-blox-teal-dark">
                        Start
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {activeTab === 'history' && (
            <Card className="bg-blox-black-blue/50 border-blox-teal/20">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-blox-teal/10">
                      <div className="flex items-center gap-3">
                        {tx.type === 'earned' ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-blox-off-white">{tx.date}</p>
                        </div>
                      </div>
                      <p className={`font-semibold ${tx.type === 'earned' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'earned' ? '+' : '-'}{tx.amount} BLOX
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
'use client'

import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Transaction {
  id: string
  type: 'sent' | 'received' | 'earned' | 'spent'
  amount: number
  description: string
  timestamp: Date
  status: 'completed' | 'pending' | 'failed'
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'earned',
    amount: 50,
    description: 'Completed Module 1',
    timestamp: new Date('2024-01-15T10:30:00'),
    status: 'completed',
  },
  {
    id: '2',
    type: 'earned',
    amount: 25,
    description: 'Daily Login Streak',
    timestamp: new Date('2024-01-14T09:00:00'),
    status: 'completed',
  },
  {
    id: '3',
    type: 'spent',
    amount: 100,
    description: 'Premium AI Assistant',
    timestamp: new Date('2024-01-13T14:20:00'),
    status: 'completed',
  },
  {
    id: '4',
    type: 'received',
    amount: 200,
    description: 'Team Project Reward',
    timestamp: new Date('2024-01-12T16:45:00'),
    status: 'pending',
  },
]

export function TransactionHistory() {
  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'sent':
      case 'spent':
        return <ArrowUpRight className="h-5 w-5 text-red-500" />
      case 'received':
      case 'earned':
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />
    }
  }

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500'
      case 'pending':
        return 'text-yellow-500'
      case 'failed':
        return 'text-red-500'
    }
  }

  const formatAmount = (type: Transaction['type'], amount: number) => {
    const sign = type === 'sent' || type === 'spent' ? '-' : '+'
    const color = type === 'sent' || type === 'spent' ? 'text-red-500' : 'text-green-500'
    return <span className={`font-semibold ${color}`}>{sign}{amount} BLOX</span>
  }

  return (
    <Card className="bg-blox-black-blue/50 border-blox-teal/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blox-teal" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg bg-blox-second-dark-blue/30 hover:bg-blox-second-dark-blue/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getIcon(transaction.type)}
                <div>
                  <p className="font-medium text-sm">{transaction.description}</p>
                  <div className="flex items-center gap-2 text-xs text-blox-off-white">
                    <span>{transaction.timestamp.toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
              {formatAmount(transaction.type, transaction.amount)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
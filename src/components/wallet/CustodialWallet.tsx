'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, ArrowRight, Wallet, Info, Check, AlertCircle } from 'lucide-react'
import { useWalletStore } from '@/store/walletStore'
import toast from 'react-hot-toast'

interface CustodialWalletProps {
  onSuccess?: () => void
}

export default function CustodialWallet({ onSuccess }: CustodialWalletProps) {
  const { initializeCustodialWallet, isLoading } = useWalletStore()
  const [step, setStep] = useState<'intro' | 'creating' | 'success'>('intro')

  const handleCreateWallet = async () => {
    setStep('creating')
    
    try {
      await initializeCustodialWallet()
      setStep('success')
      toast.success('Wallet created successfully! You received 10 BLOX welcome bonus!')
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.()
      }, 2000)
    } catch (error) {
      console.error('Error creating wallet:', error)
      toast.error('Failed to create wallet. Please try again.')
      setStep('intro')
    }
  }

  if (step === 'intro') {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Managed Wallet (Recommended)
          </h3>
          <p className="text-gray-400 text-sm">
            Let Blox Buddy manage your wallet securely. Perfect for beginners!
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium">No Setup Required</p>
              <p className="text-xs text-gray-500">Start earning BLOX immediately</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium">Secure & Safe</p>
              <p className="text-xs text-gray-500">Protected by Supabase encryption</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium">10 BLOX Welcome Bonus</p>
              <p className="text-xs text-gray-500">Get started with free tokens!</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm text-white font-medium">Export Anytime</p>
              <p className="text-xs text-gray-500">Move to external wallet when ready</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateWallet}
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Wallet className="w-5 h-5" />
          Create Managed Wallet
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5" />
            <p className="text-xs text-blue-300">
              Your wallet is fully managed by Blox Buddy. You can export it to a personal wallet like Phantom at any time. No crypto knowledge required!
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'creating') {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Wallet className="w-8 h-8 text-white animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Creating Your Wallet...
          </h3>
          <p className="text-gray-400 text-sm">
            Setting up your secure managed wallet
          </p>
        </div>

        <div className="space-y-3">
          {[
            'Generating wallet address',
            'Securing with encryption',
            'Adding welcome bonus',
            'Finalizing setup'
          ].map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <p className="text-sm text-gray-300">{step}...</p>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-6 space-y-6"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4"
          >
            <Check className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">
            Wallet Created Successfully!
          </h3>
          <p className="text-gray-400 text-sm">
            You received 10 BLOX as a welcome bonus!
          </p>
        </div>

        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Your Balance</span>
            <span className="text-2xl font-bold text-green-400">10 BLOX</span>
          </div>
          <p className="text-xs text-gray-500">
            Start learning to earn more BLOX tokens!
          </p>
        </div>
      </motion.div>
    )
  }

  return null
}
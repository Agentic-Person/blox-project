'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, Shield, Info, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import CustodialWallet from './CustodialWallet'
import { useWalletStore } from '@/store/walletStore'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: () => Promise<void>
}

const wallets = [
  {
    name: 'Phantom',
    icon: '/images/wallets/phantom.png',
    url: 'https://phantom.app/',
    description: 'Most popular Solana wallet',
    color: 'from-purple-500 to-purple-600'
  },
  {
    name: 'Solflare',
    icon: '/images/wallets/solflare.png',
    url: 'https://solflare.com/',
    description: 'Secure & powerful wallet',
    color: 'from-orange-500 to-orange-600'
  },
  {
    name: 'Backpack',
    icon: '/images/wallets/backpack.png',
    url: 'https://backpack.app/',
    description: 'Next-gen crypto wallet',
    color: 'from-green-500 to-green-600'
  },
  {
    name: 'Dev Wallet',
    icon: '/images/wallets/dev.png',
    url: '#',
    description: 'Mock wallet for testing',
    color: 'from-blox-teal to-blox-purple',
    isDev: true
  }
]

export function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  const [view, setView] = useState<'choice' | 'custodial' | 'external'>('choice')
  const { initializeCustodialWallet } = useWalletStore()
  
  const handleWalletSelect = async (wallet: typeof wallets[0]) => {
    if (wallet.isDev) {
      // Use mock wallet for development
      await onConnect()
      onClose()
    } else {
      // Check if wallet is installed
      const isInstalled = (window as any)[wallet.name.toLowerCase()]
      if (isInstalled) {
        await onConnect()
        onClose()
      } else {
        // Open wallet website to install
        window.open(wallet.url, '_blank')
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-blox-second-dark-blue border border-blox-glass-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-blox-glass-border">
                <div className="flex items-center gap-3">
                  {view !== 'choice' && (
                    <button
                      onClick={() => setView('choice')}
                      className="p-2 hover:bg-blox-glass-bg rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-blox-medium-blue-gray" />
                    </button>
                  )}
                  <div className="w-10 h-10 bg-gradient-to-br from-blox-teal to-blox-purple rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-blox-white">
                      {view === 'choice' && 'Connect Wallet'}
                      {view === 'custodial' && 'Managed Wallet'}
                      {view === 'external' && 'External Wallet'}
                    </h2>
                    <p className="text-xs text-blox-medium-blue-gray">
                      {view === 'choice' && 'Choose your wallet type'}
                      {view === 'custodial' && 'Let us manage your wallet'}
                      {view === 'external' && 'Connect your own wallet'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-blox-glass-bg rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-blox-medium-blue-gray" />
                </button>
              </div>

              {/* Choice View */}
              {view === 'choice' && (
                <>
                  <div className="p-6 space-y-4">
                    {/* Custodial Wallet Option */}
                    <button
                      onClick={() => setView('custodial')}
                      className="w-full p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-700/30 rounded-lg hover:border-purple-600/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blox-white group-hover:text-purple-400 transition-colors">
                              Managed Wallet
                            </span>
                            <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded">
                              RECOMMENDED
                            </span>
                          </div>
                          <p className="text-xs text-blox-medium-blue-gray">
                            No setup required • 10 BLOX bonus • Perfect for beginners
                          </p>
                        </div>
                        <div className="text-blox-medium-blue-gray group-hover:text-purple-400 transition-colors">
                          →
                        </div>
                      </div>
                    </button>

                    {/* External Wallet Option */}
                    <button
                      onClick={() => setView('external')}
                      className="w-full p-4 bg-blox-glass-bg border border-blox-glass-border rounded-lg hover:border-blox-teal/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blox-teal to-blox-purple rounded-lg flex items-center justify-center">
                          <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blox-white group-hover:text-blox-teal transition-colors">
                              External Wallet
                            </span>
                            <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded">
                              ADVANCED
                            </span>
                          </div>
                          <p className="text-xs text-blox-medium-blue-gray">
                            Connect Phantom, Solflare, or other Solana wallets
                          </p>
                        </div>
                        <div className="text-blox-medium-blue-gray group-hover:text-blox-teal transition-colors">
                          →
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Info Section for Choice */}
                  <div className="p-6 border-t border-blox-glass-border bg-blox-glass-bg/50">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blox-purple mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-blox-white mb-1">
                          Which should I choose?
                        </h3>
                        <p className="text-xs text-blox-medium-blue-gray">
                          If you're new to crypto, choose <span className="text-purple-400">Managed Wallet</span> for instant setup. 
                          You can always export to an external wallet later!
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Custodial View */}
              {view === 'custodial' && (
                <CustodialWallet onSuccess={onClose} />
              )}

              {/* External Wallet List */}
              {view === 'external' && (
                <>
                  <div className="p-6 space-y-3">
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.name}
                        onClick={() => handleWalletSelect(wallet)}
                        className="w-full p-4 bg-blox-glass-bg border border-blox-glass-border rounded-lg hover:border-blox-teal/50 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${wallet.color} rounded-lg flex items-center justify-center`}>
                            <Wallet className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blox-white group-hover:text-blox-teal transition-colors">
                                {wallet.name}
                              </span>
                              {wallet.isDev && (
                                <span className="px-2 py-0.5 bg-blox-purple/20 text-blox-purple text-xs rounded">
                                  DEV
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-blox-medium-blue-gray">
                              {wallet.description}
                            </p>
                          </div>
                          <div className="text-blox-medium-blue-gray group-hover:text-blox-teal transition-colors">
                            →
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Info Section for External */}
                  <div className="p-6 border-t border-blox-glass-border bg-blox-glass-bg/50">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blox-teal mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-blox-white mb-1">
                          Secure Connection
                        </h3>
                        <p className="text-xs text-blox-medium-blue-gray">
                          Your wallet connection is secure and encrypted. We never have access to your private keys.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
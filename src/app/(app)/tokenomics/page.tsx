'use client'

import { motion } from 'framer-motion'
import { 
  Zap, TrendingUp, Gift, Trophy, Target, Sparkles,
  Wallet, Shield, Info, ChevronRight, Clock, Users,
  Video, BookOpen, Code, Rocket, Star, Award
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fadeInUp, staggerChildren } from '@/styles/animations'
import Link from 'next/link'

const earningMethods = [
  {
    icon: Video,
    title: 'Watch Videos',
    xp: '10-50 XP',
    blox: '0.1-0.5',
    description: 'Earn XP for every educational video you complete',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: BookOpen,
    title: 'Complete Modules',
    xp: '3000 XP',
    blox: '30 + 10 bonus',
    description: 'Major rewards for finishing entire learning modules',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Trophy,
    title: 'Daily Streak',
    xp: '50 XP/day',
    blox: '0.5 + bonuses',
    description: 'Build streaks for increasing rewards',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: Users,
    title: 'Help Others',
    xp: '150 XP',
    blox: '1.5',
    description: 'Get rewarded for helping teammates',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Code,
    title: 'Submit Projects',
    xp: '1500 XP',
    blox: '15',
    description: 'Showcase your work and earn big rewards',
    color: 'from-teal-500 to-teal-600'
  },
  {
    icon: Rocket,
    title: 'Challenges',
    xp: '500+ XP',
    blox: '5+',
    description: 'Complete weekly challenges for bonus tokens',
    color: 'from-pink-500 to-pink-600'
  }
]

const spendingOptions = [
  {
    icon: Sparkles,
    title: 'AI Chat Assistant',
    cost: '10 BLOX/day',
    description: 'Get help from our AI learning assistant',
    available: true
  },
  {
    icon: Award,
    title: 'NFT Certificates',
    cost: '100 BLOX',
    description: 'Mint your achievements as NFTs',
    available: false
  },
  {
    icon: Star,
    title: 'Premium Features',
    cost: '150 BLOX/month',
    description: 'Access advanced analytics and tools',
    available: false
  },
  {
    icon: Code,
    title: 'Code Assistant',
    cost: '1-5 BLOX/query',
    description: 'Future AI code helper (Coming Soon)',
    available: false
  }
]

const tiers = [
  { name: 'Bronze', min: 0, max: 100, color: 'text-orange-600', icon: '🥉' },
  { name: 'Silver', min: 100, max: 500, color: 'text-gray-400', icon: '🥈' },
  { name: 'Gold', min: 500, max: 2000, color: 'text-yellow-500', icon: '🥇' },
  { name: 'Platinum', min: 2000, max: 10000, color: 'text-cyan-400', icon: '💎' },
  { name: 'Diamond', min: 10000, max: 50000, color: 'text-blue-400', icon: '💠' },
  { name: 'Master', min: 50000, max: null, color: 'text-purple-500', icon: '👑' }
]

export default function TokenomicsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section 
        className="relative py-20 px-6 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blox-teal/10 via-transparent to-blox-purple/10" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blox-glass-bg border border-blox-teal/30 rounded-full mb-6"
          >
            <Zap className="w-4 h-4 text-blox-teal" />
            <span className="text-sm text-blox-teal font-medium">Powered by Solana</span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-6xl font-bold text-blox-white mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Your Learning,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blox-teal to-blox-purple">
              Your Rewards
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-blox-off-white mb-8 max-w-2xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Earn BLOX tokens for every step of your Roblox development journey. 
            Learn, build, and get rewarded on the blockchain.
          </motion.p>
          
          <motion.div 
            className="flex gap-4 justify-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-blox-teal to-blox-purple text-white rounded-lg font-medium hover:shadow-teal-glow transition-all duration-200"
            >
              Start Earning
            </Link>
            <a
              href="#how-it-works"
              className="px-6 py-3 bg-blox-glass-bg border border-blox-glass-border text-blox-white rounded-lg font-medium hover:bg-blox-second-dark-blue transition-all duration-200"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-blox-white mb-4">How It Works</h2>
            <p className="text-blox-off-white">Simple conversion: 100 XP = 1 BLOX Token</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blox-teal to-blox-purple rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-blox-white mb-2">1. Learn & Practice</h3>
              <p className="text-sm text-blox-off-white">
                Watch videos, complete modules, and build projects
              </p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blox-purple to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-blox-white mb-2">2. Earn XP & BLOX</h3>
              <p className="text-sm text-blox-off-white">
                Automatically convert your XP into BLOX tokens
              </p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blox-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-blox-white mb-2">3. Unlock Features</h3>
              <p className="text-sm text-blox-off-white">
                Use BLOX tokens to access premium features and tools
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Earning Methods */}
      <section className="py-16 px-6 bg-blox-second-dark-blue/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-blox-white mb-4">Ways to Earn BLOX</h2>
            <p className="text-blox-off-white">Multiple paths to grow your token balance</p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {earningMethods.map((method, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="card-hover h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${method.color} rounded-xl flex items-center justify-center`}>
                        <method.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-blox-white">{method.title}</CardTitle>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-blox-medium-blue-gray">{method.xp}</span>
                          <span className="text-xs text-blox-teal font-semibold">{method.blox} BLOX</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blox-off-white">{method.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Token Utility */}
      <section id="spending" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-blox-white mb-4">Use Your BLOX Tokens</h2>
            <p className="text-blox-off-white">Unlock features and enhance your learning experience</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {spendingOptions.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`card-hover ${!option.available && 'opacity-60'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blox-glass-bg rounded-xl flex items-center justify-center flex-shrink-0">
                        <option.icon className="w-6 h-6 text-blox-teal" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-blox-white">{option.title}</h3>
                          {!option.available && (
                            <span className="px-2 py-0.5 bg-blox-purple/20 text-blox-purple text-xs rounded">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-blox-off-white mb-2">{option.description}</p>
                        <p className="text-sm font-semibold text-blox-teal">{option.cost}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier System */}
      <section className="py-16 px-6 bg-blox-second-dark-blue/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-blox-white mb-4">Tier System</h2>
            <p className="text-blox-off-white">Progress through tiers as you earn more BLOX</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tier.icon}</span>
                        <div>
                          <h4 className={`font-semibold ${tier.color}`}>{tier.name}</h4>
                          <p className="text-xs text-blox-medium-blue-gray">
                            {tier.min} - {tier.max || '∞'} BLOX
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Wallet Setup */}
      <section id="wallet-setup" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-blox-white mb-4">Wallet Setup Guide</h2>
            <p className="text-blox-off-white">Get started with your Solana wallet in minutes</p>
          </motion.div>

          <Card className="card-hover">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blox-teal/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blox-teal font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blox-white mb-2">Choose a Wallet</h3>
                  <p className="text-sm text-blox-off-white mb-3">
                    We recommend Phantom, Solflare, or Backpack for the best experience.
                  </p>
                  <div className="flex gap-2">
                    <a href="https://phantom.app" target="_blank" className="text-blox-teal text-sm hover:underline">
                      Phantom →
                    </a>
                    <a href="https://solflare.com" target="_blank" className="text-blox-teal text-sm hover:underline">
                      Solflare →
                    </a>
                    <a href="https://backpack.app" target="_blank" className="text-blox-teal text-sm hover:underline">
                      Backpack →
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blox-purple/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blox-purple font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blox-white mb-2">Install & Create</h3>
                  <p className="text-sm text-blox-off-white">
                    Download the browser extension or mobile app. Follow the setup wizard to create your wallet. 
                    Make sure to save your recovery phrase in a safe place!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-500 font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blox-white mb-2">Connect to Blox Buddy</h3>
                  <p className="text-sm text-blox-off-white">
                    Click the "Connect Wallet" button in the header and select your wallet. 
                    Approve the connection and you're ready to start earning!
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blox-glass-bg rounded-lg border border-blox-glass-border">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blox-teal mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blox-white mb-1">Security Tips</h4>
                    <ul className="text-xs text-blox-off-white space-y-1">
                      <li>• Never share your recovery phrase with anyone</li>
                      <li>• Always verify the website URL before connecting</li>
                      <li>• Use a hardware wallet for large balances</li>
                      <li>• Enable 2FA where available</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-blox-second-dark-blue/30">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-blox-white mb-4">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-4">
            <Card className="card-hover">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-blox-white mb-2">
                  What blockchain are BLOX tokens on?
                </h3>
                <p className="text-sm text-blox-off-white">
                  BLOX tokens are built on the Solana blockchain, chosen for its speed, 
                  low transaction costs, and environmental efficiency.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-blox-white mb-2">
                  Can I trade BLOX tokens?
                </h3>
                <p className="text-sm text-blox-off-white">
                  Currently, BLOX tokens are utility tokens used within the Blox Buddy ecosystem. 
                  Trading functionality may be added in the future.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-blox-white mb-2">
                  Do I need cryptocurrency to start?
                </h3>
                <p className="text-sm text-blox-off-white">
                  No! You can start earning BLOX tokens immediately by learning. 
                  A wallet is only needed when you want to claim your tokens.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-blox-white mb-2">
                  Is this safe for young learners?
                </h3>
                <p className="text-sm text-blox-off-white">
                  Yes! BLOX tokens are earned through learning and can only be spent on 
                  educational features within our platform. Parents can help set up wallets 
                  for users under 13.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blox-teal/10 to-blox-purple/10 rounded-2xl p-12 border border-blox-glass-border"
          >
            <h2 className="text-3xl font-bold text-blox-white mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-lg text-blox-off-white mb-8">
              Join thousands of learners already earning BLOX tokens for their progress.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-gradient-to-r from-blox-teal to-blox-purple text-white rounded-lg font-medium hover:shadow-teal-glow transition-all duration-200"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/learning"
                className="px-6 py-3 bg-blox-glass-bg border border-blox-glass-border text-blox-white rounded-lg font-medium hover:bg-blox-second-dark-blue transition-all duration-200"
              >
                Start Learning
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
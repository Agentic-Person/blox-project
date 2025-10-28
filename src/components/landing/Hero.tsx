'use client'

import { motion } from 'framer-motion'
import { Bot, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blox-teal/10 via-transparent to-blox-purple/10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blox-teal/20 to-blox-purple/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-blox-purple/30 to-blox-teal/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative max-w-6xl mx-auto text-center">
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            duration: 0.8
          }}
          className="inline-flex items-center justify-center w-24 h-24 mb-8 bg-gradient-to-br from-blox-teal/20 to-blox-purple/20 rounded-3xl border border-blox-teal/30"
        >
          <Bot className="w-12 h-12 text-blox-teal" />
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6"
        >
          <span className="bg-gradient-to-r from-blox-teal via-blox-teal-light to-blox-purple bg-clip-text text-transparent">
            BLOX BUDDY
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl md:text-2xl lg:text-3xl text-blox-off-white mb-4 max-w-3xl mx-auto"
        >
          Free learning and community platform for young Roblox developers
        </motion.p>

        {/* Sub-tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex items-center justify-center gap-2 text-blox-teal mb-12"
        >
          <Sparkles className="w-5 h-5" />
          <p className="text-lg md:text-xl font-medium">
            AI-powered learning • Team collaboration • 6-month journey
          </p>
          <Sparkles className="w-5 h-5" />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blox-teal to-blox-teal-dark hover:from-blox-teal-dark hover:to-blox-teal
                px-8 py-6 text-xl font-semibold text-white border-0 hover:scale-105 transition-all duration-300 shadow-lg shadow-blox-teal/25"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>

          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-blox-teal/50 text-blox-teal hover:bg-blox-teal/10 hover:border-blox-teal
                px-8 py-6 text-xl font-semibold hover:scale-105 transition-all duration-300"
            >
              Sign In
            </Button>
          </Link>
        </motion.div>

        {/* Trust Badge */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-8 text-sm text-blox-off-white/60"
        >
          Join thousands of young developers learning Roblox development
        </motion.p>
      </div>
    </section>
  )
}

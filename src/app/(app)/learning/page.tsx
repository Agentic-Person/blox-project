'use client'

import { CurriculumBrowser } from '@/components/learning/CurriculumBrowser'
import { motion } from 'framer-motion'

export default function LearningPage() {
  return (
    <motion.div 
      className="h-full px-4 md:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <CurriculumBrowser className="h-full" />
    </motion.div>
  )
}
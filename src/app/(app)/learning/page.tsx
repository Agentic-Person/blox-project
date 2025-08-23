'use client'

import { CurriculumBrowser } from '@/components/learning/CurriculumBrowser'
import { motion } from 'framer-motion'

export default function LearningPage() {
  return (
    <motion.div 
      className="h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <CurriculumBrowser className="h-full" />
    </motion.div>
  )
}
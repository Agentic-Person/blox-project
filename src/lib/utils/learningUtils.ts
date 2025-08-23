import { CheckCircle, PlayCircle, Lock } from 'lucide-react'

/**
 * Toggle an item in an array (expand/collapse functionality)
 */
export const toggleExpanded = (
  itemId: string, 
  expandedItems: string[], 
  setExpandedItems: (items: string[]) => void
) => {
  if (expandedItems.includes(itemId)) {
    setExpandedItems(expandedItems.filter(id => id !== itemId))
  } else {
    setExpandedItems([...expandedItems, itemId])
  }
}

/**
 * Get the appropriate completion icon for a lesson
 */
export const getCompletionIcon = (dayId: string, completedLessons: string[] = []) => {
  if (completedLessons.includes(dayId)) {
    return CheckCircle
  }
  
  // Check if lesson is locked (you can implement your own logic here)
  // For now, we'll assume lessons are not locked
  return PlayCircle
}

/**
 * Calculate progress percentage for a collection of items
 */
export const calculateProgress = (
  totalItems: number,
  completedItems: number
): number => {
  if (totalItems === 0) return 0
  return Math.round((completedItems / totalItems) * 100)
}

/**
 * Check if a lesson/module is locked based on prerequisites
 */
export const isLessonLocked = (
  lessonId: string,
  prerequisiteId?: string,
  completedLessons: string[] = []
): boolean => {
  if (!prerequisiteId) return false
  return !completedLessons.includes(prerequisiteId)
}

/**
 * Get lesson status (completed, in-progress, locked, available)
 */
export const getLessonStatus = (
  lessonId: string,
  completedLessons: string[] = [],
  prerequisiteId?: string
) => {
  if (prerequisiteId && !completedLessons.includes(prerequisiteId)) {
    return 'locked'
  }
  
  if (completedLessons.includes(lessonId)) {
    return 'completed'
  }
  
  return 'available'
}
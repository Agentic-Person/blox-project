/**
 * AI Usage Service
 * Handles rate limiting for AI Wizard questions
 *
 * Rate Limits:
 * - Free users: 3 questions per day
 * - Premium users: 10 questions per day (hard cap)
 */

import { supabase } from '@/lib/supabase/client'

export interface UserAIUsage {
  questionCount: number
  dailyLimit: number
  remainingQuestions: number
  isPremium: boolean
  date: string
}

export interface UsageIncrementResult {
  success: boolean
  newCount: number
  remaining: number
  message: string
}

/**
 * Get user's current AI usage for today
 * @param userId - User ID from auth
 * @returns Usage information including limits and remaining questions
 */
export async function getUserDailyUsage(userId: string): Promise<UserAIUsage | null> {
  try {
    

    const { data, error } = await supabase
      .rpc('get_user_ai_usage', { p_user_id: userId })
      .single()

    if (error) {
      console.error('[AI Usage Service] Error fetching usage:', error)
      return null
    }

    return {
      questionCount: data.question_count || 0,
      dailyLimit: data.daily_limit || 3,
      remainingQuestions: data.remaining_questions || 0,
      isPremium: data.is_premium || false,
      date: data.date
    }
  } catch (error) {
    console.error('[AI Usage Service] Unexpected error fetching usage:', error)
    return null
  }
}

/**
 * Increment user's AI usage count (call after successful AI response)
 * @param userId - User ID from auth
 * @returns Result of increment operation
 */
export async function incrementUsage(userId: string): Promise<UsageIncrementResult | null> {
  try {
    

    const { data, error } = await supabase
      .rpc('increment_ai_usage', { p_user_id: userId })
      .single()

    if (error) {
      console.error('[AI Usage Service] Error incrementing usage:', error)
      return null
    }

    return {
      success: data.success || false,
      newCount: data.new_count || 0,
      remaining: data.remaining || 0,
      message: data.message || ''
    }
  } catch (error) {
    console.error('[AI Usage Service] Unexpected error incrementing usage:', error)
    return null
  }
}

/**
 * Check if user is premium (has unlimited or higher limits)
 * @param userId - User ID from auth
 * @returns True if user is premium
 */
export async function isUserPremium(userId: string): Promise<boolean> {
  try {
    

    const { data, error } = await supabase
      .from('user_profiles')
      .select('data')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[AI Usage Service] Error checking premium status:', error)
      return false
    }

    // Cast to any to access nested JSON properties
    const profileData = data?.data as Record<string, unknown> | undefined
    return profileData?.isPremium === true
  } catch (error) {
    console.error('[AI Usage Service] Unexpected error checking premium status:', error)
    return false
  }
}

/**
 * Check if user can ask another question (doesn't increment count)
 * @param userId - User ID from auth
 * @returns True if user has remaining questions
 */
export async function canUserAskQuestion(userId: string): Promise<{
  allowed: boolean
  reason?: string
  remainingQuestions?: number
  isPremium?: boolean
}> {
  const usage = await getUserDailyUsage(userId)

  if (!usage) {
    return {
      allowed: false,
      reason: 'Unable to fetch usage data. Please try again.'
    }
  }

  if (usage.remainingQuestions <= 0) {
    return {
      allowed: false,
      reason: usage.isPremium
        ? 'Daily limit reached (10/10). Try again tomorrow!'
        : 'Daily limit reached (3/3). Upgrade to Premium for more questions!',
      remainingQuestions: 0,
      isPremium: usage.isPremium
    }
  }

  return {
    allowed: true,
    remainingQuestions: usage.remainingQuestions,
    isPremium: usage.isPremium
  }
}

/**
 * Get formatted usage status message for UI display
 * @param userId - User ID from auth
 * @returns Formatted message string
 */
export async function getUsageStatusMessage(userId: string): Promise<string> {
  const usage = await getUserDailyUsage(userId)

  if (!usage) {
    return 'Unable to load usage information'
  }

  const { questionCount, dailyLimit, remainingQuestions, isPremium } = usage

  if (isPremium) {
    return `${remainingQuestions} of ${dailyLimit} premium questions remaining today`
  } else {
    return `${remainingQuestions} of ${dailyLimit} free questions remaining today`
  }
}

/**
 * Reset usage for a specific user (admin function)
 * @param userId - User ID to reset
 * @returns True if successful
 */
export async function resetUserUsage(userId: string): Promise<boolean> {
  try {
    

    const { error } = await supabase
      .from('user_ai_usage')
      .delete()
      .eq('user_id', userId)
      .eq('date', new Date().toISOString().split('T')[0])

    if (error) {
      console.error('[AI Usage Service] Error resetting usage:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[AI Usage Service] Unexpected error resetting usage:', error)
    return false
  }
}

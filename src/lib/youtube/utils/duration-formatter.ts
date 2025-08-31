/**
 * YouTube duration formatting utilities
 * Converts ISO 8601 duration format (PT39M33S) to readable format (39:33)
 */

export interface ParsedDuration {
  hours: number
  minutes: number
  seconds: number
  totalMinutes: number
  totalSeconds: number
}

/**
 * Parse ISO 8601 duration string (PT39M33S) into components
 */
export function parseIsoDuration(duration: string): ParsedDuration {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) {
    return { hours: 0, minutes: 0, seconds: 0, totalMinutes: 0, totalSeconds: 0 }
  }
  
  const hours = parseInt(match[1]) || 0
  const minutes = parseInt(match[2]) || 0
  const seconds = parseInt(match[3]) || 0
  
  return {
    hours,
    minutes,
    seconds,
    totalMinutes: hours * 60 + minutes,
    totalSeconds: hours * 3600 + minutes * 60 + seconds
  }
}

/**
 * Format ISO 8601 duration to readable format (MM:SS or HH:MM:SS)
 */
export function formatDuration(duration: string): string {
  const { hours, minutes, seconds } = parseIsoDuration(duration)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

/**
 * Format seconds to readable duration (MM:SS or HH:MM:SS)
 */
export function formatSecondsAsDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

/**
 * Calculate total minutes from ISO 8601 duration, rounding seconds appropriately
 */
export function durationToMinutes(duration: string): number {
  const { totalMinutes, seconds } = parseIsoDuration(duration)
  // Round up if more than 30 seconds
  return totalMinutes + (seconds > 30 ? 1 : 0)
}

/**
 * Convert minutes to hour/minute display
 */
export function formatMinutesAsTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}
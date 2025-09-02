// YouTube utilities for handling video IDs and thumbnails

/**
 * Validates if a YouTube ID is real and not a placeholder
 */
export function isValidYouTubeId(id: string): boolean {
  // Check basic format: 11 characters, alphanumeric and some special chars
  if (!id || id.length !== 11) {
    return false;
  }
  
  // Check for obvious placeholder patterns
  const placeholderPatterns = [
    'YOUTUBE_ID_PLACEHOLDER',
    'PLACEHOLDER',
    'FAKE_ID',
    'TEST_ID',
    'DUMMY_ID',
    'COMING_SOON',
    'TBD',
    'TEMP_ID'
  ];
  
  const upperID = id.toUpperCase();
  if (placeholderPatterns.some(pattern => upperID.includes(pattern))) {
    return false;
  }
  
  // Check if it contains only valid YouTube ID characters
  const validChars = /^[A-Za-z0-9_-]{11}$/;
  if (!validChars.test(id)) {
    return false;
  }
  
  // Additional checks for obvious fake patterns
  if (id === '00000000000' || id === '11111111111' || id === 'xxxxxxxxxxx') {
    return false;
  }
  
  return true;
}

/**
 * Gets the best available thumbnail URL for a video
 */
export function getYouTubeThumbnail(youtubeId: string, quality: 'default' | 'hqdefault' | 'mqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'): string {
  // If the YouTube ID is invalid or a placeholder, return local placeholder
  if (!isValidYouTubeId(youtubeId)) {
    return '/images/placeholder-thumbnail.jpg';
  }
  
  // Return YouTube thumbnail URL
  return `https://i.ytimg.com/vi/${youtubeId}/${quality}.jpg`;
}

/**
 * Creates a fallback chain for image loading
 */
export function createImageFallbackChain(youtubeId: string): string[] {
  const fallbacks = [];
  
  // If valid ID, try YouTube thumbnails in quality order
  if (isValidYouTubeId(youtubeId)) {
    fallbacks.push(
      `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`,
      `https://i.ytimg.com/vi/${youtubeId}/default.jpg`
    );
  }
  
  // Always include local fallbacks
  fallbacks.push(
    '/images/placeholder-thumbnail.jpg',
    '/images/placeholder-thumbnail.svg'
  );
  
  return fallbacks;
}

/**
 * Checks if a video is a placeholder (for UI indicators)
 */
export function isPlaceholderVideo(youtubeId: string): boolean {
  return !isValidYouTubeId(youtubeId);
}
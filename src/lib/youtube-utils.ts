/**
 * Centralized YouTube URL utilities
 * Fixes regex that was capturing query params (e.g., ?si=...) as part of video ID
 */

/**
 * Extract YouTube video ID from various URL formats
 * Handles: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 * Correctly strips query params like ?si=... from shortened URLs
 */
export function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\s]+)/);
  return match ? match[1] : null;
}

/**
 * Get YouTube thumbnail URL (medium quality)
 */
export function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

/**
 * Get YouTube thumbnail URL (max resolution)
 */
export function getYouTubeThumbnailHQ(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
}

/**
 * Get YouTube embed URL for iframe
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
}

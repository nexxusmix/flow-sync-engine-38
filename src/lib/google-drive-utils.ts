/**
 * Google Drive URL utilities
 * Extract file IDs, generate thumbnails & preview URLs
 */

/**
 * Extract Google Drive file ID from various URL formats
 * Handles: /file/d/{id}, /open?id={id}, id={id} query param
 */
export function extractDriveFileId(url: string): string | null {
  // /file/d/{id}
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // /open?id={id} or &id={id}
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  // /folders/{id}
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  return null;
}

/**
 * Check if a URL is a Google Drive link
 */
export function isGoogleDriveUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes('drive.google.com') || u.hostname.includes('docs.google.com');
  } catch {
    return false;
  }
}

/**
 * Get Google Drive thumbnail URL
 */
export function getDriveThumbnail(url: string, size = 400): string | null {
  const id = extractDriveFileId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${size}` : null;
}

/**
 * Get Google Drive preview/embed URL (for iframe)
 */
export function getDrivePreviewUrl(url: string): string | null {
  const id = extractDriveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}

/**
 * Get direct view URL
 */
export function getDriveViewUrl(url: string): string | null {
  const id = extractDriveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/view` : null;
}

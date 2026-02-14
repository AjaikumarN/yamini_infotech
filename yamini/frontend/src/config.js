// ===============================================
// Centralized API Configuration
// ===============================================
// All API URLs should reference this constant.
// Set VITE_API_URL in your .env file for production.
// Default: https://api.yaminicopier.com (production)

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.yaminicopier.com';

// Public frontend domain for resolving relative upload/asset paths
export const FRONTEND_BASE_URL = 'https://yaminicopier.com';

// Default fallback avatar when no photo is available
export const DEFAULT_AVATAR = '/assets/default-avatar.svg';

/**
 * Build a full URL for uploaded files (images, documents, etc.)
 * @param {string} path - The file path (relative or absolute)
 * @returns {string} Full URL to the file
 */
export function getUploadUrl(path) {
  if (!path) return '';
  // Already a full URL — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Relative paths starting with /uploads/ or /assets/ → prefix with API base
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Build a full URL for employee photo uploads
 * @param {string} photo - The photo filename or path
 * @returns {string} Full URL to the photo, or default avatar
 */
export function getEmployeePhotoUrl(photo) {
  if (!photo) return '';
  if (photo.startsWith('data:')) return photo;
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  if (photo.startsWith('/')) return `${API_BASE_URL}${photo}`;
  return `${API_BASE_URL}/uploads/employees/${photo}`;
}

/**
 * Get a photo URL with fallback to default avatar
 * @param {string} photo - The photo filename or path
 * @returns {string} Full URL to the photo, or default avatar path
 */
export function getPhotoUrlWithFallback(photo) {
  const url = getEmployeePhotoUrl(photo);
  return url || DEFAULT_AVATAR;
}

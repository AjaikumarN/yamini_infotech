// ===============================================
// Centralized API Configuration
// ===============================================
// All API URLs should reference this constant.
// Set VITE_API_URL in your .env file for production.
// Default: http://localhost:8000 (for local development)

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Build a full URL for uploaded files (images, documents, etc.)
 * @param {string} path - The file path (relative or absolute)
 * @returns {string} Full URL to the file
 */
export function getUploadUrl(path) {
  if (!path) return '';
  // Already a full URL — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Ensure single leading slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Build a full URL for employee photo uploads
 * @param {string} photo - The photo filename or path
 * @returns {string} Full URL to the photo
 */
export function getEmployeePhotoUrl(photo) {
  if (!photo) return '';
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  if (photo.startsWith('/')) return `${API_BASE_URL}${photo}`;
  return `${API_BASE_URL}/uploads/employees/${photo}`;
}

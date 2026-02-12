/**
 * Centralized Dashboard Route Helper
 * Maps user roles to their appropriate dashboard routes
 */

export const DASHBOARD_ROUTES = {
  ADMIN: '/admin/dashboard',
  RECEPTION: '/reception/dashboard',
  SALESMAN: '/salesman/dashboard',
  SERVICE_ENGINEER: '/engineer/dashboard',
  CUSTOMER: '/customer' // Customers don't have dashboards in staff portal
}

/**
 * Get the dashboard route for a given role
 * @param {string} role - User role (UPPERCASE)
 * @returns {string} Dashboard route path
 */
export function getDashboardRoute(role) {
  // Handle both uppercase and lowercase for backward compatibility
  const upperRole = role?.toUpperCase()
  return DASHBOARD_ROUTES[upperRole] || DASHBOARD_ROUTES[role] || '/'
}

/**
 * Check if a route is a public route (no authentication required)
 * @param {string} path - Route path
 * @returns {boolean}
 */
export function isPublicRoute(path) {
  const publicRoutes = [
    '/',
    '/products',
    '/services',
    '/contact',
    '/about',
    '/blog',
    '/login',
    '/enquiry'
  ]
  
  // Check exact matches
  if (publicRoutes.includes(path)) return true
  
  // Check patterns like /products/:id, /enquiry/:productId
  if (path.startsWith('/products/') || path.startsWith('/enquiry/')) return true
  
  return false
}

/**
 * Check if a route is an internal staff route
 * @param {string} path - Route path
 * @returns {boolean}
 */
export function isStaffRoute(path) {
  const staffPrefixes = [
    '/admin',
    '/reception',
    '/salesman',
    '/engineer',
    '/office',
    '/employee',
    '/dashboard'
  ]
  
  return staffPrefixes.some(prefix => path.startsWith(prefix))
}

/**
 * Get appropriate redirect after login based on role and previous location
 * @param {string} role - User role
 * @param {string} from - Previous location
 * @returns {string} Redirect path
 */
export function getPostLoginRedirect(role, from = '/') {
  // Get the correct dashboard for this user's role
  const userDashboard = getDashboardRoute(role)
  
  // If coming from a staff route, check if it matches the user's role
  if (isStaffRoute(from)) {
    // Extract the role prefix from the 'from' path
    const rolePrefix = from.split('/')[1] // e.g., 'admin', 'reception', 'salesman', 'engineer'
    
    // Map URL prefixes to role names
    const urlToRole = {
      'admin': 'ADMIN',
      'reception': 'RECEPTION',
      'salesman': 'SALESMAN',
      'engineer': 'SERVICE_ENGINEER'
    }
    
    const fromRole = urlToRole[rolePrefix]
    const currentRole = role?.toUpperCase()
    
    // Only redirect to 'from' if it matches the current user's role
    if (fromRole === currentRole) {
      return from
    }
  }
  
  // Otherwise, redirect to role's dashboard
  return userDashboard
}

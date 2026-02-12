import React, { createContext, useState, useContext, useEffect } from 'react'
import { authAPI } from '../utils/api'
import { getEmployeePhotoUrl } from '../config'

export const AuthContext = createContext()

// Role hierarchy and permissions
const ROLES = {
  ADMIN: 'ADMIN',
  RECEPTION: 'RECEPTION',
  SALESMAN: 'SALESMAN',
  SERVICE_ENGINEER: 'SERVICE_ENGINEER',
  OFFICE_STAFF: 'OFFICE_STAFF',
  CUSTOMER: 'CUSTOMER'
}

const PERMISSIONS = {
  // Admin has all permissions
  [ROLES.ADMIN]: {
    accessMIF: true,
    viewAllCustomers: true,
    manageEmployees: true,
    manageReception: true,
    viewReports: true,
    manageProducts: true,
    manageServices: true,
    viewFinancials: true,
    accessAllModules: true
  },
  
  // Office Staff has limited MIF access
  [ROLES.OFFICE_STAFF]: {
    accessMIF: true, // Limited access, logged
    viewAllCustomers: true,
    manageEmployees: false,
    manageReception: false,
    viewReports: true,
    manageProducts: true,
    manageServices: true,
    viewFinancials: false,
    accessAllModules: false
  },
  
  // Reception has no MIF access
  [ROLES.RECEPTION]: {
    accessMIF: false,
    viewAllCustomers: true,
    manageEmployees: false,
    manageReception: true,
    viewReports: false,
    manageProducts: false,
    manageServices: false,
    viewFinancials: false,
    accessAllModules: false
  },
  
  // Salesman has no MIF access
  [ROLES.SALESMAN]: {
    accessMIF: false,
    viewAllCustomers: false,
    manageEmployees: false,
    manageReception: false,
    viewReports: false,
    manageProducts: false,
    manageServices: false,
    viewFinancials: false,
    accessAllModules: false
  },
  
  // Service Engineer has no MIF access
  [ROLES.SERVICE_ENGINEER]: {
    accessMIF: false,
    viewAllCustomers: false,
    manageEmployees: false,
    manageReception: false,
    viewReports: false,
    manageProducts: false,
    manageServices: false,
    viewFinancials: false,
    accessAllModules: false
  },
  
  // Customer has very limited access
  [ROLES.CUSTOMER]: {
    accessMIF: false,
    viewAllCustomers: false,
    manageEmployees: false,
    manageReception: false,
    viewReports: false,
    manageProducts: false,
    manageServices: false,
    viewFinancials: false,
    accessAllModules: false
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Helper to get full photo URL
  const getPhotoUrl = (photograph) => {
    if (!photograph) return null;
    if (photograph.startsWith('data:')) return photograph;
    return getEmployeePhotoUrl(photograph);
  };

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('yamini_user')
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        // Verify token exists
        if (parsedUser.token) {
          // Add photo alias if not already present
          const photoUrl = getPhotoUrl(parsedUser.photograph || parsedUser.photo);
          parsedUser.photo = photoUrl;
          
          if (!parsedUser.name && parsedUser.full_name) {
            parsedUser.name = parsedUser.full_name
          }
          setUser(parsedUser)
          setIsAuthenticated(true)
          // Also restore token separately for backward compatibility
          localStorage.setItem('token', parsedUser.token)
        } else {
          localStorage.removeItem('yamini_user')
          localStorage.removeItem('token')
        }
      } catch (error) {
        console.error('Failed to parse saved user:', error)
        localStorage.removeItem('yamini_user')
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user && isAuthenticated) {
      localStorage.setItem('yamini_user', JSON.stringify(user))
    }
  }, [user, isAuthenticated])

  const login = async (username, password) => {
    try {
      // Call real backend API
      const response = await authAPI.login(username, password)
      
      // response contains: { access_token, token_type, user }
      const photoUrl = getPhotoUrl(response.user.photograph || response.user.photo);
      
      const userWithToken = {
        ...response.user,
        token: response.access_token,
        // Add photo alias with full URL
        photo: photoUrl,
        photograph: photoUrl,
        name: response.user.full_name || response.user.name || response.user.username
      }
      
      console.log('Login user photo URL:', photoUrl); // Debug log
      
      setUser(userWithToken)
      setIsAuthenticated(true)
      localStorage.setItem('yamini_user', JSON.stringify(userWithToken))
      // Also store token separately for backward compatibility
      localStorage.setItem('token', response.access_token)
      
      return { success: true, user: userWithToken }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message || 'Invalid username or password' }
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('yamini_user')
    localStorage.removeItem('token')
  }

  const hasPermission = (permission) => {
    if (!user || !user.role) return false
    
    const rolePermissions = PERMISSIONS[user.role]
    if (!rolePermissions) return false
    
    return rolePermissions[permission] === true
  }

  const hasRole = (role) => {
    if (!user) return false
    if (Array.isArray(role)) {
      return role.includes(user.role)
    }
    return user.role === role
  }

  const canAccessMIF = () => {
    return hasPermission('accessMIF')
  }

  const canAccessModule = (moduleName) => {
    if (!user) return false
    
    // Admin can access everything
    if (user.role === ROLES.ADMIN) return true
    
    // Map module names to roles
    const moduleRoleMap = {
      'customer': [ROLES.CUSTOMER, ROLES.ADMIN],
      'reception': [ROLES.RECEPTION, ROLES.ADMIN],
      'salesman': [ROLES.SALESMAN, ROLES.ADMIN],
      'service-engineer': [ROLES.SERVICE_ENGINEER, ROLES.ADMIN],
      'office-staff': [ROLES.OFFICE_STAFF, ROLES.ADMIN],
      'admin': [ROLES.ADMIN]
    }
    
    const allowedRoles = moduleRoleMap[moduleName]
    if (!allowedRoles) return false
    
    return allowedRoles.includes(user.role)
  }

  const value = {
    user,
    setUser,
    isAuthenticated,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    canAccessMIF,
    canAccessModule,
    ROLES
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export { ROLES }

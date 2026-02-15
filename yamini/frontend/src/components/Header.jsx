import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiSearch, FiBell, FiShoppingCart, FiMenu, FiX, FiChevronDown, FiChevronUp, FiUser, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext.jsx'
import { apiRequest } from '../utils/api.js'
import { useNotificationRouter } from '../hooks/useNotificationRouter'
import Notifications from './Notifications.jsx'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Services', href: '/services' },
  { label: 'Blog', href: '/blog' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' }
]

export default function Header({ showNotificationPanel, setShowNotificationPanel }) {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [employeesOpen, setEmployeesOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [allNotifications, setAllNotifications] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef(null)
  
  const { handleNotificationClick } = useNotificationRouter()

  // Fetch backend notifications for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications()
      // Poll every 20 seconds
      const interval = setInterval(fetchNotifications, 20000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, user])

  const fetchNotifications = async () => {
    try {
      // Use new staff_notifications endpoint (falls back to old one)
      let allNotifs = []
      try {
        allNotifs = await apiRequest('/api/notifications/my?limit=50')
      } catch {
        // Fallback to old endpoint if new one not deployed yet
        allNotifs = await apiRequest('/api/notifications/my-notifications')
      }
      
      // Filter unread
      const unreadNotifs = (allNotifs || []).filter(n => !n.is_read && !n.read_status)
      
      setNotifications(unreadNotifs)
      setAllNotifications(allNotifs || [])
      setUnreadCount(unreadNotifs.length)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PUT' })
      await fetchNotifications() // Refresh notifications
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }
  
  // Handle search with predictive results
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        setShowSearchDropdown(false)
        return
      }
      
      setIsSearching(true)
      try {
        const [enquiries, services, orders, customers] = await Promise.all([
          apiRequest(`/api/enquiries/?search=${searchQuery}&limit=3`).catch(() => ({ enquiries: [] })),
          apiRequest(`/api/service-requests/?search=${searchQuery}&limit=3`).catch(() => ({ service_requests: [] })),
          apiRequest(`/api/orders/?search=${searchQuery}&limit=3`).catch(() => ({ orders: [] })),
          apiRequest(`/api/customers/?search=${searchQuery}&limit=3`).catch(() => ({ customers: [] }))
        ])
        
        const results = [
          ...((enquiries.enquiries || []).map(e => ({ type: 'Enquiry', title: e.customer_name, subtitle: e.product_name, id: e.id, path: `/admin/enquiries/${e.id}` }))),
          ...((services.service_requests || []).map(s => ({ type: 'Service', title: s.customer_name, subtitle: `SR-${s.id}`, id: s.id, path: `/admin/service-requests/${s.id}` }))),
          ...((orders.orders || []).map(o => ({ type: 'Order', title: o.customer_name, subtitle: `Order #${o.id}`, id: o.id, path: `/admin/orders/${o.id}` }))),
          ...((customers.customers || []).map(c => ({ type: 'Customer', title: c.name, subtitle: c.phone, id: c.id, path: `/admin/customers/${c.id}` })))
        ]
        
        setSearchResults(results.slice(0, 8))
        setShowSearchDropdown(results.length > 0)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }
    
    const debounce = setTimeout(handleSearch, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])
  
  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleMenu = () => setMenuOpen(!menuOpen)
  const closeMenu = () => {
    setMenuOpen(false)
    setEmployeesOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    setUserMenuOpen(false)
  }

  return (
    <>
    <Notifications 
      showPanel={showNotificationPanel}
      setShowPanel={setShowNotificationPanel}
      backendNotifications={notifications}
      allNotifications={allNotifications}
      markAsRead={markAsRead}
      refreshNotifications={fetchNotifications}
    />
    <header className="site-header">
      <div className="topbar">
        {!(location.pathname === '/' || location.pathname.startsWith('/login')) && (
          <button className="menu-toggle" onClick={toggleMenu} aria-label="Menu">
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        )}
        <div className="logo-wrap">
          <img src="/assets/main_logo.png" alt="Yamini Infotech" className="logo-icon" />
          <div className="logo-text">
            <div className="company">Yamini Infotech</div>
          </div>
        </div>

        {/* Center Large Search Bar */}
        {isAuthenticated && (
          <div className="header-center-search" ref={searchRef}>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="large-search-input"
            />
            <button className="search-icon-btn" aria-label="Search">
              <FiSearch />
            </button>
            
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="search-dropdown">
                {searchResults.map((result, idx) => (
                  <Link
                    key={`${result.type}-${result.id}-${idx}`}
                    to={result.path}
                    className="search-result-item"
                    onClick={() => {
                      setShowSearchDropdown(false)
                      setSearchQuery('')
                    }}
                  >
                    <div className="search-result-type">{result.type}</div>
                    <div className="search-result-title">{result.title}</div>
                    <div className="search-result-subtitle">{result.subtitle}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="actions">
          {!isAuthenticated && (
            <>
              <button aria-label="Search" className="icon-btn"><FiSearch /></button>
              <button aria-label="Cart" className="icon-btn">
                <FiShoppingCart />
              </button>
            </>
          )}
          
          {isAuthenticated ? (
            <div className="user-menu-container">
              <button 
                className="profile-icon-only" 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
              >
                <FiUser />
              </button>
              
              {userMenuOpen && (
                <div className="user-dropdown enhanced-dropdown">
                  <div className="user-info">
                    <div className="user-avatar-large">
                      <FiUser />
                    </div>
                    <div className="user-name-full">{user?.full_name || user?.username}</div>
                    <div className="user-role">{user?.role?.replace('_', ' ').toUpperCase()}</div>
                    <div className="user-email">{user?.email}</div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="logout-btn enhanced-logout" onClick={handleLogout}>
                    <FiLogOut />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="login-link">
              <FiUser />
              <span>Staff Login</span>
            </Link>
          )}
        </div>
      </div>

      {isAuthenticated && (
      <div className={`sidebar-menu ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-overlay" onClick={closeMenu}></div>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h3>Staff Menu</h3>
            <button onClick={closeMenu} className="close-btn"><FiX /></button>
          </div>
          <nav className="sidebar-nav">
            <ul>
              {user?.role === 'RECEPTION' && (
                <li className="menu-item">
                  <Link to="/reception/dashboard" onClick={closeMenu} className="menu-link">Reception Dashboard</Link>
                </li>
              )}
              
              {user?.role === 'SALESMAN' && (
                <>
                  <li className="menu-item">
                    <Link to="/salesman/dashboard" onClick={closeMenu} className="menu-link">Dashboard</Link>
                  </li>
                  <li className="menu-item">
                    <Link to="/salesman/enquiries" onClick={closeMenu} className="menu-link">Enquiries</Link>
                  </li>
                  <li className="menu-item">
                    <Link to="/salesman/calls" onClick={closeMenu} className="menu-link">Calls</Link>
                  </li>
                  <li className="menu-item">
                    <Link to="/salesman/followups" onClick={closeMenu} className="menu-link">Follow-Ups</Link>
                  </li>
                </>
              )}
              
              {user?.role === 'OFFICE_STAFF' && (
                <li className="menu-item">
                  <Link to="/office/dashboard" onClick={closeMenu} className="menu-link">Office Staff Dashboard</Link>
                </li>
              )}
              
              {user?.role === 'ADMIN' && (
                <>
                  <li className="menu-item">
                    <Link to="/admin/dashboard" onClick={closeMenu} className="menu-link">Admin Dashboard</Link>
                  </li>
                  <li className="menu-item">
                    <Link to="/reception/dashboard" onClick={closeMenu} className="menu-link">Reception</Link>
                  </li>
                  <li className="menu-item">
                    <button onClick={() => setEmployeesOpen(!employeesOpen)} className="menu-btn">
                      <span>All Dashboards</span>
                      {employeesOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    {employeesOpen && (
                      <ul className="submenu">
                        <li><Link to="/salesman/dashboard" onClick={closeMenu}>Salesman</Link></li>
                        <li><Link to="/engineer/dashboard" onClick={closeMenu}>Service Engineer</Link></li>
                        <li><Link to="/office/dashboard" onClick={closeMenu}>Office Staff</Link></li>
                      </ul>
                    )}
                  </li>
                </>
              )}
              
              <li className="menu-item logout-menu-item">
                <button className="logout-btn-sidebar" onClick={() => { handleLogout(); closeMenu(); }}>
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      )}

      {!isAuthenticated && (
      <nav className="nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.label}>
              {item.href.startsWith('/') ? (
                <Link to={item.href}>{item.label}</Link>
              ) : (
                <a href={item.href}>{item.label}</a>
              )}
            </li>
          ))}
        </ul>
      </nav>
      )}
    </header>
    </>
  )
}

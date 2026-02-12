import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';
import { getEmployeePhotoUrl as getPhotoUrl } from '../../config';

/**
 * AdminHeader - Single admin dashboard header component
 * Rendered ONLY by AdminLayout - never imported by pages
 */
export default function AdminHeader({ onMenuToggle, role }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiRequest('/api/notifications/my-notifications');
        
        // Handle both formats: direct array or {data: array}
        const notificationsData = response?.data || response;
        
        if (Array.isArray(notificationsData)) {
          // Get more notifications (up to 20 for split view)
          setNotifications(notificationsData.slice(0, 20));
          setUnreadCount(notificationsData.filter(n => !n.is_read).length);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        // Silently handle notification errors
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search with debounce - Role-based search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    setShowSearchDropdown(true); // Show dropdown immediately
    
    const timeoutId = setTimeout(async () => {
      try {
        const results = [];
        const upperRole = role?.toUpperCase();

        console.log('Searching for:', searchQuery, 'Role:', upperRole);

        // Role-based search endpoints
        if (upperRole === 'ADMIN') {
          const [enquiries, services, orders, customers] = await Promise.all([
            apiRequest(`/api/enquiries?search=${searchQuery}&limit=3`).catch(e => { console.error('Enquiries search failed:', e); return null; }),
            apiRequest(`/api/service-requests?search=${searchQuery}&limit=3`).catch(e => { console.error('Services search failed:', e); return null; }),
            apiRequest(`/api/orders?search=${searchQuery}&limit=3`).catch(e => { console.error('Orders search failed:', e); return null; }),
            apiRequest(`/api/customers?search=${searchQuery}&limit=3`).catch(e => { console.error('Customers search failed:', e); return null; })
          ]);

          console.log('Search results:', { enquiries, services, orders, customers });

          // Handle both formats: direct array or {data: array}
          const enquiriesData = enquiries?.data || enquiries;
          const servicesData = services?.data || services;
          const ordersData = orders?.data || orders;
          const customersData = customers?.data || customers;

          if (Array.isArray(enquiriesData) && enquiriesData.length > 0) {
            results.push({ category: 'Enquiries', items: enquiriesData });
          }
          if (Array.isArray(servicesData) && servicesData.length > 0) {
            results.push({ category: 'Service Requests', items: servicesData });
          }
          if (Array.isArray(ordersData) && ordersData.length > 0) {
            results.push({ category: 'Orders', items: ordersData });
          }
          if (Array.isArray(customersData) && customersData.length > 0) {
            results.push({ category: 'Customers', items: customersData });
          }
        } else if (upperRole === 'SALESMAN') {
          const [enquiries, orders, customers] = await Promise.all([
            apiRequest(`/api/enquiries?search=${searchQuery}&limit=3`).catch(() => null),
            apiRequest(`/api/orders?search=${searchQuery}&limit=3`).catch(() => null),
            apiRequest(`/api/customers?search=${searchQuery}&limit=3`).catch(() => null)
          ]);

          const enquiriesData = enquiries?.data || enquiries;
          const ordersData = orders?.data || orders;
          const customersData = customers?.data || customers;

          if (Array.isArray(enquiriesData) && enquiriesData.length > 0) {
            results.push({ category: 'Enquiries', items: enquiriesData });
          }
          if (Array.isArray(ordersData) && ordersData.length > 0) {
            results.push({ category: 'Orders', items: ordersData });
          }
          if (Array.isArray(customersData) && customersData.length > 0) {
            results.push({ category: 'Customers', items: customersData });
          }
        } else if (upperRole === 'RECEPTIONIST') {
          const [services, customers] = await Promise.all([
            apiRequest(`/api/service-requests?search=${searchQuery}&limit=3`).catch(() => null),
            apiRequest(`/api/customers?search=${searchQuery}&limit=3`).catch(() => null)
          ]);

          const servicesData = services?.data || services;
          const customersData = customers?.data || customers;

          if (Array.isArray(servicesData) && servicesData.length > 0) {
            results.push({ category: 'Service Requests', items: servicesData });
          }
          if (Array.isArray(customersData) && customersData.length > 0) {
            results.push({ category: 'Customers', items: customersData });
          }
        } else if (upperRole === 'SERVICE_ENGINEER') {
          const services = await apiRequest(`/api/service-requests?search=${searchQuery}&limit=5`).catch(() => null);
          const servicesData = services?.data || services;

          if (Array.isArray(servicesData) && servicesData.length > 0) {
            results.push({ category: 'Service Requests', items: servicesData });
          }
        }

        console.log('Final results:', results);
        setSearchResults(results);
        // Keep dropdown open even if no results to show "No results found"
        setSearchLoading(false);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchResultClick = (item, category) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    
    // Role-based navigation
    const upperRole = role?.toUpperCase();
    const basePath = upperRole === 'ADMIN' ? '/admin' :
                    upperRole === 'SALESMAN' ? '/salesman' :
                    upperRole === 'RECEPTION' ? '/reception' :
                    upperRole === 'SERVICE_ENGINEER' ? '/engineer' : '/admin';
    
    if (category === 'Enquiries') {
      navigate(`${basePath}/enquiries/${item.id}`);
    } else if (category === 'Service Requests') {
      navigate(`${basePath}/service/${item.id}`);
    } else if (category === 'Orders') {
      navigate(`${basePath}/orders/${item.id}`);
    } else if (category === 'Customers') {
      navigate(`${basePath}/customers/${item.id}`);
    }
  };

  const markNotificationRead = async (notif) => {
    try {
      // Mark as read
      await apiRequest(`/api/notifications/${notif.id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Navigate based on redirect_url or construct from role and notification type
      setShowNotifications(false);
      
      if (notif.redirect_url) {
        navigate(notif.redirect_url);
      } else {
        // Construct URL based on role and notification type
        const upperRole = role?.toUpperCase();
        const basePath = upperRole === 'ADMIN' ? '/admin' :
                        upperRole === 'SALESMAN' ? '/salesman' :
                        upperRole === 'RECEPTION' ? '/reception' :
                        upperRole === 'SERVICE_ENGINEER' ? '/engineer' : '/admin';
        
        // Try to extract entity type and ID from notification
        const message = notif.message?.toLowerCase() || '';
        const title = notif.title?.toLowerCase() || '';
        
        if (title.includes('enquiry') || message.includes('enq-')) {
          const match = message.match(/enq-(\d+)/i);
          if (match) navigate(`${basePath}/enquiries/${match[1]}`);
          else navigate(`${basePath}/enquiries`);
        } else if (title.includes('service') || message.includes('srv-') || message.includes('service request')) {
          const match = message.match(/srv-(\d+)|#(\d+)/i);
          const id = match ? (match[1] || match[2]) : null;
          
          // For reception role, redirect to service-complaints
          if (upperRole === 'RECEPTION') {
            navigate(`${basePath}/service-complaints`);
          } else {
            // For other roles, use service route
            if (id) navigate(`${basePath}/service/${id}`);
            else navigate(`${basePath}/service`);
          }
        } else if (title.includes('order') || message.includes('ord-')) {
          const match = message.match(/ord-(\d+)/i);
          if (match) navigate(`${basePath}/orders/${match[1]}`);
          else navigate(`${basePath}/orders`);
        } else {
          // Default to dashboard
          navigate(`${basePath}/dashboard`);
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <header style={styles.header}>
      <div style={styles.container}>
        
        {/* LEFT SECTION */}
        <div style={styles.leftSection}>
          <button 
            onClick={onMenuToggle} 
            style={styles.menuButton} 
            aria-label="Toggle menu"
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          
          <div style={styles.brand}>
            <img 
              src="/assets/mainlogobgre.png" 
              alt="Yamini Infotech" 
              style={{...styles.logo, width: '32px', height: '32px', objectFit: 'contain'}}
            />
            <span style={styles.brandText}>Yamini Infotech</span>
          </div>
        </div>

        {/* CENTER SECTION - SEARCH */}
        <div style={styles.centerSection} ref={searchRef}>
          <div style={styles.searchWrapper}>
            <svg style={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search enquiries, orders, customers... (Ctrl + K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.length >= 2) {
                  setShowSearchDropdown(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  const basePath = role === 'ADMIN' ? '/admin' : 
                                  role === 'SALESMAN' ? '/salesman' : 
                                  role === 'RECEPTIONIST' ? '/reception' : '/engineer';
                  navigate(`${basePath}/search?q=${encodeURIComponent(searchQuery)}`);
                  setShowSearchDropdown(false);
                }
                if (e.key === 'Escape') {
                  setShowSearchDropdown(false);
                  searchInputRef.current?.blur();
                }
              }}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={styles.clearButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && (
            <div style={styles.searchDropdown}>
              {searchLoading ? (
                <div style={styles.searchLoading}>
                  <div style={styles.spinner}></div>
                  <span>Searching...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((category, idx) => (
                  <div key={idx} style={styles.searchCategory}>
                    <div style={styles.categoryTitle}>{category.category}</div>
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSearchResultClick(item, category.category)}
                        style={styles.searchItem}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                      >
                        <div style={styles.searchItemTitle}>
                          {category.category === 'Customers' && (item.name || item.customer_name)}
                          {category.category === 'Enquiries' && `ENQ-${item.id}: ${item.customer_name || 'Enquiry'}`}
                          {category.category === 'Service Requests' && `SRV-${item.id}: ${item.customer_name || 'Service'}`}
                          {category.category === 'Orders' && `ORD-${item.id}: ${item.customer_name || 'Order'}`}
                        </div>
                        <div style={styles.searchItemMeta}>
                          {item.phone || item.email || item.status || item.priority || ''}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>No results found</div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SECTION */}
        <div style={styles.rightSection}>
          
          {/* Notifications */}
          <div style={styles.iconWrapper} ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={styles.iconButton}
              aria-label="Notifications"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div style={styles.notificationDropdown}>
                {/* Header with count badge */}
                <div style={styles.notifHeader}>
                  <h3 style={styles.notifHeaderTitle}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span style={styles.notifCountBadge}>{unreadCount} new</span>
                  )}
                </div>
                
                {notifications.length === 0 ? (
                  <div style={styles.emptyState}>No notifications</div>
                ) : (
                  <div style={styles.notifScrollContainer}>
                    {/* NEW Section */}
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <>
                        <div style={styles.notifSectionTitle}>
                          NEW ({notifications.filter(n => !n.is_read).length})
                        </div>
                        {notifications
                          .filter(n => !n.is_read)
                          .slice(0, 10)
                          .map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => markNotificationRead(notif)}
                              style={styles.notifCard}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                            >
                              <div style={styles.notifContent}>
                                <div style={styles.notifTitleRow}>
                                  <span style={styles.notifCardTitle}>{notif.title}</span>
                                  <span style={styles.notifBlueDot}></span>
                                </div>
                                <div style={styles.notifCardMessage}>{notif.message}</div>
                                <div style={styles.notifCardTime}>
                                  {new Date(notif.created_at).toLocaleString('en-US', {
                                    month: 'numeric',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                    
                    {/* HISTORY Section */}
                    {notifications.filter(n => n.is_read).length > 0 && (
                      <>
                        <div style={styles.notifSectionTitle}>
                          HISTORY ({notifications.filter(n => n.is_read).length})
                        </div>
                        {notifications
                          .filter(n => n.is_read)
                          .slice(0, 10)
                          .map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => markNotificationRead(notif)}
                              style={styles.notifCard}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                            >
                              <div style={styles.notifContent}>
                                <div style={styles.notifCardTitle}>{notif.title}</div>
                                <div style={styles.notifCardMessage}>{notif.message}</div>
                                <div style={styles.notifCardTime}>
                                  {new Date(notif.created_at).toLocaleString('en-US', {
                                    month: 'numeric',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div style={styles.iconWrapper} ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={styles.profileButton}
              aria-label="Profile menu"
            >
              <div style={styles.avatar}>
                {getPhotoUrl(user?.photo || user?.photograph) ? (
                  <img src={getPhotoUrl(user.photo || user.photograph)} alt={user?.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  user?.full_name?.charAt(0).toUpperCase() || 'A'
                )}
              </div>
            </button>

            {showProfileMenu && (
              <div style={styles.profileDropdown}>
                <div style={styles.profileInfo}>
                  <div style={styles.profileAvatar}>
                    {getPhotoUrl(user?.photo || user?.photograph) ? (
                      <img src={getPhotoUrl(user.photo || user.photograph)} alt={user?.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      user?.full_name?.charAt(0).toUpperCase() || 'A'
                    )}
                  </div>
                  <div style={styles.profileDetails}>
                    <div style={styles.profileName}>{user?.full_name || 'Admin'}</div>
                    <div style={styles.profileEmail}>{user?.email || ''}</div>
                    <span style={styles.roleBadge}>{user?.role || 'Admin'}</span>
                  </div>
                </div>
                <div style={styles.menuDivider}></div>
                <button onClick={() => {
                  const upperRole = role?.toUpperCase();
                  const basePath = upperRole === 'ADMIN' ? '/admin' :
                                  upperRole === 'SALESMAN' ? '/salesman' :
                                  upperRole === 'RECEPTION' ? '/reception' :
                                  upperRole === 'SERVICE_ENGINEER' ? '/engineer' : '/admin';
                  navigate(`${basePath}/profile`);
                  setShowProfileMenu(false);
                }} style={styles.menuItem}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>My Profile</span>
                </button>
                <button onClick={() => {
                  const upperRole = role?.toUpperCase();
                  const basePath = upperRole === 'ADMIN' ? '/admin' :
                                  upperRole === 'SALESMAN' ? '/salesman' :
                                  upperRole === 'RECEPTION' ? '/reception' :
                                  upperRole === 'SERVICE_ENGINEER' ? '/engineer' : '/admin';
                  navigate(`${basePath}/settings`);
                  setShowProfileMenu(false);
                }} style={styles.menuItem}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Settings</span>
                </button>
                <div style={styles.menuDivider}></div>
                <button onClick={handleLogout} style={{...styles.menuItem, color: '#ef4444'}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    height: '64px',
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  container: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    maxWidth: '100%',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    minWidth: '250px',
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    flexShrink: 0,
  },
  brandText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    whiteSpace: 'nowrap',
  },
  centerSection: {
    position: 'relative',
    flex: 1,
    maxWidth: '600px',
    margin: '0 32px',
  },
  searchWrapper: {
    position: 'relative',
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    height: '42px',
    padding: '0 44px 0 48px',
    border: '1px solid #e5e7eb',
    borderRadius: '21px',
    fontSize: '14px',
    color: '#374151',
    background: '#f9fafb',
    outline: 'none',
    transition: 'all 0.2s',
  },
  clearButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    border: 'none',
    background: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    borderRadius: '50%',
  },
  searchDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    maxHeight: '400px',
    overflowY: 'auto',
    zIndex: 2000,
  },
  searchCategory: {
    padding: '8px 0',
  },
  categoryTitle: {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  searchItem: {
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  searchItemTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '4px',
  },
  searchItemMeta: {
    fontSize: '12px',
    color: '#6b7280',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconWrapper: {
    position: 'relative',
  },
  iconButton: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  badge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    minWidth: '18px',
    height: '18px',
    padding: '0 5px',
    background: '#ef4444',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '600',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
  },
  notificationDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '420px',
    maxHeight: '600px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    zIndex: 2000,
    overflow: 'hidden',
  },
  notifHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fff',
  },
  notifHeaderTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  notifCountBadge: {
    padding: '6px 14px',
    background: '#dbeafe',
    color: '#1e40af',
    fontSize: '13px',
    fontWeight: '600',
    borderRadius: '20px',
  },
  notifScrollContainer: {
    maxHeight: '520px',
    overflowY: 'auto',
  },
  notifSectionTitle: {
    padding: '16px 24px 12px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    background: '#f8fafc',
  },
  notifCard: {
    padding: '16px 24px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    background: '#fff',
    transition: 'background 0.15s',
  },
  notifContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  notifTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifCardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: '1.4',
  },
  notifBlueDot: {
    width: '8px',
    height: '8px',
    background: '#3b82f6',
    borderRadius: '50%',
    flexShrink: 0,
  },
  notifCardMessage: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#64748b',
    lineHeight: '1.5',
  },
  notifCardTime: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  dropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  dropdownTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  unreadBadge: {
    padding: '4px 8px',
    background: '#dbeafe',
    color: '#1e40af',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '12px',
  },
  notificationList: {
    maxHeight: '320px',
    overflowY: 'auto',
  },
  notificationSectionHeader: {
    padding: '12px 16px 8px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
  },
  emptyState: {
    padding: '32px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px',
  },
  notificationItem: {
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background 0.15s',
  },
  notifTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#3b82f6',
    flexShrink: 0,
  },
  notifMessage: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '6px',
    lineHeight: '1.4',
  },
  notifTime: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  profileDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '280px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    zIndex: 2000,
    padding: '8px',
  },
  profileInfo: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    marginBottom: '4px',
  },
  profileAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '600',
    flexShrink: 0,
  },
  profileDetails: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  profileEmail: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '6px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dbeafe',
    color: '#1e40af',
    fontSize: '11px',
    fontWeight: '600',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  menuDivider: {
    height: '1px',
    background: '#e5e7eb',
    margin: '4px 0',
  },
  menuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    border: 'none',
    background: 'transparent',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '8px',
    textAlign: 'left',
    transition: 'background 0.15s',
  },
  searchLoading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '24px',
    color: '#6b7280',
    fontSize: '14px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

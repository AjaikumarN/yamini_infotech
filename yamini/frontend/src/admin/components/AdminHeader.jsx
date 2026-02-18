import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';
import { getEmployeePhotoUrl as getPhotoUrl } from '../../config';

/**
 * AdminHeader - Single admin dashboard header component
 * Rendered ONLY by AdminLayout - never imported by pages
 */

// Notification type → icon + color mapping
const NOTIF_META = {
  enquiry:    { icon: '📋', color: '#3b82f6', bg: '#eff6ff', label: 'Enquiry' },
  order:      { icon: '🛒', color: '#8b5cf6', bg: '#f5f3ff', label: 'Order' },
  complaint:  { icon: '🔧', color: '#f59e0b', bg: '#fffbeb', label: 'Service' },
  service:    { icon: '🔧', color: '#f59e0b', bg: '#fffbeb', label: 'Service' },
  attendance: { icon: '📍', color: '#10b981', bg: '#ecfdf5', label: 'Attendance' },
  stock:      { icon: '📦', color: '#ef4444', bg: '#fef2f2', label: 'Stock' },
  reminder:   { icon: '⏰', color: '#6366f1', bg: '#eef2ff', label: 'Reminder' },
  system:     { icon: '⚙️', color: '#64748b', bg: '#f8fafc', label: 'System' },
  default:    { icon: '🔔', color: '#6366f1', bg: '#eef2ff', label: 'Notification' },
};

// Normalize module/type strings (e.g. "enquiries" → "enquiry")
const normalizeType = (t) => {
  if (!t) return '';
  const lower = t.toLowerCase().trim();
  const MAP = {
    enquiries: 'enquiry', enquiry: 'enquiry',
    orders: 'order', order: 'order',
    complaints: 'complaint', complaint: 'complaint',
    services: 'service', service: 'service',
    'service-complaint': 'complaint', 'service_complaint': 'complaint',
    attendance: 'attendance',
    stock: 'stock', stocks: 'stock', inventory: 'stock',
    reminder: 'reminder', reminders: 'reminder',
    system: 'system',
  };
  return MAP[lower] || lower;
};

const getNotifMeta = (type) => NOTIF_META[normalizeType(type)] || NOTIF_META.default;

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Construct redirect URL based on notification metadata + user role
// Routes per role:
//   Admin:    /admin/enquiries, /admin/orders, /admin/service/requests, /admin/attendance, /admin/stock
//   Reception: /reception/enquiries, /reception/service-complaints, /reception/delivery-log, /reception/outstanding
//   Salesman:  /salesman/enquiries, /salesman/orders, /salesman/calls, /salesman/followups
//   Engineer:  /service-engineer/jobs, /service-engineer/attendance, /service-engineer/sla-tracker
const getRedirectUrl = (notif, role) => {
  const upperRole = (role || '').toUpperCase();
  const basePath = upperRole === 'ADMIN' ? '/admin' :
                   upperRole === 'SALESMAN' ? '/salesman' :
                   upperRole === 'RECEPTION' ? '/reception' :
                   upperRole === 'SERVICE_ENGINEER' ? '/service-engineer' : '/admin';

  // If the backend set an action_url that starts with '/', rewrite it with the correct role base
  if (notif.action_url) {
    const au = notif.action_url;
    // Absolute role-agnostic paths like /enquiries/123 → prefix with basePath
    if (au.startsWith('/enquiries')) return `${basePath === '/service-engineer' ? '/admin' : basePath}${au.replace('/enquiries', '/enquiries')}`;
    if (au.startsWith('/orders'))    return `${basePath}/orders`;
    if (au.startsWith('/service'))   return upperRole === 'ADMIN' ? '/admin/service/requests' :
                                            upperRole === 'RECEPTION' ? '/reception/service-complaints' :
                                            upperRole === 'SERVICE_ENGINEER' ? '/service-engineer/jobs' : `${basePath}/service`;
    // Already has a role prefix
    if (au.startsWith('/admin') || au.startsWith('/reception') || au.startsWith('/salesman') || au.startsWith('/service-engineer')) return au;
    return `${basePath}${au.startsWith('/') ? au : '/' + au}`;
  }

  const type = normalizeType(notif.notification_type || notif.module || '');
  const msg  = (notif.message || '').toLowerCase();
  const title = (notif.title || '').toLowerCase();
  const entityId = notif.entity_id;

  // Enquiry related
  if (type === 'enquiry' || title.includes('enquir') || msg.includes('enquir') || msg.includes('enq')) {
    switch (upperRole) {
      case 'ADMIN':      return entityId ? `/admin/enquiries/${entityId}` : '/admin/enquiries';
      case 'RECEPTION':  return '/reception/enquiries';
      case 'SALESMAN':   return '/salesman/enquiries';
      default:           return `${basePath}/enquiries`;
    }
  }

  // Service / Complaint related
  if (type === 'complaint' || type === 'service' || title.includes('service') || title.includes('complaint') || msg.includes('srv')) {
    switch (upperRole) {
      case 'ADMIN':            return '/admin/service/requests';
      case 'RECEPTION':        return '/reception/service-complaints';
      case 'SERVICE_ENGINEER': return '/service-engineer/jobs';
      default:                 return `${basePath}/service`;
    }
  }

  // Order related
  if (type === 'order' || title.includes('order') || msg.includes('order')) {
    switch (upperRole) {
      case 'ADMIN':    return '/admin/orders';
      case 'SALESMAN': return '/salesman/orders';
      case 'RECEPTION': return '/reception/outstanding';
      default:         return `${basePath}/orders`;
    }
  }

  // Attendance related
  if (type === 'attendance' || title.includes('attendance')) {
    switch (upperRole) {
      case 'ADMIN':            return '/admin/attendance';
      case 'SERVICE_ENGINEER': return '/service-engineer/attendance';
      case 'SALESMAN':         return '/salesman/attendance';
      default:                 return `${basePath}/attendance`;
    }
  }

  // Stock related
  if (type === 'stock' || title.includes('stock') || title.includes('inventory')) {
    switch (upperRole) {
      case 'ADMIN':            return '/admin/stock';
      case 'SERVICE_ENGINEER': return '/service-engineer/stock-usage';
      default:                 return '/admin/stock';
    }
  }

  // SLA related
  if (type === 'sla' || title.includes('sla')) {
    switch (upperRole) {
      case 'ADMIN':            return '/admin/service/sla';
      case 'SERVICE_ENGINEER': return '/service-engineer/sla-tracker';
      default:                 return '/admin/service/sla';
    }
  }

  // Reminder / Follow-up
  if (type === 'reminder' || title.includes('follow') || title.includes('reminder')) {
    switch (upperRole) {
      case 'SALESMAN':  return '/salesman/followups';
      case 'RECEPTION': return '/reception/calls';
      default:          return `${basePath}/dashboard`;
    }
  }

  return `${basePath}/dashboard`;
};

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
  const [notifTab, setNotifTab] = useState('unread');
  const [markingAll, setMarkingAll] = useState(false);
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
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiRequest('/api/notifications/my?limit=30');
      const notificationsData = response?.data || response;
      if (Array.isArray(notificationsData)) {
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.is_read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
      await apiRequest(`/api/notifications/${notif.id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
    
    // Navigate to the correct page
    setShowNotifications(false);
    const url = getRedirectUrl(notif, role);
    navigate(url);
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiRequest('/api/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
    setMarkingAll(false);
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
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
              {unreadCount > 0 && (
                <span style={styles.bellBadge}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={styles.notifDropdown}>
                {/* Header */}
                <div style={styles.ndHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Notifications</h3>
                    {unreadCount > 0 && (
                      <span style={styles.ndBadge}>{unreadCount} new</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        disabled={markingAll}
                        style={styles.ndMarkAll}
                      >
                        {markingAll ? '...' : '✓ Mark all read'}
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)} style={styles.ndClose}>✕</button>
                  </div>
                </div>

                {/* Tabs */}
                <div style={styles.ndTabs}>
                  {['unread', 'all'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setNotifTab(tab)}
                      style={{
                        ...styles.ndTab,
                        ...(notifTab === tab ? styles.ndTabActive : {}),
                      }}
                    >
                      {tab === 'unread' ? `Unread (${unreadCount})` : 'All'}
                    </button>
                  ))}
                </div>

                {/* Notification List */}
                <div style={styles.ndList}>
                  {(() => {
                    const filtered = notifTab === 'unread'
                      ? notifications.filter(n => !n.is_read)
                      : notifications;

                    if (filtered.length === 0) {
                      return (
                        <div style={styles.ndEmpty}>
                          <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                            {notifTab === 'unread' ? '🎉' : '📭'}
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                            {notifTab === 'unread' ? 'All caught up!' : 'No notifications yet'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                            {notifTab === 'unread' ? 'No unread notifications' : 'Notifications will appear here'}
                          </div>
                        </div>
                      );
                    }

                    return filtered.slice(0, 20).map(notif => {
                      const meta = getNotifMeta(notif.notification_type || notif.module);
                      return (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif)}
                          style={{
                            ...styles.ndItem,
                            background: notif.is_read ? '#fff' : '#f8fafc',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f1f5f9';
                            e.currentTarget.style.transform = 'translateX(2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = notif.is_read ? '#fff' : '#f8fafc';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          {/* Icon */}
                          <div style={{
                            ...styles.ndIcon,
                            background: meta.bg,
                            color: meta.color,
                          }}>
                            <span style={{ fontSize: '18px' }}>{meta.icon}</span>
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                              <span style={{
                                fontSize: '14px',
                                fontWeight: notif.is_read ? '500' : '600',
                                color: '#0f172a',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                              }}>
                                {notif.title}
                              </span>
                              {!notif.is_read && <span style={styles.ndDot}></span>}
                            </div>
                            <div style={{
                              fontSize: '13px',
                              color: '#64748b',
                              lineHeight: '1.4',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {notif.message}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                              <span style={{
                                ...styles.ndTag,
                                background: meta.bg,
                                color: meta.color,
                              }}>
                                {meta.label}
                              </span>
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {timeAgo(notif.created_at)}
                              </span>
                              {notif.priority === 'HIGH' || notif.priority === 'URGENT' || notif.priority === 'critical' ? (
                                <span style={styles.ndPriority}>!</span>
                              ) : null}
                            </div>
                          </div>

                          {/* Arrow */}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: '#cbd5e1' }}>
                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                      );
                    });
                  })()}
                </div>
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
  bellBadge: {
    position: 'absolute',
    top: '4px',
    right: '2px',
    minWidth: '20px',
    height: '20px',
    padding: '0 5px',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
    animation: 'pulse 2s infinite',
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
  // New notification dropdown styles
  notifDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '440px',
    maxHeight: '620px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
    zIndex: 2000,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  ndHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 20px 14px',
    borderBottom: '1px solid #f1f5f9',
  },
  ndBadge: {
    padding: '3px 10px',
    background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
    color: '#1e40af',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '12px',
  },
  ndMarkAll: {
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#3b82f6',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  ndClose: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  ndTabs: {
    display: 'flex',
    padding: '0 20px',
    borderBottom: '1px solid #f1f5f9',
    gap: '4px',
  },
  ndTab: {
    padding: '10px 16px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  ndTabActive: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
  },
  ndList: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '480px',
  },
  ndEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  ndItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 20px',
    borderBottom: '1px solid #f8fafc',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  ndIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ndDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#3b82f6',
    flexShrink: 0,
    boxShadow: '0 0 0 3px rgba(59,130,246,0.15)',
  },
  ndTag: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  ndPriority: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: '#fef2f2',
    color: '#ef4444',
    fontSize: '11px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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

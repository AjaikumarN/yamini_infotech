import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';
import { useNotificationRouter } from '../../hooks/useNotificationRouter';

/**
 * ADMIN TOP BAR - Enhanced (SINGLE INSTANCE ONLY)
 * Global search with predictions, real-time notifications, profile
 * 
 * ⚠️ CRITICAL: This component should ONLY be rendered by DashboardLayout
 * DO NOT import this into individual pages or other layouts
 */
export default function AdminTopBar({ onMenuToggle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { handleNotificationClick, getPriorityColor } = useNotificationRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const searchRef = useRef(null);

  // Fetch real notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest('/api/notifications/my-notifications');
      setNotifications(data.slice(0, 10)); // Top 10
    } catch (error) {
      // Silently handle notification errors
      setNotifications([]);
    }
  };

  const unreadCount = notifications.filter(n => !n.read_status).length;

  // Search functionality with predictions
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await performSearch(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const performSearch = async (query) => {
    const results = [];
    
    try {
      const enquiries = await apiRequest(`/api/enquiries/?search=${encodeURIComponent(query)}`).catch(() => []);
      enquiries.slice(0, 3).forEach(e => results.push({
        id: `enq-${e.id}`,
        type: 'Enquiry',
        icon: 'assignment',
        title: e.customer_name,
        subtitle: `${e.enquiry_number} • ${e.product_name || 'N/A'}`,
        action: () => navigate(`/admin/enquiries/${e.id}`)
      }));

      // Search service requests
      const services = await apiRequest(`/api/service-requests/?search=${encodeURIComponent(query)}`).catch(() => []);
      services.slice(0, 3).forEach(s => results.push({
        id: `srv-${s.id}`,
        type: 'Service',
        icon: 'build',
        title: s.customer_name,
        subtitle: `${s.ticket_no || s.request_number} • ${s.status}`,
        action: () => navigate(`/admin/service/requests/${s.id}`)
      }));

      // Search orders
      const orders = await apiRequest(`/api/orders/?search=${encodeURIComponent(query)}`).catch(() => []);
      orders.slice(0, 3).forEach(o => results.push({
        id: `ord-${o.id}`,
        type: 'Order',
        icon: 'shopping_cart',
        title: o.customer_name || `Order #${o.id}`,
        subtitle: `₹${o.total_amount} • ${o.status}`,
        action: () => navigate(`/admin/orders/${o.id}`)
      }));

      // Search customers
      const customers = await apiRequest(`/api/customers/?search=${encodeURIComponent(query)}`).catch(() => []);
      customers.slice(0, 2).forEach(c => results.push({
        id: `cust-${c.id}`,
        type: 'Customer',
        icon: 'person',
        title: c.name,
        subtitle: c.phone || c.email,
        action: () => navigate(`/admin/customers/${c.id}`)
      }));
    } catch (error) {
      console.error('Search error:', error);
    }

    return results.slice(0, 10); // Limit to 10 results
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read_status: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/api/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationItemClick = (notification) => {
    markAsRead(notification.id);
    handleNotificationClick(notification);
    setNotificationsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div style={styles.topBar} data-component="admin-topbar" className="admin-topbar-root">
      {/* Left Section: Menu + Logo */}
      <div style={styles.leftSection}>
        <button onClick={onMenuToggle} style={styles.menuButton}>
          <span className="material-icons">menu</span>
        </button>
        <div style={styles.logoContainer}>
          <span className="material-icons" style={styles.logoIcon}>print</span>
          <span style={styles.logoText}>Yamini Infotech</span>
        </div>
      </div>

      {/* Right Section: Search + Profile */}
      <div style={styles.rightSection}>
        {/* Search */}
        <div style={styles.largeSearchWrapper} ref={searchRef}>
          <input
            type="text"
            placeholder="Search"
            style={styles.largeSearchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          />
          <button style={styles.searchButton}>
            <span className="material-icons">search</span>
          </button>

          {/* Search Results Dropdown */}
          {searchOpen && searchQuery.length >= 2 && (
            <div style={styles.searchDropdown}>
              {loading ? (
                <div style={styles.searchLoading}>Searching...</div>
              ) : searchResults.length > 0 ? (
                <>
                  <div style={styles.searchResultsHeader}>
                    Found {searchResults.length} results
                  </div>
                  {searchResults.map(result => (
                    <div
                      key={result.id}
                      style={styles.searchResultItem}
                      onClick={() => {
                        result.action();
                        setSearchQuery('');
                        setSearchOpen(false);
                      }}
                    >
                      <div style={styles.searchResultIcon}>
                        <span className="material-icons" style={{ fontSize: '18px', color: '#6366f1' }}>
                          {result.icon}
                        </span>
                      </div>
                      <div style={styles.searchResultContent}>
                        <div style={styles.searchResultTitle}>{result.title}</div>
                        <div style={styles.searchResultSubtitle}>
                          <span style={styles.searchResultType}>{result.type}</span> • {result.subtitle}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={styles.searchEmpty}>
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Icon */}
        <div style={styles.profileWrapper}>
          <button
            style={styles.profileButton}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <span className="material-icons">account_circle</span>
          </button>

          {/* User Dropdown */}
          {userMenuOpen && (
            <div style={styles.userDropdown}>
              <div style={styles.userDropdownHeader}>
                <div style={styles.userAvatar}>
                  <span className="material-icons">account_circle</span>
                </div>
                <div>
                  <div style={styles.userName}>{user?.name || user?.username || 'Admin'}</div>
                  <div style={styles.userRole}>Administrator</div>
                </div>
              </div>
              <div style={styles.dropdownDivider} />
              <button style={styles.logoutButton} onClick={handleLogout}>
                <span className="material-icons" style={{ fontSize: '18px' }}>logout</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    height: '70px',
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'sticky',
    top: 0,
    zIndex: 999,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flex: '0 0 auto'
  },
  menuButton: {
    width: '44px',
    height: '44px',
    border: 'none',
    background: 'transparent',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.2s',
    fontSize: '24px'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logoIcon: {
    fontSize: '32px',
    color: '#6366f1'
  },
  logoText: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: '0.3px'
  },
  largeSearchWrapper: {
    position: 'relative',
    width: '550px',
    display: 'flex',
    alignItems: 'center'
  },
  largeSearchInput: {
    width: '100%',
    padding: '13px 60px 13px 24px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '30px',
    fontSize: '15px',
    color: '#374151',
    background: '#ffffff',
    outline: 'none',
    transition: 'all 0.3s',
    fontWeight: '400',
    '::placeholder': {
      color: '#9ca3af'
    }
  },
  searchButton: {
    position: 'absolute',
    right: '6px',
    width: '44px',
    height: '44px',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#ffffff',
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
  },
  searchDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    zIndex: 1000,
    maxHeight: '400px',
    overflowY: 'auto'
  },
  searchResultsHeader: {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    borderBottom: '1px solid #f3f4f6'
  },
  searchResultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    ':hover': {
      background: '#f9fafb'
    }
  },
  searchResultIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  searchResultContent: {
    flex: 1,
    minWidth: 0
  },
  searchResultTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  searchResultSubtitle: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px'
  },
  searchResultType: {
    fontWeight: '600',
    color: '#6366f1'
  },
  searchLoading: {
    padding: '32px 16px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px'
  },
  searchEmpty: {
    padding: '32px 16px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flex: '0 0 auto'
  },
  profileWrapper: {
    position: 'relative'
  },
  profileButton: {
    width: '48px',
    height: '48px',
    border: 'none',
    background: '#f3f4f6',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.3s',
    fontSize: '28px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  },
  userDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    minWidth: '260px',
    zIndex: 1000,
    overflow: 'hidden'
  },
  userDropdownHeader: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #e5e7eb',
    background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)'
  },
  userAvatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '32px',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
  },
  userName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px'
  },
  userRole: {
    fontSize: '13px',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    fontWeight: '600'
  },
  dropdownDivider: {
    height: '1px',
    background: '#e5e7eb',
    margin: 0
  },
  logoutButton: {
    width: '100%',
    padding: '14px 20px',
    border: 'none',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ef4444',
    transition: 'all 0.2s',
    textAlign: 'left'
  },
  avatarPlaceholder: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase'
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px'
  },
  profileName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827'
  },
  profileRole: {
    fontSize: '12px',
    color: '#6b7280'
  },
  dropdownArrow: {
    fontSize: '20px',
    color: '#9ca3af'
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '320px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    zIndex: 1000
  },
  dropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #f3f4f6'
  },
  dropdownTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827'
  },
  markAllRead: {
    fontSize: '12px',
    color: '#6366f1',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500'
  },
  notificationList: {
    maxHeight: '320px',
    overflowY: 'auto'
  },
  notificationItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    position: 'relative',
    ':hover': {
      background: '#f9fafb'
    }
  },
  notifIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  notifContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  notifText: {
    fontSize: '13px',
    color: '#374151'
  },
  notifTime: {
    fontSize: '11px',
    color: '#9ca3af'
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    background: '#6366f1',
    borderRadius: '50%',
    position: 'absolute',
    top: '20px',
    right: '16px'
  },
  dropdownFooter: {
    padding: '12px',
    borderTop: '1px solid #f3f4f6'
  },
  viewAllButton: {
    width: '100%',
    padding: '8px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6366f1',
    cursor: 'pointer',
    transition: 'background 0.2s',
    ':hover': {
      background: '#f9fafb'
    }
  },
  profileDropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderBottom: '1px solid #f3f4f6'
  },
  profileDropdownAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '600',
    color: '#6366f1'
  },
  profileDropdownName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827'
  },
  profileDropdownEmail: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px'
  },
  profileMenuList: {
    padding: '8px'
  },
  profileMenuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
    transition: 'background 0.2s',
    textAlign: 'left',
    ':hover': {
      background: '#f9fafb'
    }
  },
  profileMenuIcon: {
    fontSize: '18px',
    color: '#9ca3af'
  },
  profileMenuDivider: {
    height: '1px',
    background: '#f3f4f6',
    margin: '8px 0'
  },
  profileMenuItemDanger: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'background 0.2s',
    textAlign: 'left',
    ':hover': {
      background: '#fef2f2'
    }
  }
};

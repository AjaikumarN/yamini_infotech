import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

/**
 * ADMIN SIDEBAR - Able Pro Style
 * Left navigation with collapsible groups and active states
 */
export default function AdminSidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const [badgeCounts, setBadgeCounts] = useState({ enquiries: 0, orders: 0, complaints: 0 });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const data = await apiRequest('/api/notifications/badge-counts');
        if (data) setBadgeCounts(data);
      } catch (e) {
        console.error('Badge fetch failed:', e);
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, []);

  const [expandedGroups, setExpandedGroups] = useState({
    employees: true,
    inventory: false,
    sales: false,
    finance: false,
    service: false,
    operations: false,
    insights: false,
    system: false
  });

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const menuItems = [
    {
      section: 'overview',
      items: [
        { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' }
      ]
    },
    {
      section: 'employees',
      title: 'Employees',
      icon: 'people',
      expanded: expandedGroups.employees,
      items: [
        { path: '/admin/employees', icon: 'badge', label: 'All Employees' },
        { path: '/admin/employees/salesmen', icon: 'support_agent', label: 'Salesmen' },
        { path: '/admin/employees/engineers', icon: 'engineering', label: 'Engineers' },
        { path: '/admin/employees/reception', icon: 'desk', label: 'Reception' }
      ]
    },
    {
      section: 'inventory',
      title: 'Inventory',
      icon: 'inventory_2',
      expanded: expandedGroups.inventory,
      items: [
        { path: '/admin/products', icon: 'category', label: 'Products' },
        { path: '/admin/stock', icon: 'warehouse', label: 'Stock' },
        { path: '/admin/stock-analytics', icon: 'analytics', label: 'Stock Analytics' }
      ]
    },
    {
      section: 'sales',
      title: 'Sales',
      icon: 'shopping_cart',
      expanded: expandedGroups.sales,
      items: [
        { path: '/admin/enquiries', icon: 'contact_page', label: 'Enquiries', badge: badgeCounts.enquiries || 0 },
        { path: '/admin/orders', icon: 'receipt_long', label: 'Orders', badge: badgeCounts.orders || 0 }
      ]
    },
    {
      section: 'finance',
      title: 'Finance',
      icon: 'account_balance',
      expanded: expandedGroups.finance,
      items: [
        { path: '/admin/invoices', icon: 'description', label: 'Invoices' },
        { path: '/admin/outstanding', icon: 'payments', label: 'Outstanding' }
      ]
    },
    {
      section: 'service',
      title: 'Service',
      icon: 'build',
      expanded: expandedGroups.service,
      items: [
        { path: '/admin/service/requests', icon: 'assignment', label: 'Requests', badge: badgeCounts.complaints || 0 },
        { path: '/admin/service/sla', icon: 'schedule', label: 'SLA Monitor' },
        { path: '/admin/mif', icon: 'lock', label: 'MIF', confidential: true }
      ]
    },
    {
      section: 'operations',
      title: 'Operations',
      icon: 'work',
      expanded: expandedGroups.operations,
      items: [
        { path: '/admin/attendance', icon: 'event_available', label: 'Attendance' },
        { path: '/admin/live-map', icon: 'location_on', label: 'Live Map' }
      ]
    },
    {
      section: 'insights',
      title: 'Insights',
      icon: 'analytics',
      expanded: expandedGroups.insights,
      items: [
        { path: '/admin/analytics', icon: 'bar_chart', label: 'Analytics' }
      ]
    },
    {
      section: 'system',
      title: 'System',
      icon: 'settings',
      expanded: expandedGroups.system,
      items: [
        { path: '/admin/employees/new', icon: 'person_add', label: 'New Employee' },
        { path: '/admin/employees/all', icon: 'edit', label: 'Edit Employee' },
        { path: '/admin/whatsapp-logs', icon: 'chat', label: 'WhatsApp Logs' },
        { path: '/admin/settings', icon: 'tune', label: 'Settings' }
      ]
    }
  ];

  return (
    <div style={{
      ...styles.sidebar,
      width: collapsed ? '70px' : '260px'
    }}>
      {/* Navigation */}
      <nav style={styles.nav}>
        {menuItems.map((section, idx) => (
          <div key={idx} style={styles.section}>
            {/* Single items (no group) */}
            {section.section === 'overview' && section.items.map((item, itemIdx) => (
              <NavLink
                key={itemIdx}
                to={item.path}
                style={({ isActive }) => ({
                  ...styles.menuItem,
                  ...(isActive ? styles.menuItemActive : {})
                })}
              >
                <span className="material-icons" style={styles.menuIcon}>
                  {item.icon}
                </span>
                {!collapsed && <span style={styles.menuLabel}>{item.label}</span>}
              </NavLink>
            ))}

            {/* Grouped items with dropdown */}
            {section.title && (
              <>
                <div
                  style={styles.groupHeader}
                  onClick={() => !collapsed && toggleGroup(section.section)}
                >
                  <div style={styles.groupHeaderLeft}>
                    <span className="material-icons" style={styles.groupIcon}>
                      {section.icon}
                    </span>
                    {!collapsed && <span style={styles.groupTitle}>{section.title}</span>}
                  </div>
                  {!collapsed && (
                    <span className="material-icons" style={styles.expandIcon}>
                      {section.expanded ? 'expand_less' : 'expand_more'}
                    </span>
                  )}
                </div>

                {/* Subitems */}
                {(section.expanded || collapsed) && section.items.map((item, itemIdx) => (
                  <NavLink
                    key={itemIdx}
                    to={item.path}
                    style={({ isActive }) => ({
                      ...styles.subMenuItem,
                      ...(collapsed ? styles.menuItem : {}),
                      ...(isActive ? styles.subMenuItemActive : {})
                    })}
                  >
                    <span className="material-icons" style={styles.subMenuIcon}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <>
                        <span style={styles.subMenuLabel}>
                          {item.label}
                          {item.confidential && (
                            <span className="material-icons" style={{ fontSize: '12px', marginLeft: '4px', color: '#ef4444' }}>
                              verified_user
                            </span>
                          )}
                        </span>
                        {item.badge && (
                          <span style={styles.badge}>{item.badge}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div style={styles.footer}>
        <button
          onClick={onToggle}
          style={styles.collapseBtn}
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
          {!collapsed && <span style={{ fontSize: '13px' }}>Collapse</span>}
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    height: '100vh',
    background: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    transition: 'width 0.3s ease',
    zIndex: 1000,
    overflowY: 'auto',
    overflowX: 'hidden'
  },
  logo: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #f3f4f6',
    minHeight: '64px'
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    background: '#eef2ff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827'
  },
  nav: {
    flex: 1,
    padding: '16px 0',
    overflowY: 'auto'
  },
  section: {
    marginBottom: '8px'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 20px',
    color: '#6b7280',
    textDecoration: 'none',
    transition: 'all 0.2s',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'transparent'
  },
  menuItemActive: {
    background: '#eef2ff',
    color: '#6366f1',
    borderLeftColor: '#6366f1'
  },
  menuIcon: {
    fontSize: '20px'
  },
  menuLabel: {
    flex: 1
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    ':hover': {
      background: '#f9fafb'
    }
  },
  groupHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  groupIcon: {
    fontSize: '20px',
    color: '#9ca3af'
  },
  groupTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  expandIcon: {
    fontSize: '18px',
    color: '#9ca3af'
  },
  subMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 20px 8px 52px',
    color: '#6b7280',
    textDecoration: 'none',
    transition: 'all 0.2s',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500'
  },
  subMenuItemActive: {
    background: '#f9fafb',
    color: '#6366f1'
  },
  subMenuIcon: {
    fontSize: '18px'
  },
  subMenuLabel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center'
  },
  badge: {
    background: '#ef4444',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '10px',
    minWidth: '18px',
    textAlign: 'center'
  },
  footer: {
    padding: '12px',
    borderTop: '1px solid #f3f4f6'
  },
  collapseBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px',
    background: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '13px',
    fontWeight: '500',
    ':hover': {
      background: '#f9fafb',
      borderColor: '#d1d5db'
    }
  }
};

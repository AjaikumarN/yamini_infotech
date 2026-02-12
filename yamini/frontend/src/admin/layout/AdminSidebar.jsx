import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../styles/designSystem';
import { getUploadUrl as getPhotoUrl } from '../../config';

/**
 * Material Icon Component
 */
const MaterialIcon = ({ name, style = {} }) => (
  <span 
    className="material-icons" 
    style={{ 
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style 
    }}
  >
    {name}
  </span>
);

/**
 * AdminSidebar - Enterprise Navigation Sidebar
 * Always visible on desktop/tablet, hidden on mobile
 * Compact mode for tablets (narrower with space efficiency)
 */
export default function AdminSidebar({ isCompact: initialCompact = false, onClose }) {
  const location = useLocation();
  const { user } = useAuth();
  const [isCompact, setIsCompact] = useState(initialCompact);
  
  // Reception-specific menu
  const receptionSections = [
    {
      title: 'Overview',
      items: [
        { icon: 'dashboard', label: 'Dashboard', path: '/reception/dashboard' }
      ]
    },
    {
      title: 'Daily Operations',
      items: [
        { icon: 'phone', label: 'Call Management', path: '/reception/call-management' },
        { icon: 'assignment', label: 'Enquiry Board', path: '/reception/enquiries' },
        { icon: 'build', label: 'Service Complaints', path: '/reception/service-complaints' },
        { icon: 'people', label: 'Visitor Log', path: '/reception/visitors' }
      ]
    },
    {
      title: 'Records',
      items: [
        { icon: 'history', label: 'Call History', path: '/reception/calls' },
        { icon: 'local_shipping', label: 'Delivery Log', path: '/reception/delivery-log' },
        { icon: 'account_balance_wallet', label: 'Outstanding', path: '/reception/outstanding' }
      ]
    },
    {
      title: 'Settings',
      items: [
        { icon: 'settings', label: 'Settings', path: '/reception/settings' }
      ]
    }
  ];

  const sections = user?.role === 'RECEPTION' ? receptionSections : [
    {
      title: 'Overview',
      items: [
        { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' }
      ]
    },
    {
      title: 'Employees',
      items: [
        { icon: 'groups', label: 'All Employees', path: '/admin/employees/salesmen' },
        { icon: 'badge', label: 'Salesmen', path: '/admin/employees/salesmen' },
        { icon: 'engineering', label: 'Engineers', path: '/admin/employees/engineers' },
        { icon: 'domain', label: 'Reception', path: '/admin/employees/reception' }
      ]
    },
    {
      title: 'Inventory',
      items: [
        { icon: 'inventory_2', label: 'Products', path: '/admin/products' },
        { icon: 'warehouse', label: 'Stock', path: '/admin/stock' }
      ]
    },
    {
      title: 'Sales',
      items: [
        { icon: 'assignment', label: 'Enquiries', path: '/admin/enquiries' },
        { icon: 'shopping_cart', label: 'Orders', path: '/admin/orders' }
      ]
    },
    {
      title: 'Finance',
      items: [
        { icon: 'receipt', label: 'Invoices', path: '/admin/invoices' },
        { icon: 'account_balance', label: 'Outstanding', path: '/admin/outstanding' }
      ]
    },
    {
      title: 'Service',
      items: [
        { icon: 'build', label: 'Requests', path: '/admin/service/requests' },
        { icon: 'schedule', label: 'SLA Monitor', path: '/admin/service/sla' },
        { icon: 'description', label: 'MIF', path: '/admin/service/mif' }
      ]
    },
    {
      title: 'Operations',
      items: [
        { icon: 'access_time', label: 'Attendance', path: '/admin/attendance' },
        { icon: 'location_on', label: 'Live Tracking', path: '/admin/live-map' },
        { icon: 'phone_android', label: 'Device Status', path: '/admin/device-status' },
        { icon: 'fence', label: 'Geofences', path: '/admin/geofences' },
        { icon: 'bolt', label: 'Workflows', path: '/admin/workflows' }
      ]
    },
    {
      title: 'Insights',
      items: [
        { icon: 'analytics', label: 'Analytics', path: '/admin/analytics' },
        { icon: 'assessment', label: 'Reports', path: '/admin/reports' }
      ]
    },
    {
      title: 'System',
      items: [
        { icon: 'person_add', label: 'New Employee', path: '/admin/new-employee' },
        { icon: 'people', label: 'View Employees', action: 'viewEmployees' },
        { icon: 'settings', label: 'Settings', path: '/admin/settings' }
      ]
    }
  ];

  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    const menuSections = user?.role === 'RECEPTION' ? receptionSections : sections;
    menuSections.forEach((section) => {
      initial[section.title] = true;
    });
    return initial;
  });

  const isPathActive = (path) => {
    if (!path) return false;
    return location.pathname === path ||
      (path !== '/admin/dashboard' && 
       path !== '/reception/dashboard' && 
       location.pathname.startsWith(path));
  };

  useEffect(() => {
    setOpenSections((prev) => {
      let changed = false;
      const next = { ...prev };
      const menuSections = user?.role === 'RECEPTION' ? receptionSections : sections;
      menuSections.forEach((section) => {
        const active = section.items.some((item) => isPathActive(item.path));
        if (active && !prev[section.title]) {
          next[section.title] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [location.pathname]);


  const openEmployeesSection = () => {
    // Trigger inline panel to show in Admin layout
    window.dispatchEvent(new Event('showEmployeesPanel'));
  };

  if (!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/reception')) {
    return null;
  }

  const sidebarStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: isCompact ? '100px' : '280px',
    height: '100vh',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
    borderRight: '1px solid #e5e7eb',
    zIndex: theme.zIndex.sidebar,
    overflow: isCompact ? 'hidden' : 'auto',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease'
  };

  const headerStyles = {
    padding: isCompact ? '16px 12px' : '20px 16px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    minHeight: '70px'
  };

  const logoBoxStyles = {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: '#0ea5e9',
    fontWeight: '700',
    flexShrink: 0,
    cursor: 'pointer',
    overflow: 'hidden',
    border: '2px solid #0ea5e9'
  };
  
  const profileImageStyles = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  };

  const logoTextStyles = {
    flex: 1,
    minWidth: 0
  };

  const logoTitleStyles = {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 2px 0',
    lineHeight: '1.2'
  };

  const collapseButtonStyles = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#f0f0f0',
    border: 'none',
    color: '#1f2937',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0,
    backdropFilter: 'blur(10px)'
  };

  const navStyles = {
    padding: isCompact ? '8px 8px' : '12px 8px'
  };

  const sectionHeaderStyles = {
    fontSize: '11px',
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    padding: isCompact ? '0' : '12px 16px',
    marginBottom: '8px',
    marginTop: '12px',
    display: isCompact ? 'none' : 'block'
  };

  const getLinkStyles = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: isCompact ? 'center' : 'flex-start',
    gap: isCompact ? '0' : '12px',
    padding: isCompact ? '12px 8px' : '12px 14px',
    marginBottom: '4px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    color: isActive ? '#0ea5e9' : '#6b7280',
    backgroundColor: isActive ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: isCompact ? 'center' : 'left',
    position: 'relative'
  });

  const iconStyles = {
    fontSize: '20px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  const labelStyles = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: isCompact ? 'none' : 'block'
  };

  return (
    <aside style={sidebarStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={logoBoxStyles}>
          {getPhotoUrl(user?.photograph) ? (
            <img 
              src={getPhotoUrl(user.photograph)} 
              alt={user.full_name} 
              style={profileImageStyles}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
            />
          ) : null}
          <span style={{ fontSize: '24px', display: getPhotoUrl(user?.photograph) ? 'none' : 'flex' }}>👔</span>
        </div>
        {!isCompact && (
          <div style={logoTextStyles}>
            <div style={logoTitleStyles}>Admin</div>
          </div>
        )}
        <button
          style={collapseButtonStyles}
          onClick={() => setIsCompact(!isCompact)}
          title={isCompact ? 'Expand' : 'Collapse'}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>
            {isCompact ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav style={navStyles}>
        {(user?.role === 'RECEPTION' ? receptionSections : sections).map((section, idx) => {
          const sectionHasActive = section.items.some((item) => isPathActive(item.path));

          const toggleSection = () => {
            setOpenSections((prev) => ({ ...prev, [section.title]: !prev[section.title] }));
          };

          const itemsWrapperStyle = {
            maxHeight: openSections[section.title] ? '800px' : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.25s ease, opacity 0.2s ease',
            opacity: openSections[section.title] ? 1 : 0,
            pointerEvents: openSections[section.title] ? 'auto' : 'none',
            paddingTop: openSections[section.title] ? '4px' : '0'
          };

          return (
            <div key={idx}>
              <button
                type="button"
                onClick={toggleSection}
                aria-expanded={openSections[section.title]}
                style={{
                  ...sectionHeaderStyles,
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{section.title}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  {openSections[section.title] ? '▾' : '▸'}
                </span>
              </button>

              <div style={itemsWrapperStyle}>
                {section.items.map((item, itemIdx) => {
                  const isActive = isPathActive(item.path);

                  return item.action === 'viewEmployees' ? (
                    <button
                      key={itemIdx}
                      type="button"
                      onClick={openEmployeesSection}
                      style={getLinkStyles(false)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <MaterialIcon name={item.icon} />
                      <span style={labelStyles}>
                        {item.label}
                      </span>
                    </button>
                  ) : (
                    <NavLink
                      key={itemIdx}
                      to={item.path}
                      style={getLinkStyles(isActive)}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <MaterialIcon name={item.icon} />
                      <span style={labelStyles}>
                        {item.label}
                      </span>
                      
                      {/* Active indicator dot */}
                      {isActive && (
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          width: '6px',
                          height: '6px',
                          backgroundColor: '#0ea5e9',
                          borderRadius: '50%'
                        }} />
                      )}
                    </NavLink>
                  );
                })}
              </div>

            </div>
          );
        })}
      </nav>
    </aside>
  );
}

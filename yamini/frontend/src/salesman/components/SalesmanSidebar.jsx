import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEmployeePhotoUrl as getPhotoUrl } from '../../config';

/**
 * Material Icon Component
 */
const MaterialIcon = ({ name }) => (
  <span 
    className="material-icons"
    style={{
      fontSize: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFeatureSettings: '"liga" 1'
    }}
  >
    {name}
  </span>
);

const SalesmanSidebar = ({ isOpen, onClose, initialCompact = false }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openSections, setOpenSections] = useState({});
  const [isCompact, setIsCompact] = useState(initialCompact);

  const sections = [
    {
      title: 'Main',
      items: [
        { icon: 'home', label: 'Dashboard', path: '/salesman/dashboard' },
        { icon: 'access_time', label: 'Attendance', path: '/salesman/attendance' },
        { icon: 'location_on', label: 'Location Sharing', path: '/salesman/location' },
        { icon: 'route', label: 'Visit Overview', path: '/salesman/visit-overview' }
      ]
    },
    {
      title: 'Sales Activities',
      items: [
        { icon: 'assignment', label: 'Enquiries & Leads', path: '/salesman/enquiries' },
        { icon: 'call', label: 'Calls', path: '/salesman/calls' },
        { icon: 'autorenew', label: 'Follow-Ups', path: '/salesman/followups' },
        { icon: 'receipt', label: 'Orders', path: '/salesman/orders' }
      ]
    },
    {
      title: 'Reports & Compliance',
      items: [
        { icon: 'description', label: 'Daily Report', path: '/salesman/daily-report' },
        { icon: 'gavel', label: 'Discipline & Compliance', path: '/salesman/compliance' }
      ]
    }
  ];

  const isPathActive = (path) =>
    location.pathname === path ||
    (path !== '/salesman/dashboard' && location.pathname.startsWith(path));

  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev };
      sections.forEach((section) => {
        const active = section.items.some((item) => isPathActive(item.path));
        if (active) {
          next[section.title] = true;
        }
      });
      return next;
    });
  }, [location.pathname]);

  const sidebarStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: isCompact ? '80px' : '240px',
    height: '100vh',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
    borderRight: '1px solid #e5e7eb',
    zIndex: 1000,
    overflow: isCompact ? 'hidden' : 'auto',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    display: !isOpen ? 'none' : 'flex',
    flexDirection: 'column'
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
    color: '#10b981',
    fontWeight: '700',
    flexShrink: 0,
    overflow: 'hidden',
    border: '2px solid #10b981'
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
    flexShrink: 0
  };

  const navStyles = {
    padding: isCompact ? '8px 8px' : '12px 8px',
    flex: 1,
    overflowY: 'auto'
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
    color: isActive ? '#10b981' : '#6b7280',
    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
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

  const logoutButtonStyles = {
    width: 'calc(100% - 32px)',
    margin: '16px auto',
    padding: '10px 12px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center'
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
            display: window.innerWidth > 768 ? 'none' : 'block'
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside style={sidebarStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <div style={logoBoxStyles}>
            {getPhotoUrl(user?.photograph) ? (
              <img 
                src={getPhotoUrl(user.photograph)} 
                alt={user.full_name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
              />
            ) : null}
            <span style={{ fontSize: '24px', display: getPhotoUrl(user?.photograph) ? 'none' : 'flex' }}>👔</span>
          </div>
          {!isCompact && (
            <div style={logoTextStyles}>
              <div style={logoTitleStyles}>Salesman</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={navStyles}>
          {sections.map((section) => (
            <div key={section.title}>
              <div style={sectionHeaderStyles}>{section.title}</div>
              {section.items.map((item) => {
                const isActive = isPathActive(item.path);
                return (
                  <NavLink
                    key={item.path}
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
                    <span style={labelStyles}>{item.label}</span>
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%'
                      }} />
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout Button at Bottom */}
        <div style={{
          marginTop: 'auto',
          padding: isCompact ? '8px 8px' : '12px 8px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            style={{
              width: '100%',
              padding: isCompact ? '8px 12px' : '12px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: isCompact ? '12px' : '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCompact ? 'center' : 'flex-start',
              gap: isCompact ? '0' : '8px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            title={isCompact ? 'Logout' : ''}
          >
            <MaterialIcon name="logout" />
            {!isCompact && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default SalesmanSidebar;

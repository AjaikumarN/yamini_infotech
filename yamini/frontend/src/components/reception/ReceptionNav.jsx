import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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

const ReceptionNav = ({ isOpen, onClose, initialCompact = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [openSections, setOpenSections] = useState({});
  const [isCompact, setIsCompact] = useState(initialCompact);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('ReceptionNav - isOpen:', isOpen, 'isCompact:', isCompact, 'isMobile:', isMobile);
  }, [isOpen, isCompact, isMobile]);

  const sections = [
    {
      title: 'Main',
      items: [
        { icon: 'home', label: 'Dashboard', path: '/reception/dashboard' },
        { icon: 'schedule', label: 'Enquiry Board', path: '/reception/enquiries' }
      ]
    },
    {
      title: 'Operations',
      items: [
        { icon: 'phone', label: 'Calls & Target', path: '/reception/calls' },
        { icon: 'build', label: 'Service Complaints', path: '/reception/service-complaints' },
        { icon: 'warning', label: 'Repeat Complaints', path: '/reception/repeat-complaints' }
      ]
    },
    {
      title: 'Records',
      items: [
        { icon: 'local_shipping', label: 'Delivery Log', path: '/reception/delivery-log' },
        { icon: 'people', label: 'Visitor Log', path: '/reception/visitors' }
      ]
    },
    {
      title: 'Reports',
      items: [
        { icon: 'currency_rupee', label: 'Outstanding', path: '/reception/outstanding' },
        { icon: 'description', label: 'Missing Reports', path: '/reception/missing-reports' }
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: 'settings', label: 'Settings', path: '/reception/settings' },
        { icon: 'person', label: 'Profile', path: '/reception/profile' }
      ]
    }
  ];

  const isPathActive = (path) =>
    location.pathname === path ||
    (path !== '/reception/dashboard' && location.pathname.startsWith(path));

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

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const sidebarStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: isCompact ? '100px' : '280px',
    height: '100vh',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
    borderRight: '1px solid #e5e7eb',
    zIndex: 1000,
    overflow: isCompact ? 'hidden' : 'auto',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    // Hide completely when isOpen is false (hamburger menu controls this)
    display: !isOpen ? 'none' : 'flex',
    flexDirection: 'column',
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
    color: '#06b6d4',
    fontWeight: '700',
    flexShrink: 0,
    overflow: 'hidden',
    border: '2px solid #06b6d4'
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
    color: isActive ? '#06b6d4' : '#6b7280',
    backgroundColor: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
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
    background: '#ef4444',
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
      {/* Backdrop for when sidebar is open */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: isMobile ? 'block' : 'none',
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside style={sidebarStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <div style={logoBoxStyles}>
            {getPhotoUrl(user?.photo || user?.photograph) ? (
              <img src={getPhotoUrl(user.photo || user.photograph)} alt={user.name || user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '24px' }}>📱</span>
            )}
          </div>
          {!isCompact && (
            <div style={logoTextStyles}>
              <div style={logoTitleStyles}>Reception</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={navStyles}>
          {sections.map((section) => (
            <div key={section.title}>
              {/* Section Header */}
              <div style={sectionHeaderStyles}>
                {section.title}
              </div>

              {/* Section Items */}
              {section.items.map((item) => {
                const isActive = isPathActive(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    style={getLinkStyles(isActive)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={iconStyles}>
                      <MaterialIcon name={item.icon} />
                    </div>
                    <span style={labelStyles}>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '12px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button
            style={logoutButtonStyles}
            onClick={handleLogout}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            title="Logout"
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <MaterialIcon name="logout" />
              {!isCompact && <span>Logout</span>}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default ReceptionNav;

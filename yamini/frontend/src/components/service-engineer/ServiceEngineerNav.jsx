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

const ServiceEngineerNav = ({ isOpen, onClose, initialCompact = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [openSections, setOpenSections] = useState({});
  const [isCompact, setIsCompact] = useState(initialCompact);

  const sections = [
    {
      title: 'Main',
      items: [
        { icon: 'home', label: 'Dashboard', path: '/service-engineer/dashboard' },
        { icon: 'access_time', label: 'Daily Start', path: '/service-engineer/attendance' },
        { icon: 'route', label: 'Job Route', path: '/service-engineer/job-route' }
      ]
    },
    {
      title: 'Work Management',
      items: [
        { icon: 'build', label: 'Assigned Jobs', path: '/service-engineer/jobs' },
        { icon: 'history', label: 'Service History', path: '/service-engineer/history' },
        { icon: 'schedule', label: 'SLA Tracker', path: '/service-engineer/sla-tracker' },
        { icon: 'inventory_2', label: 'My Stock Usage', path: '/service-engineer/stock-usage' }
      ]
    },
    {
      title: 'Reports & Feedback',
      items: [
        { icon: 'star', label: 'Customer Feedback', path: '/service-engineer/feedback' },
        { icon: 'assignment', label: 'Daily Update', path: '/service-engineer/daily-report' }
      ]
    }
  ];

  const isPathActive = (path) =>
    location.pathname === path ||
    (path !== '/service-engineer/dashboard' && location.pathname.startsWith(path));

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
    padding: isCompact ? '16px 8px' : '20px 16px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: isCompact ? 'center' : 'space-between',
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
    color: '#3b82f6',
    fontWeight: '700',
    flexShrink: 0,
    overflow: 'hidden',
    border: '2px solid #3b82f6'
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
    color: isActive ? '#3b82f6' : '#6b7280',
    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
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
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Backdrop for mobile only */}
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
            display: window.innerWidth > 1024 ? 'none' : 'block'
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
              <span style={{ fontSize: '24px' }}>🔧</span>
            )}
          </div>
          {!isCompact && (
            <div style={logoTextStyles}>
              <div style={logoTitleStyles}>Service Engineer</div>
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
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                        e.currentTarget.style.color = '#1e40af';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6b7280';
                      }
                    }}
                  >
                    <span style={iconStyles}>
                      <MaterialIcon name={item.icon} />
                    </span>
                    <span style={labelStyles}>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          style={logoutButtonStyles}
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.target.style.background = '#dc2626';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#ef4444';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-icons" style={{ fontSize: '18px', marginRight: '6px' }}>logout</span>
          </span>
          {!isCompact && 'Logout'}
        </button>
      </aside>
    </>
  );
};

export default ServiceEngineerNav;

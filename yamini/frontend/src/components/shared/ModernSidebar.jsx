import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEmployeePhotoUrl as getPhotoUrl } from '../../config';

/**
 * Material Icon Component
 */
const MaterialIcon = ({ name }) => (
  <span 
    className="material-icons"
    style={{
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFeatureSettings: '"liga" 1'
    }}
  >
    {name}
  </span>
);

/**
 * Modern Dark Theme Sidebar Component
 * Reusable for all module navigations
 */
const ModernSidebar = ({ isOpen, onClose, config }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCompact, setIsCompact] = useState(false);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const handleNavClick = () => {
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      <style>{`
        .ms-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          opacity: ${isOpen ? '1' : '0'};
          visibility: ${isOpen ? 'visible' : 'hidden'};
          transition: opacity 0.25s ease, visibility 0.25s ease;
          z-index: 999;
        }

        .modern-sidebar {
          position: fixed;
          left: ${isOpen ? '0' : '-' + (isCompact ? '80px' : '280px')};
          top: 0;
          width: ${isCompact ? '80px' : '280px'};
          height: 100vh;
          background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          transition: all 0.3s ease;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border-right: 1px solid #e5e7eb;
          overflow: ${isCompact ? 'hidden' : 'auto'};
        }

        .ms-header {
          background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
          padding: ${isCompact ? '16px 8px' : '20px 16px'};
          position: relative;
          display: flex;
          align-items: center;
          justify-content: ${isCompact ? 'center' : 'space-between'};
          gap: 12px;
          min-height: 70px;
          border-bottom: 1px solid #e5e7eb;
          flex-wrap: nowrap;
        }

        .ms-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .ms-header-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, ${config.gradientStart} 0%, ${config.gradientEnd} 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .ms-header-text {
          flex: 1;
          min-width: 0;
          display: ${isCompact ? 'none' : 'block'};
        }

        .ms-header-title { 
          margin: 0; 
          color: #1f2937; 
          font-size: 16px; 
          font-weight: 700;
          line-height: 1.2;
        }

        .ms-header-subtitle { 
          display: none;
        }

        .ms-close-btn {
          background: #f3f4f6;
          border: none;
          color: #1f2937;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .ms-close-btn:hover { 
          background: #e5e7eb;
        }

        .ms-nav {
          flex: 1 1 auto;
          overflow-y: auto;
          padding: ${isCompact ? '8px 8px' : '12px 8px'};
          min-height: 0;
        }

        .ms-section-title { 
          padding: ${isCompact ? '0' : '12px 16px'};
          color: #9ca3af; 
          font-size: 11px; 
          font-weight: 700; 
          text-transform: uppercase; 
          letter-spacing: 0.6px;
          display: ${isCompact ? 'none' : 'block'};
          margin-top: 12px;
          margin-bottom: 8px;
        }

        .ms-nav-item { 
          display: flex; 
          align-items: center; 
          justify-content: ${isCompact ? 'center' : 'flex-start'};
          gap: ${isCompact ? '0' : '12px'}; 
          padding: ${isCompact ? '12px 8px' : '12px 14px'}; 
          margin: 4px 0;
          color: #6b7280; 
          text-decoration: none; 
          border-radius: 10px; 
          cursor: pointer; 
          transition: all 0.2s ease;
          border: none;
          background: transparent;
          width: 100%;
          text-align: ${isCompact ? 'center' : 'left'};
          position: relative;
          font-weight: 500;
          font-size: 14px;
        }
        
        .ms-nav-item:hover { 
          background: #f3f4f6;
        }
        
        .ms-nav-item.active { 
          background: rgba(59, 130, 246, 0.08); 
          color: ${config.accentColor || '#3b82f6'}; 
          font-weight: 600;
        }

        .ms-nav-icon-wrapper { 
          width: 24px; 
          height: 24px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          flex-shrink: 0;
        }

        .ms-nav-icon { 
          font-size: 20px;
        }

        .ms-nav-label { 
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: ${isCompact ? 'none' : 'block'};
        }

        .ms-divider { 
          display: ${isCompact ? 'none' : 'block'};
          height: 1px; 
          background: #e5e7eb; 
          margin: 8px 0;
        }

        .ms-footer { 
          padding: 16px 8px;
          flex-shrink: 0;
          border-top: 1px solid #e5e7eb;
        }

        .ms-logout-btn { 
          width: 100%; 
          display: flex; 
          align-items: center; 
          justify-content: ${isCompact ? 'center' : 'flex-start'}; 
          gap: 10px; 
          padding: ${isCompact ? '12px 8px' : '12px 14px'}; 
          background: linear-gradient(135deg, ${config.gradientStart} 0%, ${config.gradientEnd} 100%);
          color: white; 
          border-radius: 10px; 
          border: none; 
          font-weight: 600; 
          font-size: 14px; 
          cursor: pointer; 
          transition: all 0.2s ease;
        }

        .ms-logout-btn:hover { 
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .modern-sidebar { width: ${isCompact ? '80px' : '280px'}; }
        }
      `}</style>

      {/* Overlay for mobile/tablet */}
      <div className="ms-overlay" onClick={onClose}></div>

      <div className="modern-sidebar">
        <div className="ms-header">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '2px solid #e5e7eb',
            overflow: 'hidden',
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            fontSize: '20px',
            fontWeight: '700',
            flexShrink: 0,
            position: 'relative'
          }}>
            {getPhotoUrl(user?.photograph) ? (
              <img 
                src={getPhotoUrl(user.photograph)} 
                alt={user.full_name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
              />
            ) : null}
            <span style={{ fontSize: '24px', display: getPhotoUrl(user?.photograph) ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', position: getPhotoUrl(user?.photograph) ? 'absolute' : 'static', inset: 0 }}>👔</span>
          </div>
          
          {!isCompact && (
            <div style={{
              flex: 1,
              minWidth: 0
            }}>
              <h3 style={{
                margin: '0 0 2px 0',
                color: '#1f2937',
                fontSize: '16px',
                fontWeight: '700',
                lineHeight: '1.2'
              }}>
                {config.title}
              </h3>
              {user?.name && (
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  {user.name || user.full_name}
                </p>
              )}
            </div>
          )}
          
          <button 
            className="ms-close-btn" 
            onClick={() => setIsCompact(!isCompact)}
            title={isCompact ? 'Expand' : 'Collapse'}
          >
            <MaterialIcon name={isCompact ? 'chevron_right' : 'chevron_left'} />
          </button>
        </div>

        <nav className="ms-nav">
          {config.sections?.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <div className="ms-section-title">{section.title}</div>
              )}
              {section.items.map((item, itemIndex) => (
                <NavLink
                  key={itemIndex}
                  to={item.path}
                  className={({ isActive }) => `ms-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <div className="ms-nav-icon-wrapper">
                    {typeof item.icon === 'string' ? (
                      <MaterialIcon name={item.icon} />
                    ) : (
                      item.icon
                    )}
                  </div>
                  <span className="ms-nav-label">{item.label}</span>
                  {item.badge && (
                    <span style={{
                      background: item.badge.color || '#ef4444',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      marginLeft: 'auto',
                      display: isCompact ? 'none' : 'inline-block'
                    }}>
                      {item.badge.text}
                    </span>
                  )}
                </NavLink>
              ))}
              {sectionIndex < config.sections.length - 1 && (
                <div className="ms-divider"></div>
              )}
            </div>
          ))}
        </nav>

        <div className="ms-footer">
          <button onClick={handleLogout} className="ms-logout-btn">
            <MaterialIcon name="logout" />
            {!isCompact && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default ModernSidebar;

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import ReceptionNav from './ReceptionNav';
import FixedFooter from '../FixedFooter';

const ReceptionLayout = () => {
  const [menuOpen, setMenuOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen to custom event from Header
  useEffect(() => {
    const handleMenuToggle = () => {
      setMenuOpen(prev => !prev);
    };
    
    window.addEventListener('toggleReceptionMenu', handleMenuToggle);
    return () => window.removeEventListener('toggleReceptionMenu', handleMenuToggle);
  }, []);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setMenuOpen(false);
        setSidebarCollapsed(false);
      } else {
        setMenuOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const toggleCollapse = () => {
    console.log('ReceptionLayout toggleCollapse called, current state:', sidebarCollapsed);
    setSidebarCollapsed(prev => !prev);
  };

  const sidebarWidth = sidebarCollapsed ? '70px' : '260px';

  return (
    <div style={styles.container}>
      <ReceptionNav 
        isOpen={menuOpen} 
        onClose={closeMenu}
        collapsed={sidebarCollapsed}
        onToggle={toggleCollapse}
      />
      <div style={{
        ...styles.mainArea,
        marginLeft: sidebarWidth
      }}>
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
      <FixedFooter />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#ffffff !important',
    position: 'relative'
  },
  mainArea: {
    flex: 1,
    transition: 'margin-left 0.3s ease',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  content: {
    flex: 1,
    background: '#ffffff !important'
  }
};

export default ReceptionLayout;

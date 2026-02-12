import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';
import SalesmanSidebar from '../../salesman/components/SalesmanSidebar';
import ReceptionNav from '../../components/reception/ReceptionNav';
import ServiceEngineerNav from '../../components/service-engineer/ServiceEngineerNav';

/**
 * AdminLayout - Single source of truth for admin dashboard layout
 * This is the ONLY component that renders AdminHeader
 * Used by ALL admin routes in App.jsx
 */
export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Get normalized role - handle both uppercase and lowercase
  const userRole = user?.role ? user.role.toUpperCase() : null;
  
  console.log('AdminLayout - User:', user, 'Role:', userRole);
  
  // Persist sidebar state with localStorage (only for admin)
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start with true by default

  // Update sidebar state based on role after user is loaded
  useEffect(() => {
    if (userRole) {
      console.log('Setting initial sidebar state for role:', userRole);
      if (userRole === 'ADMIN') {
        // For admin, use localStorage
        const saved = localStorage.getItem('adminSidebarState');
        setSidebarOpen(saved === 'collapsed' ? false : true);
      } else {
        // For all other roles, always start open
        setSidebarOpen(true);
      }
    }
  }, [userRole]);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Only close sidebar on mobile for non-admin roles
      if (mobile && userRole !== 'ADMIN') {
        setSidebarOpen(false);
      } else if (mobile && userRole === 'ADMIN') {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [userRole]);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    // Persist to localStorage only for admin and on desktop
    if (!isMobile && userRole === 'ADMIN') {
      localStorage.setItem('adminSidebarState', newState ? 'expanded' : 'collapsed');
    }
  };

  // Render appropriate sidebar based on user role
  const renderSidebar = () => {
    if (!user?.role) return null;

    console.log('Rendering sidebar for role:', userRole, 'isOpen:', sidebarOpen);

    if (userRole === 'ADMIN') {
      return <AdminSidebar collapsed={!sidebarOpen} onToggle={toggleSidebar} />;
    } else if (userRole === 'SALESMAN') {
      return <SalesmanSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
    } else if (userRole === 'RECEPTION') {
      return <ReceptionNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
    } else if (userRole === 'SERVICE_ENGINEER') {
      return <ServiceEngineerNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
    }

    return null;
  };

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      {renderSidebar()}

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <div style={{
        ...styles.mainContent,
        marginLeft: isMobile ? '0' : (() => {
          if (userRole === 'ADMIN') {
            return sidebarOpen ? '260px' : '70px';
          } else if (userRole === 'RECEPTION') {
            return sidebarOpen ? '280px' : '0';
          } else if (userRole === 'SALESMAN') {
            return sidebarOpen ? '240px' : '0';
          } else if (userRole === 'SERVICE_ENGINEER') {
            return sidebarOpen ? '240px' : '0';
          }
          return '0';
        })(),
      }}>
        {/* Admin Header - ONLY rendered here, nowhere else */}
        <AdminHeader 
          onMenuToggle={toggleSidebar}
          role={user?.role}
        />

        {/* Page Content */}
        <main style={styles.pageContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f3f4f6',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    transition: 'margin-left 0.3s ease',
  },
  pageContent: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
};

import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import GlobalSearch from '../components/GlobalSearch';
import ToastNotification from '../components/ToastNotification';
import OfflineIndicator from '../components/OfflineIndicator';
import SalesmanSidebar from '../components/SalesmanSidebar';
import FixedFooter from '../../components/FixedFooter';
import '../styles/salesman.css';

/**
 * SalesmanLayout - Enhanced Clean Professional Layout
 * Sidebar + Topbar + Content Area + Advanced Features
 * Mobile-responsive with hamburger menu
 * NO attendance blocking
 */
export default function SalesmanLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect admin to admin dashboard
  React.useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Listen for sidebar toggle events from Header
  React.useEffect(() => {
    const handleToggle = () => {
      setSidebarOpen(prev => !prev);
    };
    
    window.addEventListener('toggleSalesmanMenu', handleToggle);
    return () => window.removeEventListener('toggleSalesmanMenu', handleToggle);
  }, []);

  // Handle responsive sidebar
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="salesman-layout">
      {/* Toast Notifications */}
      <ToastNotification />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Sidebar */}
      <SalesmanSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="salesman-main" style={{ 
        marginLeft: sidebarOpen ? '280px' : '0',
        marginTop: '70px',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: 'calc(100vh - 70px)'
      }}>
        {/* Top Bar with Advanced Features */}
        <div className="salesman-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: '#272727',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ☰
            </button>
            <h1 className="topbar-title">Salesman Portal</h1>
          </div>
          <div className="topbar-actions">
            <GlobalSearch />
            <div className="user-badge">
              {user?.full_name || user?.username}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="salesman-content">
          <Outlet />
        </div>
      </main>
      <FixedFooter />
    </div>
  );
}

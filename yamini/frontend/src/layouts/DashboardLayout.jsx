import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminSidebar from '../admin/components/AdminSidebar';
import AdminTopBar from '../admin/components/AdminTopBar';
import SalesmanSidebar from '../salesman/components/SalesmanSidebar';
import ReceptionNav from '../components/reception/ReceptionNav';
import ServiceEngineerNav from '../components/service-engineer/ServiceEngineerNav';
import '../styles/able-pro/dashboard.css';

/**
 * UNIFIED DASHBOARD LAYOUT
 * Single layout component for ALL roles (Admin, Salesman, Reception, Engineer)
 * Dynamically renders correct sidebar + topbar based on role
 * NO NESTED LAYOUTS - Pages render content only via <Outlet />
 * 
 * Architecture:
 * - Sidebar (role-specific)
 * - Content Area
 *   - TopBar (role-specific)
 *   - Main Content (scrollable)
 *     - <Outlet /> renders page components
 */
export default function DashboardLayout({ role }) {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const currentRole = role || user?.role;

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Close sidebar on mobile by default
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for sidebar toggle events from Header (if needed)
  useEffect(() => {
    const handleToggle = () => {
      if (isMobile) {
        setSidebarOpen(prev => !prev);
      } else {
        setSidebarCollapsed(prev => !prev);
      }
    };

    // Different event names for different roles (legacy support)
    const eventName = currentRole === 'ADMIN' ? 'toggleAdminMenu' :
                      currentRole === 'SALESMAN' ? 'toggleSalesmanMenu' :
                      currentRole === 'RECEPTION' ? 'toggleReceptionMenu' :
                      'toggleServiceEngineerMenu';

    window.addEventListener(eventName, handleToggle);
    return () => window.removeEventListener(eventName, handleToggle);
  }, [currentRole, isMobile]);

  // Render sidebar based on role
  const renderSidebar = () => {
    switch (currentRole) {
      case 'ADMIN':
        return (
          <AdminSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        );
      case 'SALESMAN':
        return (
          <SalesmanSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        );
      case 'RECEPTION':
        return (
          <ReceptionNav
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        );
      case 'SERVICE_ENGINEER':
        return (
          <ServiceEngineerNav
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        );
      default:
        return null;
    }
  };

  // Render topbar based on role
  const renderTopBar = () => {
    const handleMenuToggle = () => {
      if (isMobile) {
        setSidebarOpen(!sidebarOpen);
      } else {
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };

    switch (currentRole) {
      case 'ADMIN':
        return (
          <div className="able-topbar">
            <AdminTopBar onMenuToggle={handleMenuToggle} />
          </div>
        );
      default:
        // Other roles don't have custom topbar yet
        return null;
    }
  };

  // Determine sidebar state for styling
  const sidebarClassName = `able-sidebar ${sidebarCollapsed && !isMobile ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`;
  const contentClassName = `able-content ${sidebarOpen ? (sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-open') : 'sidebar-closed'}`;

  return (
    <div className="able-dashboard">
      {/* Sidebar - role-specific */}
      <div className={sidebarClassName}>
        {renderSidebar()}
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="able-overlay show" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Content Area */}
      <div className={contentClassName}>
        {/* Top Bar - role-specific */}
        {renderTopBar()}

        {/* Main Scrollable Content */}
        <div className="able-main">
          <div className="able-main-inner">
            {/* Pages render here via React Router */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

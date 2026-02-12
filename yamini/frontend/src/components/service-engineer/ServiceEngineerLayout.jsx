import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import ServiceEngineerSidebar from '../ServiceEngineerSidebar';

const ServiceEngineerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar open by default on desktop
  const [attendanceStatus, setAttendanceStatus] = useState({
    checked_in: false,
    loading: true
  });

  // Redirect admin to admin dashboard
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Listen for sidebar toggle events from Header
  useEffect(() => {
    const handleToggle = () => {
      setSidebarOpen(prev => !prev);
    };
    
    window.addEventListener('toggleServiceEngineerMenu', handleToggle);
    return () => window.removeEventListener('toggleServiceEngineerMenu', handleToggle);
  }, []);

  // Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    checkAttendance();
  }, []);

  const checkAttendance = async () => {
    try {
      const data = await apiRequest('/api/attendance/status');
      setAttendanceStatus({
        checked_in: data.checked_in,
        loading: false
      });
      
      // Only redirect if not checked in and not already on attendance page
      if (!data.checked_in && !location.pathname.includes('/attendance')) {
        navigate('/service-engineer/attendance', { replace: true });
      }
    } catch (error) {
      console.error('Failed to check attendance:', error);
      setAttendanceStatus({ checked_in: false, loading: false });
    }
  };

  // Show loading state
  if (attendanceStatus.loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="service-engineer-layout">
      <ServiceEngineerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`service-engineer-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Outlet />
      </div>

      <style>{`
        .service-engineer-layout {
          display: flex;
          min-height: calc(100vh - 70px);
          background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
          position: relative;
        }

        .service-engineer-content {
          flex: 1;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
          overflow-x: hidden;
          margin-top: 70px;
        }

        .service-engineer-content.sidebar-open {
          margin-left: 280px;
        }

        .service-engineer-content.sidebar-closed {
          margin-left: 0;
        }

        @media (max-width: 768px) {
          .service-engineer-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ServiceEngineerLayout;

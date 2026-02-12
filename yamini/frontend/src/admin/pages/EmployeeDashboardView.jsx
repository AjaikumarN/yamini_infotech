import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SalesmanDashboard from '../../salesman/pages/Dashboard';
import ServiceEngineerDashboard from '../../components/service-engineer/EngineerDashboard';
import ReceptionDashboard from '../../components/ReceptionDashboardNew';
import '../styles/admin-view-banner.css';

const ROLE_DASHBOARDS = {
  'salesmen': {
    component: SalesmanDashboard,
    title: 'Salesman'
  },
  'engineers': {
    component: ServiceEngineerDashboard,
    title: 'Service Engineer'
  },
  'reception': {
    component: ReceptionDashboard,
    title: 'Reception'
  }
};

export default function EmployeeDashboardView() {
  const { role, userId } = useParams();
  const navigate = useNavigate();
  const config = ROLE_DASHBOARDS[role];

  if (!config) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Invalid role</h2>
        <button onClick={() => navigate('/admin/employees')}>Go Back</button>
      </div>
    );
  }

  const DashboardComponent = config.component;

  return (
    <div>
      {/* Admin View Banner - Modern UI */}
      <div className="admin-view-banner">
        <div className="admin-view-banner-left">
          <span className="admin-view-banner-icon">👁️</span>
          <div className="admin-view-banner-content">
            <h2 className="admin-view-banner-title">Admin View Mode</h2>
            <div className="admin-view-banner-info">
              <span>Monitoring {config.title} Dashboard</span>
              <span className="admin-view-banner-badge">ID: {userId}</span>
            </div>
          </div>
        </div>
        <div className="admin-view-banner-right">
          <button
            className="admin-view-btn-back"
            onClick={() => navigate(`/admin/employees/${role}`)}
          >
            ← Back to List
          </button>
        </div>
      </div>

      {/* Render Employee Dashboard */}
      <DashboardComponent 
        userId={parseInt(userId)} 
        isAdminView={true}
      />
    </div>
  );
}

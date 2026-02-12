import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';
import PageLayout, { KpiGrid, ContentGrid } from '../../components/shared/dashboard/PageLayout';
import KpiCard from '../../components/shared/dashboard/KpiCard';
import DataCard from '../../components/shared/dashboard/DataCard';
import SimpleTable from '../../components/shared/dashboard/SimpleTable';
import StatusBadge from '../../components/shared/dashboard/StatusBadge';
import ActionButton from '../../components/shared/dashboard/ActionButton';
import JobLifecycleActions from '../engineer/JobLifecycleActions';

const EngineerDashboard = ({ userId = null, isAdminView = false }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    assigned: 0,
    in_progress: 0,
    completed_today: 0,
    sla_warning: 0,
    pending_feedback: 0,
    avg_rating: 0
  });
  
  const [recentJobs, setRecentJobs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      // If admin view, add user_id parameter
      const params = userId ? `?user_id=${userId}` : '';
      const [servicesData, analyticsData] = await Promise.all([
        apiRequest(`/api/service-requests/my-services${params}`),
        apiRequest(`/api/feedback/engineer/analytics${params}`).catch(() => null)
      ]);

      calculateStats(servicesData, analyticsData);
      setRecentJobs(servicesData.slice(0, 5));
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (services, analyticsData) => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0,0,0,0));

    setStats({
      assigned: services.filter(s => s.status === 'ASSIGNED').length,
      in_progress: services.filter(s => 
        s.status === 'IN_PROGRESS' || s.status === 'ON_THE_WAY'
      ).length,
      completed_today: services.filter(s => 
        s.status === 'COMPLETED' && 
        new Date(s.resolved_at) >= todayStart
      ).length,
      sla_warning: services.filter(s => 
        s.sla_status?.status === 'warning' || s.sla_status?.status === 'breached'
      ).length,
      pending_feedback: services.filter(s => 
        s.status === 'COMPLETED' && !s.feedback_submitted
      ).length,
      avg_rating: analyticsData?.average_rating || 0
    });
  };

  const getSLAColor = (status) => {
    const colors = {
      ok: '#10b981',
      warning: '#f59e0b',
      breached: '#ef4444',
      paused: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      CRITICAL: { color: '#dc2626', icon: '🔴' },
      URGENT: { color: '#f59e0b', icon: '🟠' },
      NORMAL: { color: '#10b981', icon: '🟢' }
    };
    return badges[priority] || badges.NORMAL;
  };

  // Prepare table data for recent jobs
  const jobsColumns = [
    { label: 'Ticket ID', key: 'ticket_no' },
    { label: 'Customer', key: 'customer_name' },
    { label: 'Issue', key: 'issue_description' },
    { 
      label: 'Priority', 
      key: 'priority',
      render: (row) => (
        <StatusBadge 
          status={row.priority || 'NORMAL'} 
          variant={row.priority === 'CRITICAL' ? 'danger' : row.priority === 'URGENT' ? 'warning' : 'success'}
          size="sm"
          dot
        />
      )
    },
    { 
      label: 'Status', 
      key: 'status',
      render: (row) => (
        <StatusBadge 
          status={row.status} 
          variant={row.status === 'COMPLETED' ? 'success' : row.status === 'IN_PROGRESS' ? 'info' : 'warning'}
          size="sm"
        />
      )
    },
    { 
      label: 'SLA', 
      key: 'sla_status',
      render: (row) => (
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          color: getSLAColor(row.sla_status?.status || 'ok')
        }}>
          {row.sla_status?.status.toUpperCase() || 'OK'}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <PageLayout
      title={`Welcome Back, ${user?.full_name || user?.name}!`}
      subtitle={isAdminView ? `Admin viewing Service Engineer ${userId}` : "Here's your service assignment overview"}
      actions={
        !isAdminView && (
          <>
            <ActionButton 
              variant="secondary" 
              icon="schedule" 
              size="sm"
              onClick={() => navigate('/service-engineer/sla-tracker')}
            >
              SLA Tracker
            </ActionButton>
            <ActionButton 
              variant="primary" 
              icon="assignment" 
              size="sm"
              onClick={() => navigate('/service-engineer/jobs')}
            >
              View All Jobs
            </ActionButton>
          </>
        )
      }
    >
      {/* KPI Cards Grid - 3 columns on large screens, responsive */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <KpiCard
          title="Assigned Jobs"
          value={stats.assigned}
          change={12.5}
          changeType="positive"
          icon="assignment"
          color="#3b82f6"
          loading={loading}
        />
        <KpiCard
          title="In Progress"
          value={stats.in_progress}
          change={8.2}
          changeType="positive"
          icon="schedule"
          color="#f59e0b"
          loading={loading}
        />
        <KpiCard
          title="Completed Today"
          value={stats.completed_today}
          change={15.3}
          changeType="positive"
          icon="check_circle"
          color="#10b981"
          loading={loading}
        />
        <KpiCard
          title="SLA Warnings"
          value={stats.sla_warning}
          change={stats.sla_warning > 0 ? 5.1 : -2.3}
          changeType={stats.sla_warning > 0 ? "negative" : "positive"}
          icon="warning"
          color="#ef4444"
          loading={loading}
        />
        <KpiCard
          title="Avg Rating"
          value={analytics?.average_rating?.toFixed(1) || '0.0'}
          change={3.2}
          changeType="positive"
          icon="star"
          color="#8b5cf6"
          loading={loading}
        />
      </div>

      {/* Main Content Grid - 2 columns responsive */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 600px), 1fr))',
          gap: '24px'
        }}>
          {/* Recent Jobs */}
          <DataCard
            title="Recent Assignments"
            subtitle="Your latest service jobs"
            headerAction={
              <ActionButton 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/service-engineer/jobs')}
              >
                View All
              </ActionButton>
            }
            noPadding
          >
            <SimpleTable
              columns={jobsColumns}
              data={recentJobs}
              loading={loading}
              emptyText="No assigned jobs at the moment"
              onRowClick={(row) => navigate('/service-engineer/jobs')}
            />
          </DataCard>

          {/* Right Sidebar - Performance & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Performance Stats */}
            {analytics && (
              <DataCard title="Your Performance" subtitle="This period's stats">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Jobs Completed</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                      {analytics.total_jobs_completed || 0}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Feedback Received</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                      {analytics.feedback_count || 0}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>SLA Compliance</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                      {analytics.sla_compliance_rate ? `${(analytics.sla_compliance_rate * 100).toFixed(0)}%` : 'N/A'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Average Rating</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '18px' }}>⭐</span> {analytics.average_rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>
              </DataCard>
            )}

            {/* Quick Actions */}
            <DataCard title="Quick Actions" subtitle="Common tasks">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ActionButton 
                  variant="primary" 
                  icon="location_on" 
                  fullWidth
                  onClick={() => navigate('/service-engineer/job-route')}
                >
                  Today's Route
                </ActionButton>
                <ActionButton 
                  variant="secondary" 
                  icon="assignment" 
                  fullWidth
                  onClick={() => navigate('/service-engineer/jobs')}
                >
                  All Jobs
                </ActionButton>
                <ActionButton 
                  variant="secondary" 
                  icon="star_rate" 
                  fullWidth
                  onClick={() => navigate('/service-engineer/feedback')}
                >
                  Check Feedback
                </ActionButton>
                <ActionButton 
                  variant="secondary" 
                  icon="history" 
                  fullWidth
                  onClick={() => navigate('/service-engineer/history')}
                >
                  Job History
                </ActionButton>
                <ActionButton 
                  variant="secondary" 
                  icon="assessment" 
                  fullWidth
                  onClick={() => navigate('/service-engineer/daily-report')}
                >
                  Daily Report
                </ActionButton>
              </div>
            </DataCard>

            {/* Pending Items */}
            <DataCard title="Pending Items" subtitle="Action required">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #f59e0b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                      Pending Feedback
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
                      {stats.pending_feedback}
                    </div>
                  </div>
                  <div style={{ fontSize: '32px' }}>📝</div>
                </div>
                <div style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #ef4444',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>
                      SLA Warnings
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
                      {stats.sla_warning}
                    </div>
                  </div>
                  <div style={{ fontSize: '32px' }}>⚠️</div>
                </div>
              </div>
            </DataCard>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </PageLayout>
  );
};

export default EngineerDashboard;

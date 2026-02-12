import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout, { KpiGrid, ContentGrid } from '../../components/shared/dashboard/PageLayout';
import KpiCard from '../../components/shared/dashboard/KpiCard';
import DataCard from '../../components/shared/dashboard/DataCard';
import SimpleTable from '../../components/shared/dashboard/SimpleTable';
import StatusBadge from '../../components/shared/dashboard/StatusBadge';
import ActionButton from '../../components/shared/dashboard/ActionButton';
import { getDashboardStats } from '../hooks/useSalesmanApi';

/**
 * SALESMAN DASHBOARD - Able Pro Style
 * Sales overview with performance tracking and customer engagement
 * Updated to match Admin Dashboard design system
 * NO forced attendance blocking, integrated attendance reminder
 */
export default function Dashboard({ userId = null, isAdminView = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const stats = await getDashboardStats(params);

      // Transform stats to dashboard data
      const data = {
        attendanceMarked: stats.attendanceMarked,
        kpis: {
          enquiriesCreated: stats.todayEnquiries,
          callsMade: stats.todayCalls,
          pendingFollowUps: stats.pendingFollowUps,
          ordersCreated: stats.todayOrders,
          activeEnquiries: stats.activeEnquiries,
          monthlyOrders: stats.ordersThisMonth
        },
        recentEnquiries: stats.recentEnquiries || [],
        recentOrders: stats.recentOrders || [],
        timeline: stats.timeline || []
      };

      setDashboardData(data);
    } catch (error) {
      console.error('Dashboard load error:', error);
      // Set mock data on error
      setDashboardData({
        attendanceMarked: false,
        kpis: {
          enquiriesCreated: 0,
          callsMade: 0,
          pendingFollowUps: 0,
          ordersCreated: 0,
          activeEnquiries: 0,
          monthlyOrders: 0
        },
        recentEnquiries: [],
        recentOrders: [],
        timeline: []
      });
    } finally {
      setLoading(false);
    }
  };

  const data = dashboardData || {
    attendanceMarked: false,
    kpis: { enquiriesCreated: 0, callsMade: 0, pendingFollowUps: 0, ordersCreated: 0, activeEnquiries: 0, monthlyOrders: 0 },
    recentEnquiries: [],
    recentOrders: [],
    timeline: []
  };

  const enquiryColumns = [
    { label: 'Enquiry ID', key: 'id' },
    { label: 'Customer', key: 'customer' },
    { label: 'Product', key: 'product' },
    { 
      label: 'Priority', 
      key: 'priority',
      render: (row) => (
        <StatusBadge 
          status={row.priority?.toUpperCase() || 'NORMAL'} 
          variant={row.priority?.toLowerCase() || 'normal'}
          size="sm"
          dot
        />
      )
    },
    { label: 'Date', key: 'date' },
    { 
      label: 'Status', 
      key: 'status',
      render: (row) => (
        <StatusBadge 
          status={row.status || 'PENDING'} 
          variant="info"
          size="sm"
        />
      )
    }
  ];

  const orderColumns = [
    { label: 'Order ID', key: 'id' },
    { label: 'Customer', key: 'customer' },
    { label: 'Product', key: 'product' },
    { label: 'Amount', key: 'amount' },
    { label: 'Date', key: 'date' },
    { 
      label: 'Status', 
      key: 'status',
      render: (row) => (
        <StatusBadge 
          status={row.status || 'PENDING'} 
          variant={row.status?.toLowerCase() === 'completed' ? 'success' : 'warning'}
          size="sm"
        />
      )
    }
  ];

  return (
    <PageLayout
      title={`Welcome Back${userId ? ', Salesman' : ''}!`}
      subtitle="Here's your sales performance for today"
      actions={
        <>
          <ActionButton variant="secondary" icon="calendar_today" size="sm">
            Today
          </ActionButton>
          <ActionButton variant="primary" icon="visibility" size="sm">
            This Month
          </ActionButton>
        </>
      }
    >
      {/* Attendance Reminder Banner */}
      {!data.attendanceMarked && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-icons" style={{ color: '#d97706', fontSize: '20px' }}>
              schedule
            </span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                Attendance Not Marked
              </div>
              <div style={{ fontSize: '13px', color: '#b45309', marginTop: '2px' }}>
                You can mark your attendance for better tracking (optional).
              </div>
            </div>
          </div>
          <ActionButton variant="primary" size="sm">
            Mark Now
          </ActionButton>
        </div>
      )}

      {/* KPI Cards */}
      <KpiGrid columns={4}>
        <KpiCard
          title="Enquiries Created"
          value={data.kpis.enquiriesCreated}
          change={12.5}
          changeType="positive"
          icon="inbox"
          color="#6366f1"
          loading={loading}
          subtitle={`${data.kpis.activeEnquiries} active total`}
        />
        <KpiCard
          title="Calls Made"
          value={data.kpis.callsMade}
          change={8.3}
          changeType="positive"
          icon="call"
          color="#10b981"
          loading={loading}
          subtitle="Customer interactions"
        />
        <KpiCard
          title="Pending Follow-Ups"
          value={data.kpis.pendingFollowUps}
          change={-3.2}
          changeType={data.kpis.pendingFollowUps > 0 ? 'negative' : 'positive'}
          icon="schedule"
          color={data.kpis.pendingFollowUps > 0 ? '#ef4444' : '#10b981'}
          loading={loading}
          subtitle={data.kpis.pendingFollowUps > 0 ? 'Needs attention' : 'All clear'}
        />
        <KpiCard
          title="Orders Created"
          value={data.kpis.ordersCreated}
          change={15.8}
          changeType="positive"
          icon="shopping_cart"
          color="#f59e0b"
          loading={loading}
          subtitle={`${data.kpis.monthlyOrders} this month`}
        />
      </KpiGrid>

      {/* Main Content Grid */}
      <ContentGrid columns="2fr 1fr">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recent Enquiries */}
          <DataCard
            title="Recent Enquiries"
            subtitle="Latest leads created"
            headerAction={
              <ActionButton 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/salesman/enquiries')}
              >
                View All
              </ActionButton>
            }
            noPadding
          >
            <SimpleTable
              columns={enquiryColumns}
              data={data.recentEnquiries.slice(0, 5)}
              loading={loading}
              emptyText="No enquiries yet"
              onRowClick={(row) => navigate(`/salesman/enquiries/${row.id}`)}
            />
          </DataCard>

          {/* Recent Orders */}
          <DataCard
            title="Recent Orders"
            subtitle="Latest conversions"
            headerAction={
              <ActionButton 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/salesman/orders')}
              >
                View All
              </ActionButton>
            }
            noPadding
          >
            <SimpleTable
              columns={orderColumns}
              data={data.recentOrders?.slice(0, 5) || []}
              loading={loading}
              emptyText="No orders yet"
              onRowClick={(row) => navigate(`/salesman/orders/${row.id}`)}
            />
          </DataCard>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Actions */}
          <DataCard title="Quick Actions" subtitle="Common tasks">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ActionButton 
                variant="primary" 
                icon="location_on" 
                fullWidth
                onClick={() => navigate('/salesman/visit-overview')}
              >
                Today's Visit Overview
              </ActionButton>
              <ActionButton 
                variant="secondary" 
                icon="add_circle" 
                fullWidth
                onClick={() => navigate('/salesman/enquiries')}
              >
                Create Enquiry
              </ActionButton>
              <ActionButton 
                variant="secondary" 
                icon="add_shopping_cart" 
                fullWidth
                onClick={() => navigate('/salesman/orders')}
              >
                Create Order
              </ActionButton>
              <ActionButton 
                variant="secondary" 
                icon="assessment" 
                fullWidth
                onClick={() => navigate('/salesman/daily-report')}
              >
                Daily Report
              </ActionButton>
            </div>
          </DataCard>

          {/* Recent Activity */}
          <DataCard title="Recent Activity" subtitle="Your timeline today">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.timeline && data.timeline.length > 0 ? (
                data.timeline.slice(0, 4).map((activity, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#f0f9ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span className="material-icons" style={{fontSize: '16px', color: '#3b82f6'}}>
                        {activity.icon || 'check_circle'}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      flex: 1
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        {activity.title || activity.description}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {activity.time ? (typeof activity.time === 'string' ? activity.time : activity.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })) : 'Just now'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                  No activities yet
                </div>
              )}
            </div>
          </DataCard>
        </div>
      </ContentGrid>

      {/* Admin View Notice */}
      {isAdminView && (
        <div style={{
          background: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <span className="material-icons" style={{ color: '#0284c7', fontSize: '20px', flexShrink: 0 }}>
            info
          </span>
          <div style={{ fontSize: '13px', color: '#0c4a6e' }}>
            <strong>Admin View Mode:</strong> You are viewing a salesman's dashboard. Certain actions are restricted.
          </div>
        </div>
      )}
    </PageLayout>
  );
}
    

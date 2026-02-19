import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import PageLayout, { KpiGrid, ContentGrid } from '../../components/shared/dashboard/PageLayout';
import KpiCard from '../../components/shared/dashboard/KpiCard';
import DataCard from '../../components/shared/dashboard/DataCard';
import SimpleTable from '../../components/shared/dashboard/SimpleTable';
import StatusBadge from '../../components/shared/dashboard/StatusBadge';
import ActionButton from '../../components/shared/dashboard/ActionButton';

/**
 * ADMIN DASHBOARD - Able Pro Style
 * Executive overview with full system visibility
 * NO AdminLayout wrapper - layout handled by route-level DashboardLayout
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivity();
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchRecentActivity();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const activities = await apiRequest('/api/audit/recent-activity?limit=4');
      setRecentActivity(activities || []);
    } catch (error) {
      // Silently handle error - keep empty array
      setRecentActivity([]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [enquiries, orders, services, fieldTeam] = await Promise.all([
        apiRequest('/api/enquiries/').catch(() => []),
        apiRequest('/api/orders/').catch(() => []),
        apiRequest('/api/service-requests/').catch(() => []),
        apiRequest('/api/tracking/live/locations').catch(() => ({ locations: [] }))
      ]);

      const today = new Date();
      const thisMonth = today.getMonth();
      const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'Pending');
      
      const monthlyOrders = orders.filter(o => new Date(o.created_at).getMonth() === thisMonth);
      const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      
      // Count active field staff
      const activeFieldStaff = (fieldTeam?.locations || []).filter(loc => loc.is_active).length;
      
      const data = {
        kpis: {
          totalEnquiries: enquiries.length,
          convertedSales: orders.length,
          fieldTeamActive: activeFieldStaff,
          monthlyRevenue: `₹${(monthlyRevenue / 100000).toFixed(2)}L`,
          pendingServices: services.filter(s => s.status === 'PENDING' || s.status === 'IN_PROGRESS').length,
          lowStockAlerts: 12 // TODO: Connect to stock API
        },
        recentEnquiries: enquiries.slice(0, 5).map(e => ({
          id: e.id,
          enquiryNumber: e.enquiry_number || `ENQ-${e.id}`,
          customer: e.customer_name,
          product: e.product_interest || e.product_name || 'N/A',
          priority: e.priority?.toLowerCase() || 'cold',
          assigned: e.assigned_to || 'Unassigned',
          date: new Date(e.created_at).toLocaleDateString(),
          status: e.status?.toLowerCase() || 'new'
        })),
        serviceEscalations: services.slice(0, 3).map(s => ({
          id: s.id,
          requestNumber: s.request_number || `SRV-${s.id}`,
          customer: s.customer_name,
          machine: s.machine_model || 'N/A',
          issue: s.complaint,
          sla: '2h 15m', // TODO: Calculate from SLA
          engineer: s.assigned_to || 'Unassigned',
          priority: s.priority?.toLowerCase() || 'medium'
        }))
      };

      setDashboardData(data);
    } catch (error) {
      // Silently handle errors - set empty data
      setDashboardData({
        kpis: {
          totalEnquiries: 0,
          convertedSales: 0,
          fieldTeamActive: 0,
          monthlyRevenue: '₹0',
          pendingServices: 0,
          lowStockAlerts: 0
        },
        recentEnquiries: [],
        serviceEscalations: []
      });
    } finally {
      setLoading(false);
    }
  };

  const data = dashboardData || {
    kpis: { totalEnquiries: 0, convertedSales: 0, fieldTeamActive: 0, monthlyRevenue: '₹0', pendingServices: 0, lowStockAlerts: 0 },
    recentEnquiries: [],
    serviceEscalations: []
  };

  const enquiryColumns = [
    { label: 'Enquiry ID', key: 'enquiryNumber' },
    { label: 'Customer', key: 'customer' },
    { label: 'Product', key: 'product' },
    { 
      label: 'Priority', 
      key: 'priority',
      render: (row) => (
        <StatusBadge 
          status={row.priority.toUpperCase()} 
          variant={row.priority}
          size="sm"
          dot
        />
      )
    },
    { label: 'Assigned To', key: 'assigned' },
    { label: 'Date', key: 'date' },
    { 
      label: 'Status', 
      key: 'status',
      render: (row) => (
        <StatusBadge 
          status={row.status} 
          variant="info"
          size="sm"
        />
      )
    }
  ];

  const escalationColumns = [
    { label: 'Service ID', key: 'requestNumber' },
    { label: 'Customer', key: 'customer' },
    { label: 'Machine', key: 'machine' },
    { label: 'Issue', key: 'issue' },
    { 
      label: 'SLA Remaining', 
      key: 'sla',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-icons" style={{ fontSize: '16px', color: row.priority === 'high' ? '#ef4444' : '#f59e0b' }}>
            schedule
          </span>
          <span style={{ fontWeight: '600', color: row.priority === 'high' ? '#ef4444' : '#374151' }}>
            {row.sla}
          </span>
        </div>
      )
    },
    { label: 'Engineer', key: 'engineer' },
    { 
      label: 'Priority', 
      key: 'priority',
      render: (row) => (
        <StatusBadge 
          status={row.priority} 
          variant={row.priority === 'high' ? 'danger' : 'warning'}
          size="sm"
        />
      )
    }
  ];

  return (
    <PageLayout
      title="Welcome Back, Admin!"
      subtitle="Here's what's happening with your business today"
      actions={
        <>
          <ActionButton variant="secondary" icon="calendar_today" size="sm">
            Previous Year
          </ActionButton>
          <ActionButton variant="primary" icon="visibility" size="sm">
            View All Time
          </ActionButton>
        </>
      }
    >
      {/* KPI Cards */}
      <KpiGrid columns={6}>
        <KpiCard
          title="Total Enquiries"
          value={data.kpis.totalEnquiries}
          change={14.5}
          changeType="positive"
          icon="inbox"
          color="#6366f1"
          loading={loading}
        />
        <KpiCard
          title="Converted Sales"
          value={data.kpis.convertedSales}
          change={23.1}
          changeType="positive"
          icon="trending_up"
          color="#10b981"
          loading={loading}
        />
        <KpiCard
          title="Field Team Active"
          value={data.kpis.fieldTeamActive}
          changeType="neutral"
          icon="location_on"
          color="#0ea5e9"
          loading={loading}
          onClick={() => navigate('/admin/live-map')}
        />
        <KpiCard
          title="Monthly Revenue"
          value={data.kpis.monthlyRevenue}
          change={18.9}
          changeType="positive"
          icon="payments"
          color="#f59e0b"
          loading={loading}
        />
        <KpiCard
          title="Pending Services"
          value={data.kpis.pendingServices}
          change={5.3}
          changeType="negative"
          icon="build"
          color="#ef4444"
          loading={loading}
        />
        <KpiCard
          title="Low Stock Alerts"
          value={data.kpis.lowStockAlerts}
          change={15.2}
          changeType="positive"
          icon="inventory_2"
          color="#8b5cf6"
          loading={loading}
        />
      </KpiGrid>

      {/* Main Content Grid */}
      <ContentGrid columns="2fr 1fr">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recent Enquiries */}
          <DataCard
            title="Recent Enquiries"
            subtitle="Latest incoming leads"
            headerAction={
              <ActionButton 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin/enquiries')}
              >
                View All
              </ActionButton>
            }
            noPadding
          >
            <SimpleTable
              columns={enquiryColumns}
              data={data.recentEnquiries}
              loading={loading}
              emptyText="No enquiries yet"
              onRowClick={(row) => navigate(`/admin/enquiries/${row.id}`)}
            />
          </DataCard>

          {/* Service Escalations */}
          <DataCard
            title="Service Escalations"
            subtitle="Urgent attention required"
            headerAction={
              <ActionButton 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin/service/requests')}
              >
                View All
              </ActionButton>
            }
            noPadding
          >
            <SimpleTable
              columns={escalationColumns}
              data={data.serviceEscalations}
              loading={loading}
              emptyText="No escalations"
              onRowClick={(row) => navigate(`/admin/service/requests/${row.id}`)}
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
                onClick={() => navigate('/admin/live-map')}
              >
                Today's Field Overview
              </ActionButton>
              <ActionButton 
                variant="secondary" 
                icon="person_add" 
                fullWidth
                onClick={() => navigate('/admin/new-employee')}
              >
                Add Employee
              </ActionButton>
              <ActionButton 
                variant="secondary" 
                icon="add_shopping_cart" 
                fullWidth
                onClick={() => navigate('/products/add')}
              >
                Add Product
              </ActionButton>
              <ActionButton 
                variant="secondary" 
                icon="security" 
                fullWidth
                onClick={() => navigate('/admin/mif')}
              >
                Access MIF
              </ActionButton>
            </div>
          </DataCard>

          {/* Activity Timeline */}
          <DataCard title="Recent Activity" subtitle="Latest system events">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentActivity.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  color: '#9ca3af',
                  fontSize: '14px' 
                }}>
                  No recent activity
                </div>
              ) : (
                recentActivity.map((activity, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${activity.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span className="material-icons" style={{fontSize: '16px', color: activity.color}}>
                        {activity.icon}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      flex: 1
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        {activity.text}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {activity.time} • {activity.username}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DataCard>
        </div>
      </ContentGrid>
    </PageLayout>
  );
}
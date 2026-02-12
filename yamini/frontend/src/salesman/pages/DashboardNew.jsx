import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import PageLayout, { KpiGrid, ContentGrid } from '../../components/shared/dashboard/PageLayout';
import KpiCard from '../../components/shared/dashboard/KpiCard';
import DataCard from '../../components/shared/dashboard/DataCard';
import SimpleTable from '../../components/shared/dashboard/SimpleTable';
import StatusBadge from '../../components/shared/dashboard/StatusBadge';
import ActionButton from '../../components/shared/dashboard/ActionButton';
import { useAuth } from '../../contexts/AuthContext';

/**
 * SALESMAN DASHBOARD - Able Pro Style
 * Lead management and sales performance tracking
 */
export default function SalesmanDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [enquiries, orders] = await Promise.all([
        apiRequest('/api/enquiries/').catch(() => []),
        apiRequest('/api/orders/').catch(() => [])
      ]);

      // Filter only assigned enquiries for this salesman
      const myEnquiries = enquiries.filter(e => e.assigned_to === user?.name || e.assigned_to === user?.username);
      const myOrders = orders.filter(o => o.salesman === user?.name || o.salesman === user?.username);
      
      const today = new Date();
      const thisMonth = today.getMonth();
      
      // Calculate follow-ups due today
      const todayFollowups = myEnquiries.filter(e => {
        if (!e.next_followup_date) return false;
        const followupDate = new Date(e.next_followup_date);
        return followupDate.toDateString() === today.toDateString();
      });

      // Calculate pending follow-ups (overdue)
      const pendingFollowups = myEnquiries.filter(e => {
        if (!e.next_followup_date) return false;
        const followupDate = new Date(e.next_followup_date);
        return followupDate < today && e.status !== 'CONVERTED';
      });

      // Monthly stats
      const monthlyOrders = myOrders.filter(o => new Date(o.created_at).getMonth() === thisMonth);
      const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      const data = {
        kpis: {
          assignedLeads: myEnquiries.length,
          todayFollowups: todayFollowups.length,
          pendingFollowups: pendingFollowups.length,
          convertedDeals: myOrders.length,
          monthlyRevenue: `₹${(monthlyRevenue / 100000).toFixed(2)}L`
        },
        todayTasks: todayFollowups.slice(0, 10).map(e => ({
          id: e.enquiry_number || `ENQ-${e.id}`,
          customer: e.customer_name,
          product: e.product_name || 'N/A',
          priority: e.priority?.toLowerCase() || 'cold',
          time: e.next_followup_date ? new Date(e.next_followup_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          status: e.status?.toLowerCase() || 'new'
        })),
        allEnquiries: myEnquiries.slice(0, 15).map(e => ({
          id: e.enquiry_number || `ENQ-${e.id}`,
          customer: e.customer_name,
          product: e.product_name || 'N/A',
          priority: e.priority?.toLowerCase() || 'cold',
          followup: e.next_followup_date ? new Date(e.next_followup_date).toLocaleDateString() : '-',
          status: e.status?.toLowerCase() || 'new',
          raw: e
        }))
      };

      setDashboardData(data);
    } catch (error) {
      console.error('Dashboard load error:', error);
      setDashboardData({
        kpis: {
          assignedLeads: 0,
          todayFollowups: 0,
          pendingFollowups: 0,
          convertedDeals: 0,
          monthlyRevenue: '₹0'
        },
        todayTasks: [],
        allEnquiries: []
      });
    } finally {
      setLoading(false);
    }
  };

  const data = dashboardData || {
    kpis: { assignedLeads: 0, todayFollowups: 0, pendingFollowups: 0, convertedDeals: 0, monthlyRevenue: '₹0' },
    todayTasks: [],
    allEnquiries: []
  };

  const tasksColumns = [
    { label: 'Time', key: 'time', width: '80px' },
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
    { 
      label: 'Action', 
      key: 'action',
      render: (row) => (
        <ActionButton 
          variant="primary" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/salesman/enquiries/${row.id}`);
          }}
        >
          Follow Up
        </ActionButton>
      )
    }
  ];

  const enquiriesColumns = [
    { label: 'Enquiry ID', key: 'id' },
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
    { label: 'Next Follow-up', key: 'followup' },
    { 
      label: 'Status', 
      key: 'status',
      render: (row) => (
        <StatusBadge 
          status={row.status} 
          variant={row.status === 'converted' ? 'success' : 'info'}
          size="sm"
        />
      )
    }
  ];

  return (
    <PageLayout
      title={`Welcome, ${user?.name || 'Salesman'}!`}
      subtitle="Let's close some deals today"
      actions={
        <>
          <ActionButton 
            variant="secondary" 
            icon="event_note" 
            size="sm"
            onClick={() => navigate('/salesman/daily-report')}
          >
            Daily Report
          </ActionButton>
          <ActionButton 
            variant="primary" 
            icon="add" 
            size="sm"
            onClick={() => navigate('/salesman/enquiries/new')}
          >
            New Enquiry
          </ActionButton>
        </>
      }
    >
      {/* KPI Cards */}
      <KpiGrid columns={5}>
        <KpiCard
          title="Assigned Leads"
          value={data.kpis.assignedLeads}
          icon="assignment"
          color="#6366f1"
          loading={loading}
        />
        <KpiCard
          title="Today's Follow-ups"
          value={data.kpis.todayFollowups}
          icon="phone_in_talk"
          color="#10b981"
          loading={loading}
        />
        <KpiCard
          title="Pending Follow-ups"
          value={data.kpis.pendingFollowups}
          icon="schedule"
          color="#ef4444"
          loading={loading}
        />
        <KpiCard
          title="Converted Deals"
          value={data.kpis.convertedDeals}
          icon="check_circle"
          color="#f59e0b"
          loading={loading}
        />
        <KpiCard
          title="Monthly Revenue"
          value={data.kpis.monthlyRevenue}
          icon="attach_money"
          color="#8b5cf6"
          loading={loading}
        />
      </KpiGrid>

      {/* Main Content Grid */}
      <ContentGrid columns="3fr 2fr">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Today's Follow-ups */}
          <DataCard
            title="Today's Follow-ups"
            subtitle={`${data.kpis.todayFollowups} calls to make today`}
            headerAction={
              data.kpis.todayFollowups > 0 && (
                <StatusBadge 
                  status={`${data.kpis.todayFollowups} Pending`}
                  variant="warning"
                  size="sm"
                  dot
                />
              )
            }
            noPadding
          >
            <SimpleTable
              columns={tasksColumns}
              data={data.todayTasks}
              loading={loading}
              emptyText="No follow-ups scheduled for today 🎉"
              onRowClick={(row) => navigate(`/salesman/enquiries/${row.id}`)}
            />
          </DataCard>

          {/* All Enquiries */}
          <DataCard
            title="All Assigned Enquiries"
            subtitle="Your complete lead pipeline"
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
              columns={enquiriesColumns}
              data={data.allEnquiries}
              loading={loading}
              emptyText="No enquiries assigned yet"
              onRowClick={(row) => navigate(`/salesman/enquiries/${row.id}`)}
            />
          </DataCard>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Sales Funnel */}
          <DataCard title="Sales Funnel" subtitle="Lead conversion pipeline">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { stage: 'New Leads', count: data.allEnquiries.filter(e => e.status === 'new').length, color: '#6366f1' },
                { stage: 'Quoted', count: data.allEnquiries.filter(e => e.status === 'quoted').length, color: '#10b981' },
                { stage: 'Follow-up', count: data.allEnquiries.filter(e => e.status === 'follow-up').length, color: '#f59e0b' },
                { stage: 'Converted', count: data.allEnquiries.filter(e => e.status === 'converted').length, color: '#8b5cf6' }
              ].map((stage, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    {stage.stage}
                  </span>
                  <span style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: stage.color 
                  }}>
                    {stage.count}
                  </span>
                </div>
              ))}
            </div>
          </DataCard>

          {/* Quick Actions */}
          <DataCard title="Quick Actions" subtitle="Common tasks">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ActionButton 
                variant="primary" 
                icon="add" 
                fullWidth
                onClick={() => navigate('/salesman/enquiries/new')}
              >
                Add Enquiry
              </ActionButton>
              <ActionButton 
                variant="secondary" 
                icon="phone" 
                fullWidth
                onClick={() => navigate('/salesman/enquiries')}
              >
                Mark Visit
              </ActionButton>
              <ActionButton 
                variant="secondary" 
                icon="article" 
                fullWidth
                onClick={() => navigate('/salesman/daily-report')}
              >
                Daily Report
              </ActionButton>
            </div>
          </DataCard>

          {/* Attendance Status */}
          <DataCard title="Today's Status" subtitle="Attendance & Performance">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                padding: '12px',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="material-icons" style={{ fontSize: '18px', color: '#10b981' }}>
                    check_circle
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
                    Attendance Marked
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#047857' }}>
                  Check-in: 9:15 AM
                </span>
              </div>

              <div style={{
                padding: '12px',
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="material-icons" style={{ fontSize: '18px', color: '#f59e0b' }}>
                    assignment
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                    Daily Report Pending
                  </span>
                </div>
                <ActionButton 
                  variant="warning"
                  size="sm"
                  icon="edit"
                  onClick={() => navigate('/salesman/daily-report')}
                >
                  Submit Now
                </ActionButton>
              </div>
            </div>
          </DataCard>
        </div>
      </ContentGrid>
    </PageLayout>
  );
}

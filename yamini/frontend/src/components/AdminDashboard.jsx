import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    totalCustomers: 0,
    totalSales: 0,
    totalRevenue: 0,
    activeComplaints: 0,
    teamPerformance: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [enquiries, customers, sales, complaints, users] = await Promise.all([
        apiRequest('/api/enquiries'),
        apiRequest('/api/customers'),
        apiRequest('/api/sales'),
        apiRequest('/api/complaints'),
        apiRequest('/api/users')
      ]);

      const enquiriesData = enquiries || [];
      const salesData = sales || [];
      const complaintsData = complaints || [];
      const usersData = users || [];

      // Calculate revenue
      const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.amount || 0), 0);

      // Active complaints
      const activeComplaints = complaintsData.filter(c => c.status !== 'Resolved').length;

      // Team performance (salesmen)
      const salesmen = usersData.filter(u => u.role === 'salesman');
      const teamPerformance = salesmen.map(salesman => {
        const assignedEnquiries = enquiriesData.filter(e => e.assigned_to === salesman.id);
        const convertedSales = salesData.filter(s => s.enquiry?.assigned_to === salesman.id);
        
        return {
          id: salesman.id,
          name: salesman.name,
          assignedEnquiries: assignedEnquiries.length,
          convertedSales: convertedSales.length,
          revenue: convertedSales.reduce((sum, s) => sum + (s.amount || 0), 0)
        };
      });

      setStats({
        totalEnquiries: enquiriesData.length,
        totalCustomers: customers?.length || 0,
        totalSales: salesData.length,
        totalRevenue,
        activeComplaints,
        teamPerformance,
        recentActivity: []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">⏳ Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>🎯 Admin Dashboard</h1>
          <p>Complete system overview and analytics</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchDashboardData}>
            🔄 Refresh
          </button>
          <button className="btn-mif" onClick={() => navigate('/admin/mif')}>
            📊 MIF Reports
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#667eea' }}>📋</div>
          <div className="metric-info">
            <h3>{stats.totalEnquiries}</h3>
            <p>Total Enquiries</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#28a745' }}>👥</div>
          <div className="metric-info">
            <h3>{stats.totalCustomers}</h3>
            <p>Total Customers</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#ffc107' }}>💰</div>
          <div className="metric-info">
            <h3>{stats.totalSales}</h3>
            <p>Total Sales</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#17a2b8' }}>📈</div>
          <div className="metric-info">
            <h3>₹{(stats.totalRevenue / 100000).toFixed(1)}L</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#dc3545' }}>🔧</div>
          <div className="metric-info">
            <h3>{stats.activeComplaints}</h3>
            <p>Active Complaints</p>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="panel">
        <div className="panel-header">
          <h2>👥 Team Performance</h2>
          <span className="badge">{stats.teamPerformance.length} salesmen</span>
        </div>
        <div className="panel-content">
          {stats.teamPerformance.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>No team data available</p>
            </div>
          ) : (
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Sales Person</th>
                  <th>Assigned Enquiries</th>
                  <th>Converted Sales</th>
                  <th>Revenue Generated</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.teamPerformance.map(member => {
                  const conversionRate = member.assignedEnquiries > 0
                    ? ((member.convertedSales / member.assignedEnquiries) * 100).toFixed(1)
                    : '0.0';
                  
                  return (
                    <tr key={member.id}>
                      <td className="name-cell">
                        <strong>{member.name}</strong>
                      </td>
                      <td>{member.assignedEnquiries}</td>
                      <td>{member.convertedSales}</td>
                      <td>₹{member.revenue.toLocaleString()}</td>
                      <td>
                        <div className="conversion-rate">
                          <div className="rate-bar">
                            <div
                              className="rate-fill"
                              style={{ width: `${conversionRate}%` }}
                            />
                          </div>
                          <span>{conversionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-panel">
        <h2>⚡ Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => navigate('/admin/mif')}>
            <span className="action-icon">📈</span>
            <span className="action-text">MIF Reports</span>
          </button>
          <button className="action-btn" onClick={() => navigate('/products')}>
            <span className="action-icon">📦</span>
            <span className="action-text">View Products</span>
          </button>
          <button className="action-btn" onClick={() => navigate('/products/add')}>
            <span className="action-icon">➕</span>
            <span className="action-text">Add Product</span>
          </button>
        </div>
      </div>

      <style>{`
        .admin-dashboard {
          padding: 20px;
          background: #f5f7fa;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .dashboard-header h1 {
          margin: 0 0 5px 0;
          color: #1a1a1a;
        }

        .dashboard-header p {
          margin: 0;
          color: #666;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .btn-refresh,
        .btn-mif {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-refresh {
          background: #667eea;
          color: white;
        }

        .btn-refresh:hover {
          background: #5568d3;
        }

        .btn-mif {
          background: #28a745;
          color: white;
        }

        .btn-mif:hover {
          background: #218838;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }

        .metric-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .metric-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .metric-info h3 {
          margin: 0;
          font-size: 28px;
          color: #1a1a1a;
        }

        .metric-info p {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 13px;
        }

        .panel {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 2px solid #f0f0f0;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 20px;
          color: #1a1a1a;
        }

        .badge {
          background: #f0f0f0;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 700;
          color: #666;
        }

        .panel-content {
          padding: 20px;
        }

        .performance-table {
          width: 100%;
          border-collapse: collapse;
        }

        .performance-table th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 700;
          color: #1a1a1a;
          border-bottom: 2px solid #e0e0e0;
        }

        .performance-table td {
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
          color: #666;
        }

        .performance-table tr:hover {
          background: #f8f9fa;
        }

        .name-cell strong {
          color: #1a1a1a;
        }

        .conversion-rate {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rate-bar {
          flex: 1;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .rate-fill {
          height: 100%;
          background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
          transition: width 0.3s;
        }

        .conversion-rate span {
          font-weight: 700;
          color: #28a745;
          min-width: 45px;
        }

        .quick-actions-panel {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .quick-actions-panel h2 {
          margin: 0 0 20px 0;
          color: #1a1a1a;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .action-btn {
          background: #f8f9fa;
          border: 2px solid #e0e0e0;
          padding: 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .action-btn:hover {
          border-color: #667eea;
          background: white;
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .action-icon {
          font-size: 36px;
        }

        .action-text {
          font-weight: 600;
          color: #1a1a1a;
          font-size: 14px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-icon {
          font-size: 60px;
          margin-bottom: 15px;
        }

        .empty-state p {
          color: #999;
          font-size: 16px;
          margin: 0;
        }

        .loading {
          text-align: center;
          padding: 100px 20px;
          font-size: 24px;
          color: #666;
        }

        @media (max-width: 1400px) {
          .metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 968px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .performance-table {
            font-size: 13px;
          }

          .header-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 576px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;

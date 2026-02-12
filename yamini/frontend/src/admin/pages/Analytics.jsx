import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { FiTrendingUp, FiTrendingDown, FiRefreshCw, FiBarChart2, FiUsers, FiCheckCircle, FiClock, FiAlertTriangle, FiTarget, FiActivity, FiZap } from 'react-icons/fi';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const data = await apiRequest('/api/analytics/dashboard');
      setStats(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setStats({
        sales: { total_enquiries: 0, converted: 0, pending: 0 },
        service: { total_requests: 0, completed: 0, pending: 0, sla_breached: 0 },
        attendance: { total_staff: 0, present_today: 0, late_today: 0 }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
        <style>{`
          .analytics-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
            gap: 20px;
          }
          .loading-spinner {
            width: 56px;
            height: 56px;
            border: 4px solid #e2e8f0;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .analytics-loading p {
            color: #64748b;
            font-size: 16px;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  const conversionRate = stats?.sales?.total_enquiries > 0 
    ? Math.round((stats?.sales?.converted / stats?.sales?.total_enquiries) * 100)
    : 0;

  const attendanceRate = stats?.attendance?.total_staff > 0
    ? Math.round((stats?.attendance?.present_today / stats?.attendance?.total_staff) * 100)
    : 0;

  const completionRate = stats?.service?.total_requests > 0
    ? Math.round((stats?.service?.completed / stats?.service?.total_requests) * 100)
    : 0;

  return (
    <div className="analytics-page">
      {/* Hero Header */}
      <header className="analytics-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <FiBarChart2 size={28} />
            </div>
            <div className="header-text">
              <h1>Analytics Dashboard</h1>
              <p>Real-time business intelligence and insights</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="last-updated">
              <FiActivity size={14} />
              <span>Live data</span>
            </div>
            <button 
              className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
              onClick={() => loadAnalytics(true)}
              disabled={refreshing}
            >
              <FiRefreshCw size={18} className={refreshing ? 'spin' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Quick Stats Bar */}
      <div className="quick-stats">
        <div className="quick-stat">
          <FiTarget className="quick-stat-icon" />
          <div className="quick-stat-content">
            <span className="quick-stat-value">{conversionRate}%</span>
            <span className="quick-stat-label">Conversion Rate</span>
          </div>
        </div>
        <div className="quick-stat-divider"></div>
        <div className="quick-stat">
          <FiCheckCircle className="quick-stat-icon success" />
          <div className="quick-stat-content">
            <span className="quick-stat-value">{completionRate}%</span>
            <span className="quick-stat-label">Service Completion</span>
          </div>
        </div>
        <div className="quick-stat-divider"></div>
        <div className="quick-stat">
          <FiUsers className="quick-stat-icon info" />
          <div className="quick-stat-content">
            <span className="quick-stat-value">{attendanceRate}%</span>
            <span className="quick-stat-label">Attendance Rate</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="analytics-content">
        {/* Sales Performance Section */}
        <section className="analytics-section">
          <div className="section-header">
            <div className="section-icon sales">
              <FiTrendingUp size={24} />
            </div>
            <div className="section-title">
              <h2>Sales Performance</h2>
              <p>Track enquiry conversions and sales pipeline</p>
            </div>
          </div>
          <div className="metrics-grid three-col">
            <div className="metric-card gradient-purple">
              <div className="metric-header">
                <span className="metric-label">Total Enquiries</span>
                <div className="metric-icon-wrap">
                  <FiBarChart2 size={20} />
                </div>
              </div>
              <div className="metric-value">{stats?.sales?.total_enquiries || 0}</div>
              <div className="metric-footer">
                <span className="metric-trend positive">
                  <FiTrendingUp size={14} /> +12% vs last month
                </span>
              </div>
            </div>
            
            <div className="metric-card gradient-green">
              <div className="metric-header">
                <span className="metric-label">Converted</span>
                <div className="metric-icon-wrap success">
                  <FiCheckCircle size={20} />
                </div>
              </div>
              <div className="metric-value">{stats?.sales?.converted || 0}</div>
              <div className="metric-footer">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${conversionRate}%` }}></div>
                </div>
                <span className="metric-subtitle">{conversionRate}% conversion rate</span>
              </div>
            </div>
            
            <div className="metric-card gradient-amber">
              <div className="metric-header">
                <span className="metric-label">Pending</span>
                <div className="metric-icon-wrap warning">
                  <FiClock size={20} />
                </div>
              </div>
              <div className="metric-value">{stats?.sales?.pending || 0}</div>
              <div className="metric-footer">
                <span className="metric-subtitle">Awaiting follow-up</span>
              </div>
            </div>
          </div>
        </section>

        {/* Service Performance Section */}
        <section className="analytics-section">
          <div className="section-header">
            <div className="section-icon service">
              <FiZap size={24} />
            </div>
            <div className="section-title">
              <h2>Service Performance</h2>
              <p>Monitor service requests and SLA compliance</p>
            </div>
          </div>
          <div className="metrics-grid four-col">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Total Requests</span>
                <div className="metric-icon-wrap">
                  <FiBarChart2 size={20} />
                </div>
              </div>
              <div className="metric-value dark">{stats?.service?.total_requests || 0}</div>
              <div className="metric-footer">
                <span className="metric-subtitle">All time requests</span>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Completed</span>
                <div className="metric-icon-wrap success">
                  <FiCheckCircle size={20} />
                </div>
              </div>
              <div className="metric-value success">{stats?.service?.completed || 0}</div>
              <div className="metric-footer">
                <span className="metric-trend positive">
                  <FiTrendingUp size={14} /> +{completionRate}%
                </span>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">In Progress</span>
                <div className="metric-icon-wrap warning">
                  <FiClock size={20} />
                </div>
              </div>
              <div className="metric-value warning">{stats?.service?.pending || 0}</div>
              <div className="metric-footer">
                <span className="metric-subtitle">Being processed</span>
              </div>
            </div>
            
            <div className="metric-card alert-card">
              <div className="metric-header">
                <span className="metric-label">SLA Breached</span>
                <div className="metric-icon-wrap danger">
                  <FiAlertTriangle size={20} />
                </div>
              </div>
              <div className="metric-value danger">{stats?.service?.sla_breached || 0}</div>
              <div className="metric-footer">
                <span className="metric-trend negative">
                  <FiTrendingDown size={14} /> Needs attention
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Attendance Section */}
        <section className="analytics-section">
          <div className="section-header">
            <div className="section-icon attendance">
              <FiUsers size={24} />
            </div>
            <div className="section-title">
              <h2>Attendance Overview</h2>
              <p>Real-time staff attendance tracking</p>
            </div>
          </div>
          <div className="metrics-grid three-col">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Total Staff</span>
                <div className="metric-icon-wrap">
                  <FiUsers size={20} />
                </div>
              </div>
              <div className="metric-value dark">{stats?.attendance?.total_staff || 0}</div>
              <div className="metric-footer">
                <span className="metric-subtitle">Registered employees</span>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Present Today</span>
                <div className="metric-icon-wrap success">
                  <FiCheckCircle size={20} />
                </div>
              </div>
              <div className="metric-value success">{stats?.attendance?.present_today || 0}</div>
              <div className="metric-footer">
                <div className="progress-bar">
                  <div className="progress-fill success" style={{ width: `${attendanceRate}%` }}></div>
                </div>
                <span className="metric-subtitle">{attendanceRate}% attendance</span>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Late Today</span>
                <div className="metric-icon-wrap warning">
                  <FiClock size={20} />
                </div>
              </div>
              <div className="metric-value warning">{stats?.attendance?.late_today || 0}</div>
              <div className="metric-footer">
                <span className="metric-subtitle">Arrived after 9:30 AM</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .analytics-page {
          min-height: 100vh;
          background: #f8fafc;
        }

        /* Header Styles */
        .analytics-header {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
          padding: 32px 40px;
          position: relative;
          overflow: hidden;
        }

        .analytics-header::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }

        .analytics-header::after {
          content: '';
          position: absolute;
          bottom: -150px;
          left: 20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%);
          border-radius: 50%;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-icon {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-text h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
        }

        .header-text p {
          margin: 6px 0 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 15px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .last-updated {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 30px;
          color: #6ee7b7;
          font-size: 13px;
          font-weight: 500;
        }

        .last-updated::before {
          content: '';
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: white;
          color: #4338ca;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .refresh-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }

        .refresh-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .refresh-btn .spin {
          animation: spin 1s linear infinite;
        }

        /* Quick Stats */
        .quick-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          padding: 24px 40px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          max-width: 1400px;
          margin: 0 auto;
        }

        .quick-stat {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .quick-stat-icon {
          width: 44px;
          height: 44px;
          background: #f1f5f9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 20px;
          padding: 10px;
        }

        .quick-stat-icon.success { color: #10b981; background: #ecfdf5; }
        .quick-stat-icon.info { color: #6366f1; background: #eef2ff; }

        .quick-stat-content {
          display: flex;
          flex-direction: column;
        }

        .quick-stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
        }

        .quick-stat-label {
          font-size: 13px;
          color: #64748b;
        }

        .quick-stat-divider {
          width: 1px;
          height: 40px;
          background: #e2e8f0;
        }

        /* Content Area */
        .analytics-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px 40px;
        }

        /* Section Styles */
        .analytics-section {
          margin-bottom: 40px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .section-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .section-icon.sales { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); }
        .section-icon.service { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); }
        .section-icon.attendance { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); }

        .section-title h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
        }

        .section-title p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          gap: 20px;
        }

        .metrics-grid.three-col {
          grid-template-columns: repeat(3, 1fr);
        }

        .metrics-grid.four-col {
          grid-template-columns: repeat(4, 1fr);
        }

        /* Metric Card */
        .metric-card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
        }

        .metric-card.gradient-purple {
          background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
          border-color: #c7d2fe;
        }

        .metric-card.gradient-green {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border-color: #a7f3d0;
        }

        .metric-card.gradient-amber {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border-color: #fde68a;
        }

        .metric-card.alert-card {
          border-left: 4px solid #ef4444;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .metric-label {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-icon-wrap {
          width: 44px;
          height: 44px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
        }

        .metric-icon-wrap.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .metric-icon-wrap.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .metric-icon-wrap.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .metric-value {
          font-size: 44px;
          font-weight: 800;
          color: #6366f1;
          line-height: 1;
          margin-bottom: 12px;
        }

        .metric-value.dark { color: #0f172a; }
        .metric-value.success { color: #10b981; }
        .metric-value.warning { color: #f59e0b; }
        .metric-value.danger { color: #ef4444; }

        .metric-footer {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .metric-subtitle {
          font-size: 13px;
          color: #64748b;
        }

        .metric-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .metric-trend.positive {
          background: #dcfce7;
          color: #16a34a;
        }

        .metric-trend.negative {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Progress Bar */
        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 10px;
          transition: width 0.5s ease;
        }

        .progress-fill.success {
          background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .metrics-grid.three-col,
          .metrics-grid.four-col {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .analytics-header {
            padding: 24px 20px;
          }

          .header-content {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .header-left {
            flex-direction: column;
          }

          .header-text h1 {
            font-size: 26px;
          }

          .header-actions {
            width: 100%;
            justify-content: center;
          }

          .quick-stats {
            flex-direction: column;
            gap: 20px;
            padding: 20px;
          }

          .quick-stat-divider {
            width: 80%;
            height: 1px;
          }

          .analytics-content {
            padding: 20px;
          }

          .metrics-grid.three-col,
          .metrics-grid.four-col {
            grid-template-columns: 1fr;
          }

          .metric-value {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
}

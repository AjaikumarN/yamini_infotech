import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

/**
 * Admin Reports Dashboard
 * Comprehensive reporting for sales, service, attendance, and performance
 * Includes editable daily reports for admin
 */
export default function Reports() {
  const [reportType, setReportType] = useState('daily');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [dailyReports, setDailyReports] = useState([]);
  const [missingReports, setMissingReports] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    if (reportType === 'daily') loadDailyReports();
    if (reportType === 'missing') loadMissingReports();
  }, [reportType]);

  const loadDailyReports = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/reports/daily/all?days=30');
      setDailyReports(data || []);
    } catch (e) {
      console.error('Failed to load daily reports:', e);
      setDailyReports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMissingReports = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/reports/daily/missing');
      setMissingReports(data);
    } catch (e) {
      console.error('Failed to load missing reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (report) => {
    setEditingReport(report.id);
    setEditValues({
      calls_made: report.calls_made,
      shops_visited: report.shops_visited,
      enquiries_generated: report.enquiries_generated,
      sales_closed: report.sales_closed,
      report_notes: report.report_notes || ''
    });
  };

  const saveEdit = async (reportId) => {
    try {
      await apiRequest(`/api/reports/daily/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify(editValues)
      });
      alert('✅ Report updated');
      setEditingReport(null);
      loadDailyReports();
    } catch (e) {
      alert('❌ Failed to update report');
      console.error(e);
    }
  };

  const reportCategories = [
    {
      id: 'daily',
      icon: 'today',
      label: 'Daily Reports',
      description: 'View daily sales and service reports'
    },
    {
      id: 'sales',
      icon: 'trending_up',
      label: 'Sales Performance',
      description: 'Sales team performance metrics'
    },
    {
      id: 'service',
      icon: 'build',
      label: 'Service Reports',
      description: 'Service engineer activities and SLA'
    },
    {
      id: 'attendance',
      icon: 'access_time',
      label: 'Attendance',
      description: 'Employee attendance summary'
    },
    {
      id: 'missing',
      icon: 'warning',
      label: 'Missing Reports',
      description: 'Pending and missing submissions'
    }
  ];

  const styles = {
    container: {
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280'
    },
    categoriesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '32px'
    },
    categoryCard: {
      padding: '20px',
      background: '#fff',
      borderRadius: '12px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: 'transparent',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    categoryCardActive: {
      borderColor: '#0ea5e9',
      background: 'rgba(14, 165, 233, 0.05)'
    },
    categoryIcon: {
      fontSize: '32px',
      color: '#0ea5e9',
      marginBottom: '12px'
    },
    categoryLabel: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '4px'
    },
    categoryDesc: {
      fontSize: '13px',
      color: '#6b7280'
    },
    filtersSection: {
      background: '#fff',
      padding: '24px',
      borderRadius: '12px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    filterRow: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      alignItems: 'flex-end'
    },
    filterGroup: {
      flex: '1 1 200px',
      minWidth: '200px'
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    button: {
      padding: '10px 24px',
      background: '#0ea5e9',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s'
    },
    contentArea: {
      background: '#fff',
      padding: '32px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
      minHeight: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    },
    emptyIcon: {
      fontSize: '64px',
      color: '#d1d5db',
      marginBottom: '16px'
    },
    emptyText: {
      fontSize: '16px',
      color: '#6b7280',
      marginBottom: '8px'
    }
  };

  const handleGenerateReport = () => {
    if (reportType === 'daily') loadDailyReports();
    else if (reportType === 'missing') loadMissingReports();
    else {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        alert(`Generating ${reportType} report for ${dateRange.start} to ${dateRange.end}`);
      }, 1000);
    }
  };

  const renderDailyReports = () => {
    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Loading...</div>;
    if (!dailyReports.length) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No daily reports found</div>;

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={thStyle}>Salesman</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Calls</th>
              <th style={thStyle}>Shops</th>
              <th style={thStyle}>Enquiries</th>
              <th style={thStyle}>Sales</th>
              <th style={thStyle}>Notes</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dailyReports.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{r.salesman_name}</td>
                <td style={tdStyle}>{r.report_date}</td>
                {editingReport === r.id ? (
                  <>
                    <td style={tdStyle}><input type="number" value={editValues.calls_made} onChange={e => setEditValues({...editValues, calls_made: +e.target.value})} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" value={editValues.shops_visited} onChange={e => setEditValues({...editValues, shops_visited: +e.target.value})} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" value={editValues.enquiries_generated} onChange={e => setEditValues({...editValues, enquiries_generated: +e.target.value})} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="number" value={editValues.sales_closed} onChange={e => setEditValues({...editValues, sales_closed: +e.target.value})} style={inputStyle} /></td>
                    <td style={tdStyle}><input type="text" value={editValues.report_notes} onChange={e => setEditValues({...editValues, report_notes: e.target.value})} style={{...inputStyle, width: '120px'}} /></td>
                    <td style={tdStyle}>
                      <button onClick={() => saveEdit(r.id)} style={{...btnSmall, background: '#10b981', color: '#fff'}}>Save</button>
                      <button onClick={() => setEditingReport(null)} style={{...btnSmall, background: '#e5e7eb', marginLeft: '4px'}}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={tdStyle}>{r.calls_made}</td>
                    <td style={tdStyle}>{r.shops_visited}</td>
                    <td style={tdStyle}>{r.enquiries_generated}</td>
                    <td style={tdStyle}>{r.sales_closed}</td>
                    <td style={{...tdStyle, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{r.report_notes || '-'}</td>
                    <td style={tdStyle}>
                      <button onClick={() => startEdit(r)} style={{...btnSmall, background: '#3b82f6', color: '#fff'}}>✏️ Edit</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMissingReports = () => {
    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Loading...</div>;
    if (!missingReports) return null;
    return (
      <div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{missingReports.missing_count}</div>
            <div style={{ fontSize: '13px', color: '#92400e' }}>Missing</div>
          </div>
          <div style={{ padding: '16px', background: '#d1fae5', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{missingReports.total_salesmen - missingReports.missing_count}</div>
            <div style={{ fontSize: '13px', color: '#065f46' }}>Submitted</div>
          </div>
        </div>
        {missingReports.missing_reports?.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#fef3c7' }}><th style={thStyle}>Salesman</th><th style={thStyle}>Username</th><th style={thStyle}>Status</th></tr></thead>
            <tbody>{missingReports.missing_reports.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{m.salesman_name}</td>
                <td style={tdStyle}>{m.username}</td>
                <td style={tdStyle}><span style={{ color: '#dc2626', fontWeight: '600' }}>{m.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    );
  };

  const thStyle = { padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' };
  const tdStyle = { padding: '10px 14px', fontSize: '14px', color: '#374151' };
  const inputStyle = { width: '60px', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' };
  const btnSmall = { padding: '4px 10px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Reports & Analytics</h1>
        <p style={styles.subtitle}>
          Generate comprehensive reports for your business operations
        </p>
      </div>

      {/* Report Categories */}
      <div style={styles.categoriesGrid}>
        {reportCategories.map(category => (
          <div
            key={category.id}
            style={{
              ...styles.categoryCard,
              ...(reportType === category.id ? styles.categoryCardActive : {})
            }}
            onClick={() => setReportType(category.id)}
            onMouseEnter={(e) => {
              if (reportType !== category.id) {
                e.currentTarget.style.borderColor = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              if (reportType !== category.id) {
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            <span className="material-icons" style={styles.categoryIcon}>
              {category.icon}
            </span>
            <div style={styles.categoryLabel}>{category.label}</div>
            <div style={styles.categoryDesc}>{category.description}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={styles.filtersSection}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Start Date</label>
            <input
              type="date"
              style={styles.input}
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>End Date</label>
            <input
              type="date"
              style={styles.input}
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
          <button
            style={styles.button}
            onClick={handleGenerateReport}
            disabled={loading}
            onMouseEnter={(e) => e.target.style.background = '#0284c7'}
            onMouseLeave={(e) => e.target.style.background = '#0ea5e9'}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>
              {loading ? 'hourglass_empty' : 'assessment'}
            </span>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Content Area */}
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        minHeight: '300px'
      }}>
        {reportType === 'daily' && renderDailyReports()}
        {reportType === 'missing' && renderMissingReports()}
        {!['daily', 'missing'].includes(reportType) && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <span className="material-icons" style={{ fontSize: '64px', color: '#d1d5db', marginBottom: '16px', display: 'block' }}>description</span>
            <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
              Select filters and click "Generate Report" to view data
            </div>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>
              Reports will be displayed here with detailed analytics and export options
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

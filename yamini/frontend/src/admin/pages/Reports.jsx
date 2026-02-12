import React, { useState, useEffect } from 'react';
import { theme } from '../styles/designSystem';

/**
 * Admin Reports Dashboard
 * Comprehensive reporting for sales, service, attendance, and performance
 */
export default function Reports() {
  const [reportType, setReportType] = useState('daily');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    // Placeholder for report generation logic
    setTimeout(() => {
      setLoading(false);
      alert(`Generating ${reportType} report for ${dateRange.start} to ${dateRange.end}`);
    }, 1000);
  };

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
      <div style={styles.contentArea}>
        <span className="material-icons" style={styles.emptyIcon}>
          description
        </span>
        <div style={styles.emptyText}>
          Select filters and click "Generate Report" to view data
        </div>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>
          Reports will be displayed here with detailed analytics and export options
        </p>
      </div>
    </div>
  );
}

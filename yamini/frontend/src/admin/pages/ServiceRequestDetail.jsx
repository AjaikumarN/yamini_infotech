import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

/**
 * ServiceRequestDetail - Display detailed view of a service request
 */
export default function ServiceRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServiceDetails();
  }, [requestId]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest(`/api/service-requests/${requestId}`);
      setService(data);
    } catch (err) {
      console.error('Error fetching service request:', err);
      setError(err.message || 'Failed to load service request details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': { bg: '#FEF3C7', color: '#D97706' },
      'IN_PROGRESS': { bg: '#DBEAFE', color: '#2563EB' },
      'COMPLETED': { bg: '#D1FAE5', color: '#059669' },
      'CANCELLED': { bg: '#FEE2E2', color: '#DC2626' }
    };
    return colors[status] || { bg: '#F3F4F6', color: '#6B7280' };
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'HIGH': { bg: '#FEE2E2', color: '#DC2626' },
      'MEDIUM': { bg: '#FEF3C7', color: '#D97706' },
      'LOW': { bg: '#D1FAE5', color: '#059669' }
    };
    return colors[priority?.toUpperCase()] || { bg: '#F3F4F6', color: '#6B7280' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading service request...</p>
        </div>
        <style>{spinnerKeyframes}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <span style={styles.errorIcon}>⚠️</span>
          <h2 style={styles.errorTitle}>Error Loading Service Request</h2>
          <p style={styles.errorMessage}>{error}</p>
          <div style={styles.errorActions}>
            <button onClick={() => navigate(-1)} style={styles.backButton}>
              ← Go Back
            </button>
            <button onClick={fetchServiceDetails} style={styles.retryButton}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div style={styles.container}>
        <div style={styles.notFoundContainer}>
          <span style={styles.notFoundIcon}>🔍</span>
          <h2 style={styles.notFoundTitle}>Service Request Not Found</h2>
          <p style={styles.notFoundMessage}>The service request you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/admin/service/requests')} style={styles.backButton}>
            ← Back to Service Requests
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusColor(service.status);
  const priorityStyle = getPriorityColor(service.priority);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backLink}>
          <span className="material-icons" style={{ fontSize: '20px' }}>arrow_back</span>
          Back
        </button>
        <div style={styles.headerContent}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>
              {service.request_number || `SRV-${service.id}`}
            </h1>
            <span style={{ ...styles.statusBadge, ...statusStyle }}>
              {service.status}
            </span>
          </div>
          <p style={styles.subtitle}>Service Request Details</p>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Customer & Machine Info */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span className="material-icons" style={styles.cardIcon}>person</span>
            Customer Information
          </h3>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Customer Name</span>
              <span style={styles.infoValue}>{service.customer_name || 'N/A'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Phone</span>
              <span style={styles.infoValue}>{service.customer_phone || 'N/A'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Email</span>
              <span style={styles.infoValue}>{service.customer_email || 'N/A'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Address</span>
              <span style={styles.infoValue}>{service.address || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Machine Details */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span className="material-icons" style={styles.cardIcon}>build</span>
            Machine Details
          </h3>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Machine</span>
              <span style={styles.infoValue}>{service.product_name || service.machine_name || 'N/A'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Serial Number</span>
              <span style={styles.infoValue}>{service.serial_number || 'N/A'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Model</span>
              <span style={styles.infoValue}>{service.model || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Complaint Details */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span className="material-icons" style={styles.cardIcon}>report_problem</span>
            Complaint Details
          </h3>
          <div style={styles.complaintBox}>
            <div style={styles.priorityRow}>
              <span style={styles.infoLabel}>Priority:</span>
              <span style={{ ...styles.priorityBadge, ...priorityStyle }}>
                {service.priority || 'MEDIUM'}
              </span>
            </div>
            <div style={styles.complaintText}>
              {service.complaint || service.description || 'No complaint description provided'}
            </div>
          </div>
        </div>

        {/* Assignment & Timeline */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <span className="material-icons" style={styles.cardIcon}>schedule</span>
            Assignment & Timeline
          </h3>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Assigned Engineer</span>
              <span style={styles.infoValue}>{service.assigned_to || service.engineer_name || 'Unassigned'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Created At</span>
              <span style={styles.infoValue}>{formatDate(service.created_at)}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Scheduled Date</span>
              <span style={styles.infoValue}>{formatDate(service.scheduled_date)}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Completed At</span>
              <span style={styles.infoValue}>{formatDate(service.completed_at)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button 
            onClick={() => navigate('/admin/service/requests')} 
            style={styles.secondaryButton}
          >
            <span className="material-icons" style={{ fontSize: '18px' }}>list</span>
            View All Requests
          </button>
        </div>
      </div>
    </div>
  );
}

const spinnerKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    textAlign: 'center'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #E5E7EB',
    borderTopColor: '#0891B2',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    color: '#6B7280',
    fontSize: '14px'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 24px',
    textAlign: 'center'
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0 0 8px 0'
  },
  errorMessage: {
    color: '#6B7280',
    marginBottom: '24px'
  },
  errorActions: {
    display: 'flex',
    gap: '12px'
  },
  notFoundContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 24px',
    textAlign: 'center'
  },
  notFoundIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  notFoundTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0 0 8px 0'
  },
  notFoundMessage: {
    color: '#6B7280',
    marginBottom: '24px'
  },
  header: {
    marginBottom: '24px'
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#6B7280',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '8px 0',
    marginBottom: '12px',
    transition: 'color 0.15s'
  },
  headerContent: {},
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: 0
  },
  subtitle: {
    color: '#6B7280',
    margin: '4px 0 0 0',
    fontSize: '14px'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  card: {
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '20px'
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 16px 0'
  },
  cardIcon: {
    fontSize: '20px',
    color: '#0891B2'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  infoLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  infoValue: {
    fontSize: '14px',
    color: '#111827',
    fontWeight: '500'
  },
  complaintBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  priorityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  priorityBadge: {
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  complaintText: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
    padding: '12px 16px',
    background: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #E5E7EB'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px'
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    background: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.15s'
  },
  retryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    background: '#0891B2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.15s'
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    background: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.15s'
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    background: '#0891B2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.15s'
  }
};

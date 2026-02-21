import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';
import JobLifecycleActions from '../engineer/JobLifecycleActions';

const AssignedJobs = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, all, critical
  
  // Modals
  const [statusModal, setStatusModal] = useState({ show: false, service: null });
  const [completionModal, setCompletionModal] = useState({ show: false, service: null });
  const [detailModal, setDetailModal] = useState({ show: false, service: null });
  const [qrModal, setQrModal] = useState({ show: false, qr: null, url: null });
  
  // Form state
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      
      // Auto-detect language (Tamil/English)
      recognitionInstance.lang = 'ta-IN'; // Tamil by default
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setResolutionNotes(prev => prev + ' ' + transcript);
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        // Try English if Tamil fails
        if (event.error === 'no-speech' || event.error === 'language-not-supported') {
          recognitionInstance.lang = 'en-US';
        }
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }

    fetchServices();
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchServices = async () => {
    try {
      const data = await apiRequest('/api/service-requests/my-services');
      setServices(data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceInput = (field) => {
    if (!recognition) {
      alert('Voice input not supported in this browser');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognition.start();
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await apiRequest(`/api/service-requests/${statusModal.service.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      setStatusModal({ show: false, service: null });
      fetchServices();
      alert('✅ Status updated successfully');
    } catch (error) {
      alert('❌ Failed to update status: ' + error.message);
    }
  };

  const handleComplete = async () => {
    if (!resolutionNotes.trim()) {
      alert('⚠️ Please provide resolution notes');
      return;
    }

    try {
      const response = await apiRequest(
        `/api/service-requests/${completionModal.service.id}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({
            resolution_notes: resolutionNotes,
            parts_replaced: partsReplaced || null
          })
        }
      );

      console.log('Service completion response:', response);

      // Close completion modal and clear form
      setCompletionModal({ show: false, service: null });
      setResolutionNotes('');
      setPartsReplaced('');
      
      // Refresh services list
      await fetchServices();
      
      // Show QR code modal
      if (response && response.feedback_qr && response.feedback_url) {
        console.log('Showing QR modal for:', response.feedback_url);
        setTimeout(() => {
          setQrModal({
            show: true,
            qr: response.feedback_qr,
            url: response.feedback_url
          });
        }, 300);
        
        alert('✅ Service completed successfully! Feedback QR is ready.');
      } else {
        console.warn('Missing feedback data in response:', { 
          feedback_qr: !!response?.feedback_qr, 
          feedback_url: !!response?.feedback_url,
          response: response
        });
        alert('✅ Service completed! However, feedback QR could not be generated.');
      }
    } catch (error) {
      console.error('Error completing service:', error);
      alert('❌ Failed to complete service: ' + error.message);
    }
  };

  const getNextStatus = (currentStatus) => {
    const transitions = {
      'ASSIGNED': ['ON_THE_WAY', 'ON_HOLD'],
      'ON_THE_WAY': ['IN_PROGRESS', 'ON_HOLD'],
      'IN_PROGRESS': ['ON_HOLD'],
      'ON_HOLD': ['IN_PROGRESS']
    };
    return transitions[currentStatus] || [];
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
      CRITICAL: { color: '#dc2626', icon: '🔴', text: 'CRITICAL' },
      URGENT: { color: '#f59e0b', icon: '🟠', text: 'URGENT' },
      NORMAL: { color: '#10b981', icon: '🟢', text: 'NORMAL' }
    };
    return badges[priority] || badges.NORMAL;
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(Math.abs(seconds) / 3600);
    const minutes = Math.floor((Math.abs(seconds) % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const filteredServices = services.filter(service => {
    if (filter === 'active') {
      return service.status !== 'COMPLETED' && service.status !== 'CANCELLED';
    }
    if (filter === 'critical') {
      return service.priority === 'CRITICAL';
    }
    return true;
  });

  if (loading) {
    return (
      <div className="jobs-loading">
        <div className="spinner"></div>
        <p>Loading your jobs...</p>
      </div>
    );
  }

  return (
    <div className="assigned-jobs">
      <div className="jobs-header">
        <div className="header-left">
          <h1>🛠 Assigned Jobs</h1>
          <p>Total: <strong>{filteredServices.length}</strong> jobs</p>
        </div>
        <div className="header-filters">
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active Jobs
          </button>
          <button
            className={`filter-btn ${filter === 'critical' ? 'active' : ''}`}
            onClick={() => setFilter('critical')}
          >
            🔴 Critical
          </button>
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Jobs
          </button>
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No Jobs Found</h2>
          <p>You don't have any {filter} jobs at the moment</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {filteredServices.map(service => {
            const priority = getPriorityBadge(service.priority);
            const nextStatuses = getNextStatus(service.status);
            const canComplete = service.status === 'IN_PROGRESS';

            return (
              <div key={service.id} className="job-card">
                {/* Card Header */}
                <div className="job-card-header">
                  <div className="job-ticket">
                    <span className="ticket-icon">🎫</span>
                    <strong>{service.ticket_no}</strong>
                  </div>
                  <div className="job-badges">
                    <span 
                      className="priority-badge"
                      style={{ 
                        background: priority.color,
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}
                    >
                      {priority.icon} {priority.text}
                    </span>
                    {service.sla_status && (
                      <span 
                        className="sla-badge"
                        style={{ 
                          background: getSLAColor(service.sla_status.status),
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}
                      >
                        ⏱ {service.sla_status.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="job-card-body">
                  <h3>{service.customer_name}</h3>
                  <p className="job-issue">{service.issue_description}</p>
                  
                  <div className="job-details">
                    <div className="detail-item">
                      <span className="detail-icon">🏢</span>
                      <span>{service.company || ''}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📞</span>
                      <span>{service.phone || ''}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <span>{service.location || service.address || ''}</span>
                    </div>
                    {service.sla_status && (
                      <div className="detail-item">
                        <span className="detail-icon">⏰</span>
                        <span>
                          {service.sla_status.remaining > 0 
                            ? `${formatTime(service.sla_status.remaining)} remaining`
                            : `Breached by ${formatTime(service.sla_status.remaining)}`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="job-card-footer">
                  <span className={`status-badge status-${service.status.toLowerCase().replace('_', '-')}`}>
                    {service.status.replace('_', ' ')}
                  </span>
                  
                  <div className="job-actions">
                    <button
                      className="btn-action btn-detail"
                      onClick={() => setDetailModal({ show: true, service })}
                    >
                      👁 Details
                    </button>
                    
                    {nextStatuses.length > 0 && (
                      <button
                        className="btn-action btn-status"
                        onClick={() => setStatusModal({ show: true, service })}
                      >
                        🔄 Update
                      </button>
                    )}
                    
                    {canComplete && (
                      <button
                        className="btn-action btn-complete"
                        onClick={() => setCompletionModal({ show: true, service })}
                      >
                        ✅ Complete
                      </button>
                    )}
                    
                    {service.status === 'COMPLETED' && service.feedback_qr && (
                      <button
                        className="btn-action btn-feedback"
                        onClick={() => setQrModal({
                          show: true,
                          qr: service.feedback_qr,
                          url: service.feedback_url
                        })}
                      >
                        📱 Feedback
                      </button>
                    )}
                  </div>
                </div>

                {/* JobLifecycleActions Component (NEW) */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <JobLifecycleActions 
                    service={service} 
                    onUpdate={fetchServices}
                    onShowQR={(qr, url) => setQrModal({ show: true, qr, url })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Update Modal */}
      {statusModal.show && (
        <div className="modal-overlay" onClick={() => setStatusModal({ show: false, service: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Status</h2>
              <button 
                className="modal-close"
                onClick={() => setStatusModal({ show: false, service: null })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Select new status for <strong>{statusModal.service.ticket_no}</strong>:</p>
              <div className="status-options">
                {getNextStatus(statusModal.service.status).map(status => (
                  <button
                    key={status}
                    className="status-option-btn"
                    onClick={() => handleStatusUpdate(status)}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {completionModal.show && (
        <div className="modal-overlay" onClick={() => setCompletionModal({ show: false, service: null })}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complete Service</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setCompletionModal({ show: false, service: null });
                  setResolutionNotes('');
                  setPartsReplaced('');
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Resolution Notes *</label>
                <div className="textarea-with-voice">
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe what was done to resolve the issue..."
                    rows={4}
                  />
                  <button
                    className={`btn-voice ${isRecording ? 'recording' : ''}`}
                    onClick={() => toggleVoiceInput('resolution')}
                    title="Voice input (Tamil/English)"
                  >
                    {isRecording ? '⏹ Stop' : '🎤 Voice'}
                  </button>
                </div>
                <small>Supports Tamil and English voice input</small>
              </div>

              <div className="form-group">
                <label>Parts Replaced (Optional)</label>
                <input
                  type="text"
                  value={partsReplaced}
                  onChange={(e) => setPartsReplaced(e.target.value)}
                  placeholder="e.g., Toner cartridge, Drum unit"
                />
              </div>

              <button 
                className="btn-submit"
                onClick={handleComplete}
                disabled={!resolutionNotes.trim()}
              >
                ✅ Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.show && (
        <div className="modal-overlay" onClick={() => setDetailModal({ show: false, service: null })}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Job Details</h2>
              <button 
                className="modal-close"
                onClick={() => setDetailModal({ show: false, service: null })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="detail-grid">
                  <div><strong>Name:</strong> {detailModal.service.customer_name}</div>
                  <div><strong>Company:</strong> {detailModal.service.company || 'N/A'}</div>
                  <div><strong>Phone:</strong> {detailModal.service.phone || 'N/A'}</div>
                  <div><strong>Email:</strong> {detailModal.service.email || 'N/A'}</div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Issue Details</h3>
                <p>{detailModal.service.issue_description}</p>
                {detailModal.service.issue_type && (
                  <p><strong>Type:</strong> {detailModal.service.issue_type}</p>
                )}
              </div>

              {detailModal.service.notes && (
                <div className="detail-section">
                  <h3>Additional Notes</h3>
                  <p>{detailModal.service.notes}</p>
                </div>
              )}

              <div className="detail-section">
                <h3>Service Status</h3>
                <div className="detail-grid">
                  <div><strong>Status:</strong> {detailModal.service.status}</div>
                  <div><strong>Priority:</strong> {detailModal.service.priority}</div>
                  <div><strong>Created:</strong> {new Date(detailModal.service.created_at).toLocaleString()}</div>
                  {detailModal.service.sla_time && (
                    <div><strong>SLA Due:</strong> {new Date(detailModal.service.sla_time).toLocaleString()}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal.show && (
        <div className="modal-overlay" onClick={() => setQrModal({ show: false, qr: null, url: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customer Feedback</h2>
              <button 
                className="modal-close"
                onClick={() => setQrModal({ show: false, qr: null, url: null })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body qr-modal-body">
              <p>Share this QR code with the customer to collect feedback:</p>
              <div className="qr-code-container">
                {qrModal.qr && (
                  <img src={`data:image/png;base64,${qrModal.qr}`} alt="Feedback QR Code" />
                )}
              </div>
              <p className="qr-url">{qrModal.url}</p>
              <button 
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(qrModal.url);
                  alert('✅ Link copied to clipboard');
                }}
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .assigned-jobs {
          padding: 24px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .jobs-header {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 24px;
          gap: 20px;
        }

        .jobs-header h1 {
          margin: 0;
          color: #1f2937;
          flex: 0 0 auto;
        }

        .jobs-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          flex: 0 0 auto;
        }

        .header-filters {
          display: flex;
          gap: 10px;
          margin-left: auto;
          flex-shrink: 0;
          flex-wrap: nowrap;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.3s;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          min-width: fit-content;
        }

        .filter-btn:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
        }

        .jobs-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .empty-icon {
          font-size: 72px;
          margin-bottom: 16px;
        }

        .empty-state h2 {
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          color: #6b7280;
          margin: 0;
        }

        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }

        .job-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          overflow: hidden;
          transition: all 0.3s;
          border: 2px solid transparent;
        }

        .job-card:hover {
          border-color: #667eea;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
          transform: translateY(-4px);
        }

        .job-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .job-ticket {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
        }

        .ticket-icon {
          font-size: 20px;
        }

        .job-badges {
          display: flex;
          gap: 8px;
        }

        .job-card-body {
          padding: 16px;
        }

        .job-card-body h3 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 18px;
        }

        .job-issue {
          color: #6b7280;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .job-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
        }

        .detail-icon {
          font-size: 16px;
        }

        .job-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-assigned {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-on-the-way {
          background: #e0e7ff;
          color: #3730a3;
        }

        .status-in-progress {
          background: #fef3c7;
          color: #92400e;
        }

        .status-on-hold {
          background: #fee2e2;
          color: #991b1b;
        }

        .job-actions {
          display: flex;
          gap: 8px;
        }

        .btn-action {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-detail {
          background: #e5e7eb;
          color: #1f2937;
        }

        .btn-detail:hover {
          background: #d1d5db;
        }

        .btn-status {
          background: #dbeafe;
          color: #1e40af;
        }

        .btn-status:hover {
          background: #bfdbfe;
        }

        .btn-complete {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .btn-complete:hover {
          transform: scale(1.05);
        }

        .btn-feedback {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .btn-feedback:hover {
          transform: scale(1.05);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .modal-large {
          max-width: 700px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.3s;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .modal-body {
          padding: 20px;
        }

        .status-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }

        .status-option-btn {
          padding: 12px;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          text-transform: uppercase;
          transition: all 0.3s;
        }

        .status-option-btn:hover {
          border-color: #667eea;
          background: #eff6ff;
          color: #667eea;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #1f2937;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-group small {
          display: block;
          margin-top: 4px;
          color: #6b7280;
          font-size: 12px;
        }

        .textarea-with-voice {
          position: relative;
        }

        .textarea-with-voice textarea {
          padding-right: 100px;
        }

        .btn-voice {
          position: absolute;
          right: 8px;
          top: 8px;
          padding: 8px 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-voice:hover {
          background: #5568d3;
        }

        .btn-voice.recording {
          background: #dc2626;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .btn-submit {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .detail-section {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .detail-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .detail-section h3 {
          margin: 0 0 12px 0;
          color: #1f2937;
          font-size: 16px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .detail-grid div {
          color: #6b7280;
          font-size: 14px;
        }

        .detail-grid strong {
          color: #1f2937;
        }

        .qr-modal-body {
          text-align: center;
        }

        .qr-code-container {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }

        .qr-code-container img {
          max-width: 250px;
          width: 100%;
          height: auto;
        }

        .qr-url {
          font-size: 12px;
          color: #6b7280;
          word-break: break-all;
          margin-bottom: 16px;
        }

        .btn-copy {
          padding: 10px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-copy:hover {
          background: #5568d3;
        }

        @media (max-width: 768px) {
          .jobs-grid {
            grid-template-columns: 1fr;
          }

          .jobs-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* QR CODE MODAL (Moved from JobLifecycleActions) */}
      {qrModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease-out',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setQrModal({ show: false, qr: null, url: null })}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#666',
                padding: '0',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f0f0f0';
                e.target.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = '#666';
              }}
              title="Close"
            >
              ✕
            </button>

            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '800',
                color: '#1f2937',
                marginBottom: '8px'
              }}>
                📱 Customer Feedback
              </div>
              <div style={{
                fontSize: '13px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Share this QR code or link for customer feedback
              </div>
            </div>

            {/* QR Code */}
            {qrModal.qr ? (
              <div style={{
                background: '#f9fafb',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '2px solid #e5e7eb'
              }}>
                <img
                  src={`data:image/png;base64,${qrModal.qr}`}
                  alt="Feedback QR Code"
                  style={{
                    width: '260px',
                    height: '260px',
                    margin: '0 auto'
                  }}
                />
              </div>
            ) : (
              <div style={{
                background: '#f9fafb',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '2px solid #e5e7eb'
              }}>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  📌 No QR code available
                </div>
              </div>
            )}

            {/* Feedback Link */}
            <div style={{
              background: '#f0f9ff',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '2px solid #bfdbfe'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#0369a1',
                fontWeight: '600',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Or use this link:
              </div>
              <div style={{
                fontSize: '12px',
                color: '#0c63e4',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                background: 'white',
                padding: '8px',
                borderRadius: '8px',
                marginBottom: '12px'
              }}>
                {qrModal.url}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrModal.url);
                  alert('Link copied to clipboard!');
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: '#0c63e4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#0953cc';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#0c63e4';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                📋 Copy Link
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <button
                onClick={() => setQrModal({ show: false, qr: null, url: null })}
                style={{
                  padding: '12px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e5e7eb';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Done
              </button>
              <button
                onClick={() => {
                  // Extract service ID from URL
                  const serviceId = qrModal.url.split('/').pop();
                  setQrModal({ show: false, qr: null, url: null });
                  navigate(`/feedback/${serviceId}`);
                }}
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 10px 20px rgba(37, 99, 235, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Go to Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedJobs;

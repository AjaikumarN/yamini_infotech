import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

const CustomerFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
    fetchAnalytics();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const data = await apiRequest('/api/feedback/engineer/my-feedback');
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await apiRequest('/api/feedback/engineer/analytics');
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
        {i < rating ? '⭐' : '☆'}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="feedback-loading">
        <div className="spinner"></div>
        <p>Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="customer-feedback">
      <div className="feedback-header">
        <div className="header-left">
          <h1>⭐ Customer Feedback</h1>
          <p>Track customer satisfaction and ratings</p>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="analytics-section">
          <div className="analytics-card">
            <div className="analytics-icon">⭐</div>
            <div className="analytics-content">
              <h3>{analytics.average_rating?.toFixed(1) || '0.0'}</h3>
              <p>Average Rating</p>
              <div className="stars-display">
                {renderStars(Math.round(analytics.average_rating || 0))}
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">💬</div>
            <div className="analytics-content">
              <h3>{analytics.feedback_count || 0}</h3>
              <p>Total Feedback</p>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">✅</div>
            <div className="analytics-content">
              <h3>{analytics.total_jobs_completed || 0}</h3>
              <p>Jobs Completed</p>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon">📊</div>
            <div className="analytics-content">
              <h3>
                {analytics.sla_compliance_rate 
                  ? `${(analytics.sla_compliance_rate * 100).toFixed(0)}%`
                  : 'N/A'
                }
              </h3>
              <p>SLA Compliance</p>
            </div>
          </div>
        </div>
      )}

      {/* Feedbacks List */}
      {feedbacks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h2>No Feedback Yet</h2>
          <p>Customer feedback will appear here after service completion</p>
        </div>
      ) : (
        <div className="feedback-list">
          {feedbacks.map(feedback => (
            <div key={feedback.id} className="feedback-card">
              <div className="feedback-header-info">
                <div className="feedback-ticket">
                  🎫 <strong>{feedback.ticket_no}</strong>
                </div>
                <div className="feedback-date">
                  {new Date(feedback.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="feedback-customer">
                <div className="customer-info">
                  <div className="customer-name">{feedback.customer_name}</div>
                  <div className="customer-company">{feedback.customer_company || 'N/A'}</div>
                </div>
              </div>

              <div className="feedback-rating-section">
                <div className="rating-stars">
                  {renderStars(feedback.rating)}
                </div>
                <div className="rating-value">{feedback.rating}.0 / 5.0</div>
              </div>

              {feedback.comments && (
                <div className="feedback-comments">
                  <p>"{feedback.comments}"</p>
                </div>
              )}

              <div className="feedback-meta">
                <span>📍 {feedback.location || 'N/A'}</span>
                <span>🔧 {feedback.issue_description?.substring(0, 50) || 'No description'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .customer-feedback {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .feedback-header {
          margin-bottom: 32px;
        }

        .feedback-header h1 {
          margin: 0;
          color: #1f2937;
        }

        .feedback-header p {
          margin: 4px 0 0 0;
          color: #6b7280;
        }

        .feedback-loading {
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

        .analytics-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .analytics-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s;
        }

        .analytics-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }

        .analytics-icon {
          font-size: 40px;
        }

        .analytics-content h3 {
          margin: 0;
          font-size: 32px;
          color: #1f2937;
        }

        .analytics-content p {
          margin: 4px 0 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .stars-display {
          margin-top: 8px;
          font-size: 16px;
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

        .feedback-list {
          display: grid;
          gap: 20px;
        }

        .feedback-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: all 0.3s;
        }

        .feedback-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .feedback-header-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .feedback-ticket {
          font-size: 15px;
          color: #1f2937;
        }

        .feedback-date {
          color: #6b7280;
          font-size: 13px;
        }

        .feedback-customer {
          margin-bottom: 16px;
        }

        .customer-name {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .customer-company {
          color: #6b7280;
          font-size: 14px;
        }

        .feedback-rating-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .rating-stars {
          display: flex;
          gap: 4px;
          font-size: 24px;
        }

        .star {
          color: #d1d5db;
        }

        .star.filled {
          color: #fbbf24;
        }

        .rating-value {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .feedback-comments {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          border-left: 4px solid #667eea;
        }

        .feedback-comments p {
          margin: 0;
          color: #1f2937;
          font-style: italic;
          line-height: 1.6;
        }

        .feedback-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #6b7280;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .analytics-section {
            grid-template-columns: 1fr;
          }

          .feedback-meta {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerFeedback;

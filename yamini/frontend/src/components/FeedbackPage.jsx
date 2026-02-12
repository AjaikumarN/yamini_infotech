import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const FeedbackPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [service, setService] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  const fetchServiceDetails = async () => {
    try {
      // Public endpoint to get service details for feedback
      const response = await fetch(`${API_BASE_URL}/api/service-requests/public/${id}`);
      const data = await response.json();
      
      if (data.status !== 'COMPLETED') {
        setError('This service is not yet completed.');
        setLoading(false);
        return;
      }
      
      setService(data);
      setFormData(prev => ({
        ...prev,
        customer_name: data.customer_name
      }));
      setLoading(false);
    } catch (err) {
      setError('Failed to load service details. Please check the link and try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_name.trim()) {
      alert('Please enter your name');
      return;
    }

    setSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/api/feedback/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_request_id: parseInt(id),
          customer_name: formData.customer_name,
          rating: formData.rating,
          comment: formData.comment
        })
      });
      
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      alert('Failed to submit feedback. ' + (err.message || 'Please try again.'));
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setFormData({ ...formData, rating: star })}
        className={`star-btn ${formData.rating >= star ? 'active' : ''}`}
      >
        ★
      </button>
    ));
  };

  if (loading) {
    return (
      <div className="feedback-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-page">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2>Unable to Load Feedback Form</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="feedback-page">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Thank You for Your Feedback!</h2>
          <p>Your feedback has been submitted successfully.</p>
          <p className="redirect-text">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <div className="feedback-header">
          <h1>🔧 Service Feedback</h1>
          <p>We value your opinion! Please share your experience.</p>
        </div>

        <div className="service-info">
          <h3>Service Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Ticket:</strong> {service?.ticket_no}
            </div>
            <div className="info-item">
              <strong>Customer:</strong> {service?.customer_name}
            </div>
            <div className="info-item">
              <strong>Machine:</strong> {service?.machine_model}
            </div>
            <div className="info-item">
              <strong>Completed:</strong> {new Date(service?.completed_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label>Rate Our Service *</label>
            <div className="star-rating">
              {renderStars()}
            </div>
            <p className="rating-text">
              {formData.rating === 1 && '😞 Very Poor'}
              {formData.rating === 2 && '😕 Poor'}
              {formData.rating === 3 && '😐 Average'}
              {formData.rating === 4 && '😊 Good'}
              {formData.rating === 5 && '😄 Excellent'}
            </p>
          </div>

          <div className="form-group">
            <label>Comments (Optional)</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows="5"
              placeholder="Tell us about your experience..."
            />
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : '✅ Submit Feedback'}
          </button>
        </form>
      </div>

      <style>{`
        .feedback-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feedback-container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 600px;
          width: 100%;
          padding: 40px;
        }

        .feedback-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .feedback-header h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 2em;
        }

        .feedback-header p {
          color: #666;
          font-size: 1.1em;
        }

        .service-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
        }

        .service-info h3 {
          color: #333;
          margin-bottom: 15px;
          font-size: 1.2em;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .info-item {
          color: #555;
          font-size: 0.95em;
        }

        .info-item strong {
          color: #333;
          display: block;
          margin-bottom: 5px;
        }

        .feedback-form {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          color: #333;
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 1em;
        }

        .form-group input,
        .form-group textarea {
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1em;
          transition: all 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .star-rating {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin: 10px 0;
        }

        .star-btn {
          background: none;
          border: none;
          font-size: 3em;
          color: #ddd;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .star-btn:hover {
          transform: scale(1.2);
        }

        .star-btn.active {
          color: #ffd700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .rating-text {
          text-align: center;
          font-size: 1.2em;
          font-weight: 600;
          color: #667eea;
          margin-top: 10px;
        }

        .btn-submit {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 1.1em;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 10px;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner,
        .error-card,
        .success-card {
          background: white;
          border-radius: 20px;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-icon,
        .success-icon {
          font-size: 4em;
          margin-bottom: 20px;
        }

        .error-card h2,
        .success-card h2 {
          color: #333;
          margin-bottom: 15px;
        }

        .error-card p,
        .success-card p {
          color: #666;
          margin-bottom: 20px;
        }

        .btn-primary {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-size: 1em;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary:hover {
          background: #5568d3;
          transform: translateY(-2px);
        }

        .redirect-text {
          color: #667eea;
          font-style: italic;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .feedback-container {
            padding: 30px 20px;
          }

          .info-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .star-btn {
            font-size: 2em;
          }

          .feedback-header h1 {
            font-size: 1.5em;
          }
        }
      `}</style>
    </div>
  );
};

export default FeedbackPage;

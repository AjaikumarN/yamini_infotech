import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiRequest } from '../utils/api'
import './EnquiryDetail.css'

export default function EnquiryDetail() {
  const { enquiryId } = useParams()
  const navigate = useNavigate()
  const [enquiry, setEnquiry] = useState(null)
  const [product, setProduct] = useState(null)
  const [assignedUser, setAssignedUser] = useState(null)
  const [followups, setFollowups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEnquiryDetails()
  }, [enquiryId])

  const fetchEnquiryDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch enquiry details
      const enquiryData = await apiRequest(`/api/enquiries/${enquiryId}`)
      setEnquiry(enquiryData)

      // Fetch product details if product_id exists
      if (enquiryData.product_id) {
        try {
          const productData = await apiRequest(`/api/products/${enquiryData.product_id}`)
          setProduct(productData)
        } catch (err) {
          console.error('Error fetching product:', err)
        }
      }

      // Fetch assigned user details if assigned_to exists
      if (enquiryData.assigned_to) {
        try {
          const user = await apiRequest(`/api/users/${enquiryData.assigned_to}`)
          setAssignedUser(user)
        } catch (err) {
          console.error('Error fetching assigned user:', err)
        }
      }

      // Fetch followups for this enquiry
      try {
        const followupsData = await apiRequest(`/api/enquiries/${enquiryId}/followups`)
        setFollowups(followupsData || [])
      } catch (err) {
        console.error('Error fetching followups:', err)
      }

    } catch (err) {
      console.error('Error fetching enquiry details:', err)
      setError(err.message || 'Failed to load enquiry details')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      HOT: '#e74c3c',
      WARM: '#f39c12',
      COLD: '#3498db'
    }
    return colors[priority] || '#95a5a6'
  }

  const getStatusColor = (status) => {
    const colors = {
      NEW: '#3498db',
      CONTACTED: '#f39c12',
      QUALIFIED: '#9b59b6',
      CONVERTED: '#27ae60',
      LOST: '#e74c3c'
    }
    return colors[status] || '#95a5a6'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="enquiry-detail-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading enquiry details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="enquiry-detail-container">
        <div className="error-message">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="btn-back">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!enquiry) {
    return (
      <div className="enquiry-detail-container">
        <div className="error-message">
          <h2>Enquiry Not Found</h2>
          <button onClick={() => navigate(-1)} className="btn-back">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="enquiry-detail-container">
        <div className="detail-header">
          <button onClick={() => navigate(-1)} className="btn-back">
            ← Back
          </button>
          <h1>Enquiry Details</h1>
        </div>

        <div className="detail-grid">
          {/* Main Information Card */}
          <div className="detail-card main-info">
            <div className="card-header">
              <h2>📋 Basic Information</h2>
              <div className="badges">
                <span 
                  className="badge priority-badge" 
                  style={{ backgroundColor: getPriorityColor(enquiry.priority) }}
                >
                  {enquiry.priority}
                </span>
                <span 
                  className="badge status-badge" 
                  style={{ backgroundColor: getStatusColor(enquiry.status) }}
                >
                  {enquiry.status}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="info-row">
                <label>Enquiry ID:</label>
                <span className="enquiry-id">{enquiry.enquiry_id}</span>
              </div>
              <div className="info-row">
                <label>Customer Name:</label>
                <span>{enquiry.customer_name}</span>
              </div>
              <div className="info-row">
                <label>Phone:</label>
                <span>{enquiry.phone || 'N/A'}</span>
              </div>
              <div className="info-row">
                <label>Email:</label>
                <span>{enquiry.email || 'N/A'}</span>
              </div>
              <div className="info-row">
                <label>Source:</label>
                <span className="badge source-badge">{enquiry.source || 'N/A'}</span>
              </div>
              <div className="info-row">
                <label>Created By:</label>
                <span>{enquiry.created_by || 'N/A'}</span>
              </div>
              <div className="info-row">
                <label>Created At:</label>
                <span>{formatDate(enquiry.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Product Information Card */}
          {product && (
            <div className="detail-card product-info">
              <div className="card-header">
                <h2>🖨️ Product Interest</h2>
              </div>
              <div className="card-body">
                {product.images && product.images.length > 0 && (
                  <div className="product-image">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = '/placeholder-product.png'
                      }}
                    />
                  </div>
                )}
                <div className="info-row">
                  <label>Product Name:</label>
                  <span className="product-name">{product.name}</span>
                </div>
                <div className="info-row">
                  <label>Model:</label>
                  <span>{product.model_number || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <label>Category:</label>
                  <span>{product.category || 'N/A'}</span>
                </div>
                {product.price && (
                  <div className="info-row">
                    <label>Price:</label>
                    <span className="price">₹{product.price.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignment & Follow-up Card */}
          <div className="detail-card assignment-info">
            <div className="card-header">
              <h2>👤 Assignment & Follow-up</h2>
            </div>
            <div className="card-body">
              <div className="info-row">
                <label>Assigned To:</label>
                <span>{assignedUser ? assignedUser.full_name : 'Not Assigned'}</span>
              </div>
              {assignedUser && (
                <>
                  <div className="info-row">
                    <label>Email:</label>
                    <span>{assignedUser.email || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <label>Phone:</label>
                    <span>{assignedUser.phone || 'N/A'}</span>
                  </div>
                </>
              )}
              <div className="info-row">
                <label>Next Follow-up:</label>
                <span className={enquiry.next_follow_up ? 'highlight' : ''}>
                  {formatDate(enquiry.next_follow_up)}
                </span>
              </div>
              <div className="info-row">
                <label>Last Follow-up:</label>
                <span>{formatDate(enquiry.last_follow_up)}</span>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="detail-card notes-card">
            <div className="card-header">
              <h2>📝 Notes</h2>
            </div>
            <div className="card-body">
              <div className="notes-content">
                {enquiry.notes || enquiry.product_interest ? (
                  <>
                    {enquiry.product_interest && (
                      <div className="note-section">
                        <strong>Product Interest:</strong>
                        <p>{enquiry.product_interest}</p>
                      </div>
                    )}
                    {enquiry.notes && (
                      <div className="note-section">
                        <strong>Additional Notes:</strong>
                        <p>{enquiry.notes}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="no-notes">No notes available</p>
                )}
              </div>
            </div>
          </div>

          {/* Follow-ups History Card */}
          {followups.length > 0 && (
            <div className="detail-card followups-card">
              <div className="card-header">
                <h2>📞 Follow-up History</h2>
              </div>
              <div className="card-body">
                <div className="followups-timeline">
                  {followups.map((followup, index) => (
                    <div key={followup.id} className="followup-item">
                      <div className="followup-dot"></div>
                      <div className="followup-content">
                        <div className="followup-header">
                          <span className="followup-date">
                            {formatDate(followup.created_at)}
                          </span>
                          <span 
                            className="followup-status"
                            style={{ 
                              backgroundColor: followup.status === 'COMPLETED' ? '#27ae60' : '#f39c12' 
                            }}
                          >
                            {followup.status}
                          </span>
                        </div>
                        <p className="followup-notes">{followup.notes}</p>
                        {followup.next_action && (
                          <p className="followup-next-action">
                            <strong>Next Action:</strong> {followup.next_action}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  )
}

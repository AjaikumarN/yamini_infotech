import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

export default function JobLifecycleActions({ service, onUpdate, onShowQR }) {
  const navigate = useNavigate();
  const [completionData, setCompletionData] = useState({
    work_done: '',
    parts_used: '',
    before_photo: null,
    after_photo: null
  });
  const [loading, setLoading] = useState(false);
  const [beforePreview, setBeforePreview] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);

  const handleCheckIn = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await apiRequest(`/api/service-requests/${service.id}/location`, {
            method: 'PUT',
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          });
          showToast('✅ Checked in successfully!', 'success');
          onUpdate();
        } catch (error) {
          console.error('Check-in failed:', error);
          showToast('Failed to check in', 'error');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        showToast('Failed to get location. Please enable GPS.', 'error');
        setLoading(false);
      }
    );
  };

  const handleStart = async () => {
    try {
      setLoading(true);
      await apiRequest(`/api/service-requests/${service.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'ON_THE_WAY' })
      });
      showToast('✅ On the way to service location!', 'success');
      onUpdate();
    } catch (error) {
      console.error('Start failed:', error);
      showToast('Failed to start service', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    // Validation
    if (!completionData.work_done.trim()) {
      showToast('Please enter work done', 'error');
      return;
    }

    if (!completionData.before_photo || !completionData.after_photo) {
      showToast('Please upload both before and after photos', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const requestBody = {
        resolution_notes: completionData.work_done,
        parts_replaced: completionData.parts_used || null
      };

      const response = await apiRequest(`/api/service-requests/${service.id}/complete`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      console.log('Service completion response:', response);
      console.log('feedback_qr:', !!response?.feedback_qr);
      console.log('feedback_url:', response?.feedback_url);

      // Clear form
      setCompletionData({
        work_done: '',
        parts_used: '',
        before_photo: null,
        after_photo: null
      });
      setBeforePreview(null);
      setAfterPreview(null);
      
      // Show QR code modal via parent callback
      if (response?.feedback_qr && response?.feedback_url) {
        console.log('✅ CONDITION MET: Has feedback_qr and feedback_url');
        if (onShowQR) {
          onShowQR(response.feedback_qr, response.feedback_url);
        }
        showToast('✅ Service completed! QR code ready to share.', 'success');
      } else if (response?.id) {
        // Fallback: generate feedback URL from service ID
        const feedbackUrl = `${window.location.origin}/feedback/${response.id}`;
        console.log('⚠️ Using fallback feedback URL:', feedbackUrl);
        if (onShowQR) {
          onShowQR(null, feedbackUrl);
        }
        showToast('✅ Service completed! Feedback link ready.', 'success');
      } else {
        console.log('❌ NO FEEDBACK DATA - response:', response);
        showToast('✅ Service completed successfully!', 'success');
      }
      
      // Delay update to allow modal to show
      setTimeout(() => {
        onUpdate();
      }, 300);
    } catch (error) {
      console.error('Completion failed:', error);
      showToast(error.message || 'Failed to complete service', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    const preview = URL.createObjectURL(file);
    
    if (type === 'before') {
      setCompletionData(prev => ({ ...prev, before_photo: file }));
      setBeforePreview(preview);
    } else {
      setCompletionData(prev => ({ ...prev, after_photo: file }));
      setAfterPreview(preview);
    }
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 99999;
      animation: slideIn 0.3s ease;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0'
    }}>
      {/* NEW / ASSIGNED STATUS */}
      {(service.status === 'NEW' || service.status === 'ASSIGNED') && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCheckIn}
            disabled={loading}
            style={{
              flex: '1 1 200px',
              padding: '14px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            📍 Check-In at Location
          </button>
          
          <button
            onClick={handleStart}
            disabled={loading}
            style={{
              flex: '1 1 200px',
              padding: '14px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            ▶️ Start Service
          </button>
        </div>
      )}

      {/* ON THE WAY STATUS */}
      {service.status === 'ON_THE_WAY' && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                await apiRequest(`/api/service-requests/${service.id}/status`, {
                  method: 'PUT',
                  body: JSON.stringify({ status: 'IN_PROGRESS' })
                });
                showToast('✅ Started work on service!', 'success');
                onUpdate();
              } catch (error) {
                console.error('Error:', error);
                showToast(error.message || 'Failed to start work', 'error');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            style={{
              flex: '1 1 200px',
              padding: '14px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🔧 Start Work
          </button>
        </div>
      )}

      {/* IN PROGRESS STATUS */}
      {service.status === 'IN_PROGRESS' && (
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '20px'
          }}>
            Complete Service
          </h3>

          {/* WORK DONE */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '700',
              color: '#475569',
              marginBottom: '8px'
            }}>
              Work Done *
            </label>
            <textarea
              value={completionData.work_done}
              onChange={(e) => setCompletionData(prev => ({ ...prev, work_done: e.target.value }))}
              placeholder="Describe the work performed..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                minHeight: '100px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* PARTS USED */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '700',
              color: '#475569',
              marginBottom: '8px'
            }}>
              Parts Used (Optional)
            </label>
            <input
              type="text"
              value={completionData.parts_used}
              onChange={(e) => setCompletionData(prev => ({ ...prev, parts_used: e.target.value }))}
              placeholder="e.g., Toner cartridge, Drum unit..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '14px'
              }}
            />
          </div>

          {/* PHOTO UPLOADS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {/* BEFORE PHOTO */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '700',
                color: '#475569',
                marginBottom: '8px'
              }}>
                Before Photo *
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handlePhotoChange(e, 'before')}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              />
              {beforePreview && (
                <div style={{
                  marginTop: '12px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid #e2e8f0'
                }}>
                  <img
                    src={beforePreview}
                    alt="Before"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '200px',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}
            </div>

            {/* AFTER PHOTO */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '700',
                color: '#475569',
                marginBottom: '8px'
              }}>
                After Photo *
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handlePhotoChange(e, 'after')}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              />
              {afterPreview && (
                <div style={{
                  marginTop: '12px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid #e2e8f0'
                }}>
                  <img
                    src={afterPreview}
                    alt="After"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '200px',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* COMPLETE BUTTON */}
          <button
            onClick={handleComplete}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Completing...' : '✅ Complete Service'}
          </button>
        </div>
      )}

      {/* COMPLETED STATUS */}
      {service.status === 'COMPLETED' && (
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <div style={{
            fontSize: '18px',
            fontWeight: '800',
            color: '#166534',
            marginBottom: '4px'
          }}>
            Service Completed
          </div>
          <div style={{ fontSize: '14px', color: '#15803d' }}>
            {service.completed_at && new Date(service.completed_at).toLocaleString()}
          </div>
        </div>
      )}


    </div>
  );
}

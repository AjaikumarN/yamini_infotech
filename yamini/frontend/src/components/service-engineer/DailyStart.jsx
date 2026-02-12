import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';
import { API_BASE_URL } from '../../config';

const DailyStart = () => {
  const { user } = useContext(AuthContext);
  
  const [attendanceStatus, setAttendanceStatus] = useState({
    checked_in: false,
    loading: true,
    attendance: null
  });
  const [checkingIn, setCheckingIn] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    checkAttendanceStatus();
  }, []);

  const checkAttendanceStatus = async () => {
    try {
      const data = await apiRequest('/api/attendance/status');
      setAttendanceStatus({
        checked_in: data.checked_in,
        attendance: data.attendance,
        loading: false
      });
    } catch (error) {
      console.error('Failed to check attendance:', error);
      setAttendanceStatus({ checked_in: false, loading: false, attendance: null });
    }
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      console.log('Camera stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());
      
      setStream(mediaStream);
      setUseCamera(true);
      
      // Wait for next tick to ensure state is updated
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          console.log('Video srcObject set');
          
          // Force play when metadata is loaded
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            videoRef.current.play()
              .then(() => console.log('Video playing successfully'))
              .catch(err => console.error('Play error:', err));
          };
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('❌ Could not access camera. Please check permissions or use Upload Photo option.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        setPhotoFile(blob);
        setPhotoPreview(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  useEffect(() => {
    // Cleanup camera stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleCheckIn = async () => {
    if (!photoFile) {
      alert('⚠️ Please capture your photo first');
      return;
    }

    setCheckingIn(true);

    try {
      if (!navigator.geolocation) {
        setCheckingIn(false);
        alert('❌ Geolocation is not supported by your browser');
        return;
      }

      // Request location permission
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const isLate = hours > 9 || (hours === 9 && minutes > 30);

            // Get detailed address using reverse geocoding
            let detailedLocation = 'Field Location';
            try {
              const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?` +
                `lat=${position.coords.latitude}&` +
                `lon=${position.coords.longitude}&` +
                `format=json&` +
                `addressdetails=1&` +
                `zoom=18`,
                {
                  headers: {
                    'User-Agent': 'YaminiInfotech/1.0'
                  }
                }
              );
              
              if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                const addr = geoData.address;
                
                // Build detailed address: Area/Colony, Road/Street, City
                const parts = [];
                
                // Add area/colony/suburb
                if (addr.suburb || addr.neighbourhood || addr.quarter) {
                  parts.push(addr.suburb || addr.neighbourhood || addr.quarter);
                }
                
                // Add road/street
                if (addr.road) {
                  parts.push(addr.road);
                }
                
                // Add city/town/village
                if (addr.city || addr.town || addr.village) {
                  parts.push(addr.city || addr.town || addr.village);
                }
                
                // Add state
                if (addr.state) {
                  parts.push(addr.state);
                }
                
                detailedLocation = parts.length > 0 ? parts.join(', ') : geoData.display_name;
              }
            } catch (geoError) {
              console.warn('Reverse geocoding failed, using coordinates:', geoError);
              detailedLocation = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
            }

            const formData = new FormData();
            formData.append('photo', photoFile);
            formData.append('latitude', position.coords.latitude.toString());
            formData.append('longitude', position.coords.longitude.toString());
            formData.append('attendance_status', isLate ? 'Late' : 'Present');
            formData.append('time', now.toLocaleTimeString());
            formData.append('location', detailedLocation);

            // Get token from localStorage yamini_user
            const user = JSON.parse(localStorage.getItem('yamini_user') || '{}');
            const token = user.token;

            const response = await fetch(
              `${API_BASE_URL}/api/attendance/check-in`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`
                },
                body: formData
              }
            );

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.detail || 'Check-in failed');
            }

            const data = await response.json();
            
            setAttendanceStatus({
              checked_in: true,
              attendance: data,
              loading: false
            });

            alert(isLate 
              ? '⏰ Checked in (Late). Your dashboard is now unlocked.'
              : '✅ Checked in successfully! Your dashboard is now unlocked.'
            );

          } catch (error) {
            console.error('Check-in error:', error);
            alert('❌ Check-in failed: ' + error.message);
            setCheckingIn(false);
          }
        },
        (error) => {
          console.warn('GPS location unavailable:', error);
          // Continue with attendance marking even without location
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,  // Increased to 30 seconds for better accuracy
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('Check-in initialization error:', error);
      alert('❌ Check-in failed: ' + error.message);
      setCheckingIn(false);
    }
  };

  if (attendanceStatus.loading) {
    return (
      <div className="daily-start-loading">
        <div className="spinner"></div>
        <p>Loading attendance status...</p>
      </div>
    );
  }

  if (attendanceStatus.checked_in) {
    const attendance = attendanceStatus.attendance;
    const checkInTime = new Date(attendance?.date || attendance?.check_in_time);
    const isLate = attendance?.status === 'Late';

    return (
      <div className="daily-start-container">
        <div className="attendance-confirmed">
          <div className={`status-icon ${isLate ? 'late' : 'on-time'}`}>
            {isLate ? '⏰' : '✅'}
          </div>
          <h1>Attendance Confirmed</h1>
          <p className={`status-message ${isLate ? 'late' : 'on-time'}`}>
            {isLate 
              ? 'You checked in late today'
              : 'You checked in on time today'
            }
          </p>

          <div className="attendance-details">
            <div className="detail-row">
              <span className="detail-label">👤 Engineer:</span>
              <span className="detail-value">{user?.full_name || user?.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">🕐 Check-in Time:</span>
              <span className="detail-value">{checkInTime.toLocaleTimeString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">📅 Date:</span>
              <span className="detail-value">{checkInTime.toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">📍 Location:</span>
              <span className="detail-value">
                {attendance?.latitude && attendance?.longitude
                  ? `${attendance.latitude.toFixed(6)}, ${attendance.longitude.toFixed(6)}`
                  : 'Location recorded'
                }
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">📊 Status:</span>
              <span className={`status-badge ${isLate ? 'badge-late' : 'badge-on-time'}`}>
                {attendance?.status || 'Present'}
              </span>
            </div>
          </div>

          <div className="attendance-message">
            <p>✨ Your dashboard is now unlocked. You can access all service requests.</p>
          </div>
        </div>

        <style>{`
          .daily-start-container {
            max-width: 600px;
            margin: 40px auto;
            padding: 24px;
          }

          .attendance-confirmed {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            text-align: center;
          }

          .status-icon {
            font-size: 72px;
            margin-bottom: 20px;
          }

          .status-icon.late {
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          .attendance-confirmed h1 {
            margin: 0 0 12px 0;
            color: #1f2937;
          }

          .status-message {
            font-size: 16px;
            margin-bottom: 32px;
          }

          .status-message.on-time {
            color: #10b981;
          }

          .status-message.late {
            color: #f59e0b;
          }

          .attendance-details {
            background: #f9fafb;
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 24px;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }

          .detail-row:last-child {
            border-bottom: none;
          }

          .detail-label {
            font-weight: 600;
            color: #6b7280;
          }

          .detail-value {
            color: #1f2937;
          }

          .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 13px;
          }

          .badge-on-time {
            background: #d1fae5;
            color: #065f46;
          }

          .badge-late {
            background: #fef3c7;
            color: #92400e;
          }

          .attendance-message {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            border-radius: 8px;
          }

          .attendance-message p {
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="daily-start-container">
      <div className="check-in-card">
        <div className="card-header">
          <div className="header-icon">🔐</div>
          <h1>Daily Attendance</h1>
          <p>Start your workday by checking in</p>
        </div>

        <div className="check-in-info">
          <div className="info-item">
            <span className="info-icon">⏰</span>
            <div className="info-content">
              <strong>Time Policy</strong>
              <p>Before 9:30 AM → On Time | After 9:30 AM → Late</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📸</span>
            <div className="info-content">
              <strong>Photo Required</strong>
              <p>Capture your photo for verification</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📍</span>
            <div className="info-content">
              <strong>Location Tracking</strong>
              <p>GPS location will be recorded</p>
            </div>
          </div>
        </div>

        <div className="photo-capture-section">
          <h3>📸 Capture Your Photo</h3>
          {photoPreview ? (
            <div className="photo-preview">
              <img src={photoPreview} alt="Preview" />
              <button 
                className="btn-retake"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
              >
                🔄 Retake Photo
              </button>
            </div>
          ) : useCamera ? (
            <div className="camera-view">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  console.log('Video element metadata loaded');
                  e.target.play().catch(err => console.error('Play failed:', err));
                }}
                style={{ 
                  width: '100%',
                  height: '400px',
                  borderRadius: '12px',
                  background: '#000',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button 
                  className="btn-capture"
                  onClick={capturePhoto}
                >
                  📷 Capture Photo
                </button>
                <button 
                  className="btn-cancel"
                  onClick={stopCamera}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="photo-options">
              <button 
                className="btn-camera"
                onClick={startCamera}
              >
                📷 Use Camera
              </button>
              <div className="or-divider">OR</div>
              <div className="photo-capture">
                <label htmlFor="photo-input" className="photo-capture-label">
                  <div className="capture-placeholder">
                    <div className="camera-icon">📁</div>
                    <p>Upload Photo</p>
                  </div>
                </label>
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoCapture}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="current-time">
          <span className="time-icon">🕐</span>
          <span className="time-value">{new Date().toLocaleString()}</span>
        </div>

        <button 
          className="btn-check-in"
          onClick={handleCheckIn}
          disabled={checkingIn || !photoFile}
        >
          {checkingIn ? (
            <>
              <span className="spinner-small"></span>
              Checking In...
            </>
          ) : (
            <>
              ✅ Check In Now
            </>
          )}
        </button>

        <div className="warning-box">
          ⚠️ <strong>Important:</strong> You must check in before accessing your dashboard and service requests.
        </div>
      </div>

      <style>{`
        .daily-start-container {
          max-width: 600px;
          margin: 40px auto;
          padding: 24px;
        }

        .daily-start-loading {
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

        .check-in-card {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }

        .card-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .header-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .card-header h1 {
          margin: 0 0 8px 0;
          color: #1f2937;
        }

        .card-header p {
          color: #6b7280;
          margin: 0;
        }

        .check-in-info {
          background: #f9fafb;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 32px;
        }

        .info-item {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .info-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .info-icon {
          font-size: 24px;
        }

        .info-content strong {
          display: block;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .info-content p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .photo-capture-section {
          margin-bottom: 24px;
        }

        .photo-capture-section h3 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .photo-capture {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }

        .photo-capture:hover {
          border-color: #667eea;
          background: #f9fafb;
        }

        .photo-capture-label {
          cursor: pointer;
          display: block;
        }

        .capture-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .camera-icon {
          font-size: 48px;
        }

        .photo-preview {
          text-align: center;
        }

        .photo-preview img {
          max-width: 100%;
          max-height: 300px;
          border-radius: 12px;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .btn-retake {
          background: #6b7280;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-retake:hover {
          background: #4b5563;
        }

        .current-time {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: #eff6ff;
          border-radius: 8px;
          margin-bottom: 24px;
          font-weight: 600;
          color: #1e40af;
        }

        .time-icon {
          font-size: 20px;
        }

        .btn-check-in {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-check-in:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .btn-check-in:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .warning-box {
          margin-top: 24px;
          padding: 16px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 8px;
          color: #92400e;
          font-size: 14px;
        }

        .warning-box strong {
          font-weight: 700;
        }

        .photo-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .btn-camera {
          padding: 16px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-camera:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .or-divider {
          text-align: center;
          color: #6b7280;
          font-weight: 600;
          padding: 8px 0;
        }

        .camera-view {
          text-align: center;
        }

        .btn-capture {
          flex: 1;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-capture:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-cancel {
          flex: 1;
          padding: 12px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-cancel:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default DailyStart;

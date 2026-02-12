import React, { useState, useEffect } from 'react';
import { checkTodayAttendance, markAttendance } from '../hooks/useSalesmanApi';
import '../styles/salesman.css';

/**
 * Attendance Page - Optional attendance marking
 * NO blocking, soft reminders only
 * Includes photo capture and GPS location
 */
export default function Attendance() {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  useEffect(() => {
    checkAttendance();
    return () => {
      // Cleanup camera stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const checkAttendance = async () => {
    try {
      const data = await checkTodayAttendance();
      setTodayAttendance(data);
      
      // If attendance is already marked, don't start camera
      if (data) {
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Failed to check attendance:', error);
    } finally {
      setLoading(false);
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
      console.error('Failed to access camera:', error);
      alert('❌ Unable to access camera. Please check permissions or use Upload Photo option.');
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
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        setPhoto(blob);
        setPhotoPreview(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reverse geocoding function to get area/city name from coordinates
  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=18`,
        {
          headers: {
            'User-Agent': 'YaminiInfotech/1.0'
          }
        }
      );
      const data = await response.json();
      
      // Extract detailed location components
      const addr = data.address || {};
      const parts = [];
      
      // Add area/colony/suburb/neighbourhood
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
      
      // Return formatted address or fallback
      return parts.length > 0 ? parts.join(', ') : data.display_name || 'Location detected';
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`; // Fallback to coordinates
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!photo) {
      alert('Please capture a photo before marking attendance');
      return;
    }

    setSubmitting(true);

    try {
      // Try to get GPS location, but don't fail if unavailable
      let lat = null;
      let lon = null;
      let locationName = 'Location unavailable';

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
          );
        });

        lat = position.coords.latitude;
        lon = position.coords.longitude;

        // Get readable location name (city/area)
        locationName = await reverseGeocode(lat, lon);
      } catch (gpsError) {
        console.warn('GPS location unavailable:', gpsError);
        // Continue with attendance marking even without location
      }

      const formData = new FormData();
      formData.append('photo', photo);
      if (lat !== null && lon !== null) {
        formData.append('latitude', lat);
        formData.append('longitude', lon);
      } else {
        // Use fallback coordinates if GPS fails
        formData.append('latitude', 0);
        formData.append('longitude', 0);
      }
      formData.append('location', locationName);
      
      // Format time as HH:MM:SS for backend
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      formData.append('time', timeString);
      formData.append('attendance_status', 'Present');

      console.log('Submitting attendance with:', {
        photo: photo.name || photo.type,
        latitude: lat || 0,
        longitude: lon || 0,
        location: locationName,
        time: timeString
      });

      await markAttendance(formData);
      alert(`✅ Attendance marked successfully!\n📍 Location: ${locationName}`);
      
      // Recheck attendance
      await checkAttendance();
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      alert(error.response?.data?.detail || 'Failed to mark attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-header"><h2 className="page-title">Loading...</h2></div>;
  }

  // Already marked
  if (todayAttendance) {
    return (
      <div>
        <div className="page-header">
          <h2 className="page-title">✅ Attendance Completed</h2>
          <p className="page-description">You have already marked your attendance for today</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '20px',
          padding: '40px',
          margin: '20px 0',
          textAlign: 'center',
          color: 'white',
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>✓</div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
            Attendance Verified
          </h2>
          <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '8px' }}>
            Check-in Time: {todayAttendance.time || new Date(todayAttendance.check_in_time).toLocaleTimeString()}
          </p>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>
            Status: {todayAttendance.status || 'Present'}
          </p>
          <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '8px' }}>
            Location: {todayAttendance.location || 'Recorded'}
          </p>
        </div>

        <div style={{
          marginTop: '24px',
          padding: '20px',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <p style={{ fontSize: '14px', color: '#059669', textAlign: 'center', margin: 0 }}>
            📍 Your attendance has been recorded with photo verification and GPS location
          </p>
        </div>
      </div>
    );
  }

  // Mark attendance form
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Mark Attendance</h2>
        <p className="page-description">Optional attendance marking for better tracking</p>
      </div>

      <div className="attendance-banner not-marked">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
          <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
            Attendance Not Marked Yet
          </div>
          <div style={{ fontSize: '14px', color: '#92400E' }}>
            You can mark your attendance below (optional)
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label className="form-label">Capture Photo *</label>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={startCamera}
              className="btn btn-secondary"
              disabled={useCamera}
              style={{
                background: useCamera ? '#D1D5DB' : '#10B981',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: useCamera ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              📷 Use Camera
            </button>
            <label 
              style={{
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              📁 Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {useCamera && (
            <div style={{ marginBottom: '16px' }}>
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
                  maxWidth: '400px',
                  borderRadius: '8px',
                  border: '2px solid #E5E7EB',
                  background: '#000',
                  objectFit: 'cover',
                  display: 'block',
                  marginBottom: '12px'
                }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="btn btn-primary"
                  style={{
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  📸 Capture
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="btn btn-secondary"
                  style={{
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {photoPreview && (
            <div style={{ marginTop: '12px' }}>
              <img
                src={photoPreview}
                alt="Preview"
                style={{ 
                  maxWidth: '300px', 
                  borderRadius: '8px', 
                  border: '2px solid #10B981',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  setPhotoPreview('');
                }}
                style={{
                  display: 'block',
                  marginTop: '8px',
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🗑 Remove Photo
              </button>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting || !photo}>
            {submitting ? 'Marking...' : '✓ Mark Attendance'}
          </button>
        </div>

        <div style={{ marginTop: '16px', fontSize: '14px', color: '#64748B' }}>
          📍 GPS location will be captured automatically
        </div>
      </form>
    </div>
  );
}

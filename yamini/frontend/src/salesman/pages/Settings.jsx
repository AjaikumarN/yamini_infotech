import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';

export default function SalesmanSettings({ onClose }) {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    photograph: user?.photograph || null
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    new_enquiry: true,
    new_order: true,
    followup_reminder: true,
    daily_target: true,
    email_alerts: false
  });
  
  // Other state
  const [lastLogin, setLastLogin] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photograph || null);

  useEffect(() => {
    fetchSettings();
    fetchUserData();
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      const userData = await apiRequest(`/api/users/${user.id}`);
      if (userData) {
        setProfile({
          full_name: userData.full_name || '',
          email: userData.email || '',
          mobile: userData.mobile || '',
          photograph: userData.photograph || null
        });
        setPhotoPreview(userData.photograph);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      // Get notification settings from localStorage for now
      const saved = localStorage.getItem('salesman_notifications');
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
      
      // Get last login info from localStorage
      const lastLoginTime = localStorage.getItem('last_login');
      if (lastLoginTime) {
        setLastLogin(new Date(lastLoginTime));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!profile.full_name || !profile.mobile) {
      showToast('Please fill all fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const updatedUser = await apiRequest(`/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: profile.full_name,
          mobile: profile.mobile,
          photograph: photoPreview
        })
      });
      showToast('Profile updated successfully!', 'success');
      // Update AuthContext to refresh header avatar immediately
      if (setUser && updatedUser) {
        setUser(updatedUser);
      }
      // Refresh user data to show updated info including photo
      fetchUserData();
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('salesman_notifications', JSON.stringify(updated));
    showToast('Notification settings updated!', 'success');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setProfile({ ...profile, photograph: reader.result });
        showToast('Photo selected. Click "Save Profile" to confirm upload.', 'info');
      };
      reader.readAsDataURL(file);
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
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getFormattedDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '95%',
        maxWidth: '800px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
            Settings
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          overflowX: 'auto'
        }}>
          {[
            { id: 'profile', label: '👤 Profile' },
            { id: 'notifications', label: '🔔 Notifications' },
            { id: 'security', label: '🔒 Security' },
            { id: 'help', label: '❓ Help & Support' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1',
                padding: '16px',
                border: 'none',
                background: activeTab === tab.id ? '#f0f9ff' : 'white',
                borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : 'none',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Profile Photo */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                paddingBottom: '20px',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: '#e0e7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  overflow: 'hidden'
                }}>
                  {photoPreview ? (
                    <img src={photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                  ) : (
                    '💼'
                  )}
                </div>
                <label style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'none'
                }}>
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {/* Full Name */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  readOnly
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    backgroundColor: '#f9fafb',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={profile.mobile}
                  readOnly
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    backgroundColor: '#f9fafb',
                    cursor: 'not-allowed'
                  }}
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* Last Login */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                borderLeft: '4px solid #3b82f6'
              }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Last Login
                </label>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#1e293b' }}>
                  {getFormattedDate(lastLogin || user?.created_at)}
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleProfileUpdate}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'none'
                }}
              >
                Save Profile
              </button>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                Control alerts relevant to your sales work
              </p>

              {[
                { key: 'new_enquiry', label: '📧 New Enquiry Notifications', desc: 'Get notified when new customer enquiries arrive' },
                { key: 'new_order', label: '✅ New Order Alerts', desc: 'Get notified when orders are placed' },
                { key: 'followup_reminder', label: '🔔 Followup Reminders', desc: 'Get reminded for customer followups' },
                { key: 'daily_target', label: '🎯 Daily Target Alert', desc: 'Get notified about daily sales targets' },
                { key: 'email_alerts', label: '✉️ Email Alerts', desc: 'Receive important alerts via email' }
              ].map(notif => (
                <div
                  key={notif.key}
                  style={{
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                      {notif.label}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      {notif.desc}
                    </p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={notifications[notif.key]}
                      onChange={() => handleNotificationChange(notif.key)}
                      style={{ marginRight: '8px', cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {notifications[notif.key] ? 'ON' : 'OFF'}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#d1fae5',
                borderRadius: '8px',
                borderLeft: '4px solid #10b981'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
                  ✅ Session Status
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>
                  Your session is active and secure
                </p>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                borderLeft: '4px solid #3b82f6'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  ⏱️ Session Timeout
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e3a8a' }}>
                  Your session will automatically expire after <strong>30 minutes</strong> of inactivity for security purposes.
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#3730a3' }}>
                  You will be logged out and need to sign in again.
                </p>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#f5f3ff',
                borderRadius: '8px',
                borderLeft: '4px solid #8b5cf6'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#4c1d95' }}>
                  🔐 Security Tips
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', color: '#5b21b6' }}>
                  <li>Never share your password with anyone</li>
                  <li>Log out when leaving your workstation</li>
                  <li>Use a strong password with mix of characters</li>
                  <li>Keep your profile information up to date</li>
                </ul>
              </div>
            </div>
          )}

          {/* HELP & SUPPORT TAB */}
          {activeTab === 'help' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                borderLeft: '4px solid #3b82f6'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  📖 How to Use Salesman Dashboard
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#1e3a8a', lineHeight: '1.6' }}>
                  <li><strong>Dashboard Overview:</strong> Track your daily enquiries, orders, and sales targets</li>
                  <li><strong>Enquiries:</strong> Manage customer inquiries and convert to orders</li>
                  <li><strong>Orders:</strong> View and track your sales orders</li>
                  <li><strong>Followups:</strong> Manage customer followup schedules</li>
                  <li><strong>Daily Report:</strong> Submit your daily sales report and activities</li>
                  <li><strong>Compliance:</strong> Track compliance with company policies</li>
                </ul>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                borderLeft: '4px solid #f59e0b'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                  ❓ Frequently Asked Questions
                </h4>
                <div style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.8' }}>
                  <p><strong>Q: How do I update my profile?</strong></p>
                  <p>Go to Settings → Profile tab to update your name, mobile number, and profile photo.</p>
                  
                  <p><strong>Q: How do I submit my daily report?</strong></p>
                  <p>Navigate to Daily Report section and fill in your activities, sales, and any notes.</p>
                  
                  <p><strong>Q: Where can I see my sales targets?</strong></p>
                  <p>Your daily, weekly, and monthly targets are visible on the Dashboard overview.</p>
                </div>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#ffe4e6',
                borderRadius: '8px',
                borderLeft: '4px solid #ec4899'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#831843' }}>
                  📞 Contact Admin / IT Support
                </h4>
                <p style={{ margin: '0', fontSize: '13px', color: '#500724' }}>
                  For technical issues or assistance, contact: <strong>support@yamini.com</strong> or <strong>+91-XXXX-XXXX-XX</strong>
                </p>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#e0e7ff',
                borderRadius: '8px',
                borderLeft: '4px solid #6366f1'
              }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#312e81' }}>
                  ℹ️ App Version
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#3f3d56' }}>
                  Version 2.1.0 | Last updated: January 2026
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

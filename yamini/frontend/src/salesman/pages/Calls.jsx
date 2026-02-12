import React, { useState, useEffect } from 'react';
import { getMyCalls, createCall } from '../hooks/useSalesmanApi';
import EmptyState from '../components/EmptyState';
import ExportButtons from '../components/ExportButtons';
import PhotoGallery from '../components/PhotoGallery';
import { showToast } from '../components/ToastNotification';
import ActionButton from '../../components/shared/dashboard/ActionButton';
import DataCard from '../../components/shared/dashboard/DataCard';
import StatusBadge from '../../components/shared/dashboard/StatusBadge';
import '../styles/salesman.css';

/**
 * Calls Page - Enhanced call logging with voice-to-text and photos
 * Includes voice-to-text input button and export functionality
 */
export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // all, today, week
  const [photos, setPhotos] = useState([]);
  const [voiceLang, setVoiceLang] = useState('en-US'); // Default to English
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    call_type: '',
    notes: '',
    outcome: '',
  });

  useEffect(() => {
    loadCalls();
  }, [filter]);

  const loadCalls = async () => {
    try {
      const todayOnly = filter === 'today';
      const data = await getMyCalls(todayOnly);
      
      // Additional filtering for week
      if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const filtered = data.filter(call => 
          new Date(call.created_at) >= weekAgo
        );
        setCalls(filtered);
      } else {
        setCalls(data);
      }
    } catch (error) {
      console.error('Failed to load calls:', error);
      showToast && showToast('Failed to load calls', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      showToast && showToast('Speech recognition not supported in this browser', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang; // Use selected language (Tamil or English)
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      showToast && showToast(
        voiceLang === 'ta-IN' ? '🎤 கேட்கிறது... (Tamil)' : '🎤 Listening... (English)', 
        'info', 
        2000
      );
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({
        ...prev,
        notes: prev.notes + (prev.notes ? ' ' : '') + transcript
      }));
      showToast && showToast('✓ Voice note added!', 'success');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        showToast && showToast('No speech detected. Please try again.', 'warning');
      } else if (event.error === 'network') {
        showToast && showToast('Network error. Check your connection.', 'error');
      } else {
        showToast && showToast('Voice input failed. Please try again.', 'error');
      }
    };

    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await createCall(formData);
      showToast && showToast('✅ Call logged successfully!', 'success');
      setShowForm(false);
      setFormData({ customer_name: '', phone: '', call_type: '', notes: '', outcome: '' });
      setPhotos([]);
      await loadCalls();
    } catch (error) {
      console.error('Failed to create call:', error);
      showToast && showToast('Failed to log call', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPhoto = (photo) => {
    setPhotos(prev => [...prev, photo]);
  };

  const handleDeletePhoto = (photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#6B7280' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
            Call Logs
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            {calls.length} total calls • Track your interactions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              background: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: '150px'
            }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Calls</option>
            <option value="today">📅 Today</option>
            <option value="week">📆 This Week</option>
          </select>
          <ExportButtons data={calls} filename="calls" type="calls" />
          <ActionButton 
            variant="primary" 
            icon="phone"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Log Call'}
          </ActionButton>
        </div>
      </div>

      {/* Call Form */}
      {showForm && (
        <DataCard title="Log New Call" subtitle="Record your customer interaction" noPadding>
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Customer Info Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Customer Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                    placeholder="Enter customer name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Phone Number <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="Enter phone number"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Call Type Row */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Call Type <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formData.call_type}
                  onChange={(e) => setFormData({ ...formData, call_type: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select call type</option>
                  <option value="Cold">❄️ Cold Call</option>
                  <option value="Warm">🌤️ Warm Call</option>
                  <option value="Hot">🔥 Hot Call</option>
                </select>
              </div>

              {/* Call Notes with Voice Input */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Call Notes <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <select
                    value={voiceLang}
                    onChange={(e) => setVoiceLang(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="en-US">🇬🇧 English</option>
                    <option value="ta-IN">தமிழ் Tamil</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    title="Voice input"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      border: '1px solid #3B82F6',
                      background: '#DBEAFE',
                      color: '#1E40AF',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#3B82F6';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#DBEAFE';
                      e.currentTarget.style.color = '#1E40AF';
                    }}
                  >
                    🎤 Voice Input
                  </button>
                </div>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Describe the call details... (Click Voice Input to speak)"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D1D5DB';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Outcome */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Call Outcome <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select outcome</option>
                  <option value="interested">✅ Interested</option>
                  <option value="not_interested">❌ Not Interested</option>
                  <option value="callback">📞 Call Back Later</option>
                  <option value="converted">🎉 Converted to Order</option>
                </select>
              </div>

              {/* Photo Gallery */}
              <PhotoGallery
                photos={photos}
                onAddPhoto={handleAddPhoto}
                onDeletePhoto={handleDeletePhoto}
              />

              {/* Submit Button */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    background: submitting ? '#D1D5DB' : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  {submitting ? 'Logging...' : 'Log Call'}
                </button>
              </div>
            </div>
          </form>
        </DataCard>
      )}

      {/* Calls List */}
      {calls.length === 0 ? (
        <EmptyState icon="📞" message="No calls logged yet. Start by logging your first call!" />
      ) : (
        <DataCard
          title={`Call History (${calls.length})`}
          subtitle="Your recent customer interactions"
          noPadding
        >
          {/* Calls Table */}
          <div style={{ overflowX: 'auto' }}>
            <div>
              {calls.map((call, index) => (
                <div 
                  key={call.id} 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 2.5fr 1.2fr 1.2fr',
                    gap: '16px',
                    padding: '16px 20px',
                    borderBottom: index < calls.length - 1 ? '1px solid #F3F4F6' : 'none',
                    alignItems: 'center',
                    transition: 'background-color 0.15s',
                    minWidth: '900px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                >
                  {/* Customer Name + Phone */}
                  <div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: '#111827',
                      marginBottom: '2px'
                    }}>
                      {call.customer_name}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#9CA3AF'
                    }}>
                      ☎️ {call.phone}
                    </div>
                  </div>

                  {/* Call Purpose */}
                  <div style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                    {call.call_purpose || 'General inquiry'}
                  </div>

                  {/* Notes/Details */}
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6B7280'
                  }}>
                    {call.notes?.substring(0, 50) || 'No notes'}
                    {call.notes?.length > 50 ? '...' : ''}
                  </div>

                  {/* Outcome Badge */}
                  <div>
                    <StatusBadge 
                      status={call.outcome?.toUpperCase().replace('_', ' ') || 'PENDING'}
                      variant={call.outcome?.toLowerCase() || 'pending'}
                      size="sm"
                    />
                  </div>

                  {/* Date/Time */}
                  <div style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'right', fontWeight: '500' }}>
                    <div>{new Date(call.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}</div>
                    <div>{new Date(call.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DataCard>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { submitDailyReport, getTodayReport } from '../hooks/useSalesmanApi';
import '../styles/salesman.css';

/**
 * DailyReport Page - Enhanced end of day report submission with voice input
 */
export default function DailyReport() {
  const [todayReport, setTodayReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    calls_made: '',
    meetings_done: '',
    orders_closed: '',
    challenges: '',
    achievements: '',
    tomorrow_plan: '',
  });
  
  // Voice input states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingField, setRecordingField] = useState(null);
  const recognitionRef = useRef(null);
  const recordingFieldRef = useRef(null);

  useEffect(() => {
    checkTodayReport();
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const field = recordingFieldRef.current;
        
        if (field) {
          setFormData(prev => ({
            ...prev,
            [field]: prev[field] ? prev[field] + ' ' + transcript : transcript
          }));
        }
        setIsRecording(false);
        setRecordingField(null);
        recordingFieldRef.current = null;
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setRecordingField(null);
        recordingFieldRef.current = null;
        
        let errorMsg = 'Voice input failed. ';
        if (event.error === 'no-speech') {
          errorMsg += 'No speech detected. Please try again.';
        } else if (event.error === 'not-allowed') {
          errorMsg += 'Microphone access denied. Please allow microphone access.';
        } else {
          errorMsg += 'Please try again.';
        }
        alert(errorMsg);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
        setRecordingField(null);
        recordingFieldRef.current = null;
      };

      recognitionRef.current = recognitionInstance;
    }
  }, []);

  const toggleVoiceInput = (field) => {
    if (!recognitionRef.current) {
      alert('Voice input not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setRecordingField(null);
      recordingFieldRef.current = null;
    } else {
      try {
        setIsRecording(true);
        setRecordingField(field);
        recordingFieldRef.current = field;
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
        alert('Failed to start voice input. Please check microphone permissions.');
        setIsRecording(false);
        setRecordingField(null);
        recordingFieldRef.current = null;
      }
    }
  };

  const checkTodayReport = async () => {
    try {
      const report = await getTodayReport();
      setTodayReport(report);
    } catch (error) {
      // No report for today is fine
      console.log('No report for today yet');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        calls_made: parseInt(formData.calls_made) || 0,
        meetings_done: parseInt(formData.meetings_done) || 0,
        orders_closed: parseInt(formData.orders_closed) || 0
      };
      
      await submitDailyReport(submitData);
      alert('✅ Daily report submitted successfully!');
      await checkTodayReport();
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert(error.response?.data?.detail || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-header"><h2 className="page-title">Loading...</h2></div>;
  }

  // Already submitted
  if (todayReport) {
    return (
      <div>
        <div className="page-header">
          <h2 className="page-title">Daily Report</h2>
          <p className="page-description">Your report for today</p>
        </div>

        <div className="attendance-banner marked">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
              Daily Report Already Submitted
            </div>
            <div style={{ fontSize: '14px', color: '#059669' }}>
              Submitted at: {new Date(todayReport.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="section-title" style={{ fontSize: '24px', fontWeight: '700', marginBottom: '28px', color: '#1F2937' }}>📊 Report Summary</h3>
          <div className="report-summary" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Calls Made Summary Card */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '32px 24px',
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(102, 126, 234, 0.25)',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(102, 126, 234, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.25)';
            }}
            >
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                📞 Calls Made
              </div>
              <div style={{ fontSize: '52px', fontWeight: '900', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {todayReport.calls_made || 0}
              </div>
            </div>

            {/* Meetings Done Summary Card */}
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
              padding: '32px 24px',
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(245, 158, 11, 0.25)',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(245, 158, 11, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(245, 158, 11, 0.25)';
            }}
            >
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🤝 Meetings Done
              </div>
              <div style={{ fontSize: '52px', fontWeight: '900', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {todayReport.meetings_done || 0}
              </div>
            </div>

            {/* Orders Closed Summary Card */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '32px 24px',
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(16, 185, 129, 0.25)',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(16, 185, 129, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.25)';
            }}
            >
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ✅ Orders Closed
              </div>
              <div style={{ fontSize: '52px', fontWeight: '900', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {todayReport.orders_closed || 0}
              </div>
            </div>
          </div>
          {todayReport.achievements && (
            <div className="report-field">
              <div className="report-field-label">Achievements</div>
              <div className="report-field-value">{todayReport.achievements}</div>
            </div>
          )}
          {todayReport.challenges && (
            <div className="report-field">
              <div className="report-field-label">Challenges</div>
              <div className="report-field-value">{todayReport.challenges}</div>
            </div>
          )}
          {todayReport.tomorrow_plan && (
            <div className="report-field">
              <div className="report-field-label">Tomorrow's Plan</div>
              <div className="report-field-value">{todayReport.tomorrow_plan}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Submit form
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">📝 Daily Report</h2>
        <p className="page-description">Submit your end-of-day report</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Calls Made Card */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '32px 24px',
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(102, 126, 234, 0.25)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.boxShadow = '0 16px 40px rgba(102, 126, 234, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.25)';
          }}
          >
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
              📞 CALLS MADE
            </div>
            <input
              type="number"
              value={formData.calls_made}
              onChange={(e) => setFormData({ ...formData, calls_made: e.target.value })}
              min="0"
              required
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '2px solid rgba(255,255,255,0.25)',
                color: 'white',
                fontSize: '56px',
                fontWeight: '900',
                padding: '24px 16px',
                borderRadius: '14px',
                width: '100%',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              placeholder="0"
            />
          </div>

          {/* Meetings Done Card */}
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
            padding: '32px 24px',
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(245, 158, 11, 0.25)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.boxShadow = '0 16px 40px rgba(245, 158, 11, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(245, 158, 11, 0.25)';
          }}
          >
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🤝 MEETINGS DONE
            </div>
            <input
              type="number"
              value={formData.meetings_done}
              onChange={(e) => setFormData({ ...formData, meetings_done: e.target.value })}
              min="0"
              required
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '2px solid rgba(255,255,255,0.25)',
                color: 'white',
                fontSize: '56px',
                fontWeight: '900',
                padding: '24px 16px',
                borderRadius: '14px',
                width: '100%',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              placeholder="0"
            />
          </div>

          {/* Orders Closed Card */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '32px 24px',
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(16, 185, 129, 0.25)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.boxShadow = '0 16px 40px rgba(16, 185, 129, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.25)';
          }}
          >
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ✅ ORDERS CLOSED
            </div>
            <input
              type="number"
              value={formData.orders_closed}
              onChange={(e) => setFormData({ ...formData, orders_closed: e.target.value })}
              min="0"
              required
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '2px solid rgba(255,255,255,0.25)',
                color: 'white',
                fontSize: '56px',
                fontWeight: '900',
                padding: '24px 16px',
                borderRadius: '14px',
                width: '100%',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              placeholder="0"
            />
          </div>
        </div>

        {/* Text Fields with Voice Input */}
        <div className="form-card" style={{ padding: '40px', width: '100%', maxWidth: '100%', background: 'white', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <div className="form-group" style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
                🎯 Today's Achievements
              </label>
              <button
                type="button"
                onClick={() => toggleVoiceInput('achievements')}
                style={{
                  background: isRecording && recordingField === 'achievements' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
                  transition: 'all 0.3s ease'
                }}
              >
                {isRecording && recordingField === 'achievements' ? '⏹ Stop' : '🎤 Voice'}
              </button>
            </div>
            <textarea
              className="form-control"
              rows="8"
              value={formData.achievements}
              onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
              placeholder="What went well today? Any major wins or milestones..."
              style={{
                fontSize: '16px',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid #E5E7EB',
                resize: 'vertical',
                lineHeight: '1.8',
                width: '100%',
                minHeight: '200px',
                fontFamily: 'inherit',
                transition: 'all 0.3s ease'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
                ⚠️ Challenges Faced
              </label>
              <button
                type="button"
                onClick={() => toggleVoiceInput('challenges')}
                style={{
                  background: isRecording && recordingField === 'challenges' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
                  transition: 'all 0.3s ease'
                }}
              >
                {isRecording && recordingField === 'challenges' ? '⏹ Stop' : '🎤 Voice'}
              </button>
            </div>
            <textarea
              className="form-control"
              rows="8"
              value={formData.challenges}
              onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
              placeholder="Any difficulties, obstacles, or issues you faced..."
              style={{
                fontSize: '16px',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid #E5E7EB',
                resize: 'vertical',
                lineHeight: '1.8',
                width: '100%',
                minHeight: '200px',
                fontFamily: 'inherit',
                transition: 'all 0.3s ease'
              }}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
                📅 Tomorrow's Plan
              </label>
              <button
                type="button"
                onClick={() => toggleVoiceInput('tomorrow_plan')}
                style={{
                  background: isRecording && recordingField === 'tomorrow_plan' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
                  transition: 'all 0.3s ease'
                }}
              >
                {isRecording && recordingField === 'tomorrow_plan' ? '⏹ Stop' : '🎤 Voice'}
              </button>
            </div>
            <textarea
              className="form-control"
              rows="8"
              value={formData.tomorrow_plan}
              onChange={(e) => setFormData({ ...formData, tomorrow_plan: e.target.value })}
              placeholder="What will you focus on tomorrow? Key priorities..."
              style={{
                fontSize: '16px',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid #E5E7EB',
                resize: 'vertical',
                lineHeight: '1.8',
                width: '100%',
                minHeight: '200px',
                fontFamily: 'inherit',
                transition: 'all 0.3s ease'
              }}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
            <button 
              type="submit" 
              disabled={submitting}
              style={{
                background: '#1F2937',
                color: 'white',
                border: 'none',
                padding: '18px 60px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                opacity: submitting ? 0.6 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="spinner-small"></span>
                  Submitting...
                </span>
              ) : (
                '✓ Submit Daily Report'
              )}
            </button>
          </div>

          <div style={{ 
            marginTop: '28px', 
            padding: '18px', 
            background: '#F9FAFB', 
            borderRadius: '12px',
            border: '2px solid #E5E7EB',
            textAlign: 'center',
            fontSize: '15px',
            color: '#374151'
          }}>
            ⚠️ <strong>Important:</strong> You can only submit one daily report per day. Make sure all information is accurate before submitting.
          </div>
        </div>
      </form>
    </div>
  );
}

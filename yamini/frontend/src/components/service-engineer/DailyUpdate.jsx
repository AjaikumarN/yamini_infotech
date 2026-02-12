import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

const DailyUpdate = () => {
  const navigate = useNavigate();
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attendanceRequired, setAttendanceRequired] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    summary: '',
    jobs_completed: '',
    jobs_pending: '',
    issues_faced: '',
    notes: ''
  });

  // Voice input
  const [isRecording, setIsRecording] = useState(false);
  const [recordingField, setRecordingField] = useState(null);
  const recognitionRef = useRef(null);
  const recordingFieldRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'ta-IN'; // Tamil by default

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
        
        // Show user-friendly error message
        let errorMsg = 'Voice input failed. ';
        if (event.error === 'no-speech') {
          errorMsg += 'No speech detected. Please try again.';
        } else if (event.error === 'language-not-supported') {
          errorMsg += 'Language not supported. Switching to English.';
          recognitionInstance.lang = 'en-US';
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

    checkTodaySubmission();
  }, []);

  const checkTodaySubmission = async () => {
    try {
      const data = await apiRequest('/api/service-engineer/daily-report/status');
      setHasSubmittedToday(data.submitted_today || false);
      setAttendanceRequired(false);
    } catch (error) {
      console.error('Failed to check submission status:', error);
      // If error is about attendance, show attendance prompt
      if (error.message?.includes('attendance')) {
        setAttendanceRequired(true);
        setHasSubmittedToday(false);
      }
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.summary.trim()) {
      alert('⚠️ Please provide a work summary');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        jobs_completed: parseInt(formData.jobs_completed) || 0,
        jobs_pending: parseInt(formData.jobs_pending) || 0
      };
      
      await apiRequest('/api/service-engineer/daily-report', {
        method: 'POST',
        body: JSON.stringify(submitData)
      });

      alert('✅ Daily update submitted successfully!');
      setHasSubmittedToday(true);
      setFormData({
        summary: '',
        jobs_completed: '',
        jobs_pending: '',
        issues_faced: '',
        notes: ''
      });
    } catch (error) {
      alert('❌ Failed to submit daily update: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="daily-update-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (hasSubmittedToday) {
    return (
      <div className="daily-update-container">
        <div className="submission-confirmed">
          <div className="confirmed-icon">✅</div>
          <h1>Daily Update Submitted</h1>
          <p>You have already submitted your daily update for today</p>
          
          <div className="submission-info">
            <p>Thank you for keeping your daily records up to date!</p>
            <p>You can submit your next update tomorrow.</p>
          </div>

          <div className="info-box">
            💡 <strong>Tip:</strong> Daily updates help track your progress and improve service quality.
          </div>
        </div>

        <style>{`
          .daily-update-container {
            max-width: 600px;
            margin: 40px auto;
            padding: 24px;
          }

          .submission-confirmed {
            background: white;
            padding: 48px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            text-align: center;
          }

          .confirmed-icon {
            font-size: 80px;
            margin-bottom: 24px;
            animation: checkmark 0.5s ease-in-out;
          }

          @keyframes checkmark {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }

          .submission-confirmed h1 {
            margin: 0 0 12px 0;
            color: #1f2937;
          }

          .submission-confirmed > p {
            color: #6b7280;
            margin-bottom: 24px;
          }

          .submission-info {
            background: #f0fdf4;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            border: 1px solid #bbf7d0;
          }

          .submission-info p {
            margin: 8px 0;
            color: #166534;
          }

          .info-box {
            background: #eff6ff;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            color: #1e40af;
            font-size: 14px;
            text-align: left;
          }
        `}</style>
      </div>
    );
  }

  // Show attendance prompt if attendance not marked
  if (attendanceRequired) {
    return (
      <div className="daily-update-container">
        <div className="daily-update-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>⚠️</div>
          <h1 style={{ marginBottom: '16px', color: '#1f2937' }}>Attendance Required</h1>
          <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '16px' }}>
            You need to mark your attendance before submitting daily updates.
          </p>
          <button
            onClick={() => navigate('/service-engineer/attendance')}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            Mark Attendance Now
          </button>
        </div>

        <style>{`
          .daily-update-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 24px;
          }
          .daily-update-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="daily-update-container">
      <div className="daily-update-card">
        <div className="card-header">
          <h1>📝 Daily Update</h1>
          <p>Submit your end-of-day service report</p>
        </div>

        <form onSubmit={handleSubmit} className="update-form">
          <div className="form-group">
            <label>
              Work Summary *
              <span className="label-hint">Describe your activities today</span>
            </label>
            <div className="textarea-with-voice">
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Example: Completed 3 printer repairs, visited 2 client sites..."
                rows={4}
                required
              />
              <button
                type="button"
                className={`btn-voice ${isRecording && recordingField === 'summary' ? 'recording' : ''}`}
                onClick={() => toggleVoiceInput('summary')}
                title="Voice input (Tamil/English)"
              >
                {isRecording && recordingField === 'summary' ? '⏹ Stop' : '🎤 Voice'}
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Jobs Completed Today</label>
              <input
                type="number"
                min="0"
                value={formData.jobs_completed}
                onChange={(e) => setFormData({ ...formData, jobs_completed: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Jobs Pending</label>
              <input
                type="number"
                min="0"
                value={formData.jobs_pending}
                onChange={(e) => setFormData({ ...formData, jobs_pending: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              Issues Faced (Optional)
              <span className="label-hint">Any challenges or problems encountered</span>
            </label>
            <div className="textarea-with-voice">
              <textarea
                value={formData.issues_faced}
                onChange={(e) => setFormData({ ...formData, issues_faced: e.target.value })}
                placeholder="Example: Parts unavailable, customer not available..."
                rows={3}
              />
              <button
                type="button"
                className={`btn-voice ${isRecording && recordingField === 'issues_faced' ? 'recording' : ''}`}
                onClick={() => toggleVoiceInput('issues_faced')}
                title="Voice input (Tamil/English)"
              >
                {isRecording && recordingField === 'issues_faced' ? '⏹ Stop' : '🎤 Voice'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>
              Additional Notes (Optional)
              <span className="label-hint">Any other information</span>
            </label>
            <div className="textarea-with-voice">
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional observations or recommendations..."
                rows={3}
              />
              <button
                type="button"
                className={`btn-voice ${isRecording && recordingField === 'notes' ? 'recording' : ''}`}
                onClick={() => toggleVoiceInput('notes')}
                title="Voice input (Tamil/English)"
              >
                {isRecording && recordingField === 'notes' ? '⏹ Stop' : '🎤 Voice'}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting || !formData.summary.trim()}
            >
              {submitting ? (
                <>
                  <span className="spinner-small"></span>
                  Submitting...
                </>
              ) : (
                '✅ Submit Daily Update'
              )}
            </button>
          </div>

          <div className="form-info">
            ⚠️ <strong>Important:</strong> You can only submit one daily update per day. Make sure all information is accurate before submitting.
          </div>
        </form>
      </div>

      <style>{`
        .daily-update-container {
          max-width: 800px;
          margin: 40px auto;
          padding: 24px;
        }

        .daily-update-loading {
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

        .daily-update-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 32px;
          text-align: center;
        }

        .card-header h1 {
          margin: 0 0 8px 0;
        }

        .card-header p {
          margin: 0;
          opacity: 0.9;
        }

        .update-form {
          padding: 32px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-weight: 600;
          color: #1f2937;
        }

        .label-hint {
          font-size: 12px;
          font-weight: 400;
          color: #6b7280;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
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

        .form-actions {
          margin-top: 32px;
        }

        .btn-submit {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
        }

        .btn-submit:disabled {
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

        .form-info {
          margin-top: 20px;
          padding: 16px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 8px;
          color: #92400e;
          font-size: 14px;
        }

        .form-info strong {
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .daily-update-card {
            margin: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyUpdate;

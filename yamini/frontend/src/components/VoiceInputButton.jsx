import React, { useState, useEffect } from 'react';
import { ContextAwareVoiceInput } from '../utils/voiceInput';

/**
 * Reusable Voice Input Button Component
 * Displays 🎙️ button with status feedback
 * Integrates Tamil + English voice recognition with context awareness
 * 
 * Props:
 * - onTranscript: Callback function to receive recognized text
 * - fieldContext: Type of field (customer_name, product_name, phone, remarks, etc.)
 * - className: Additional CSS classes
 */
const VoiceInputButton = ({ onTranscript, fieldContext = 'general', className = '' }) => {
  const [status, setStatus] = useState('idle'); // idle, listening, success, error
  const [statusMessage, setStatusMessage] = useState(null);
  const [voiceInput, setVoiceInput] = useState(null);

  useEffect(() => {
    const voice = new ContextAwareVoiceInput(
      (transcript) => {
        onTranscript(transcript);
      },
      (error) => {
        console.error('Voice error:', error);
      },
      (newStatus, message) => {
        setStatus(newStatus);
        setStatusMessage(message);
      },
      fieldContext
    );
    
    setVoiceInput(voice);
    
    return () => {
      if (voice) {
        voice.stop();
      }
    };
  }, [onTranscript, fieldContext]);

  const handleClick = () => {
    if (voiceInput) {
      voiceInput.start();
    }
  };

  if (!voiceInput || !voiceInput.isSupported()) {
    return null; // Hide button if not supported
  }

  return (
    <div className={`voice-input-container ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`voice-input-btn ${status}`}
        disabled={status === 'listening'}
        title="Speak notes (Tamil/English)"
      >
        {status === 'listening' ? '🎙️' : '🎙️'}
        <span className="voice-label">
          {status === 'idle' && 'Speak Notes'}
          {status === 'listening' && 'Listening…'}
          {status === 'success' && 'Done ✓'}
          {status === 'error' && 'Try Again'}
        </span>
      </button>
      {statusMessage && (
        <span className={`voice-status ${status}`}>
          {statusMessage}
        </span>
      )}
      
      <style>{`
        .voice-input-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .voice-input-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .voice-input-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .voice-input-btn.listening {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          animation: pulse 1.5s infinite;
        }

        .voice-input-btn.success {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .voice-input-btn.error {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .voice-input-btn:disabled {
          cursor: not-allowed;
          opacity: 0.8;
        }

        .voice-label {
          font-size: 13px;
        }

        .voice-status {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          animation: fadeIn 0.3s;
        }

        .voice-status.listening {
          background: #fff3cd;
          color: #856404;
        }

        .voice-status.success {
          background: #d4edda;
          color: #155724;
        }

        .voice-status.error {
          background: #f8d7da;
          color: #721c24;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VoiceInputButton;

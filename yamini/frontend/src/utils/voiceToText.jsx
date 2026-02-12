/**
 * Voice-to-Text Utility Module
 * Provides voice recording and transcription capabilities
 * Supports Tamil and English auto-detection
 */

import React, { useState, useEffect, useRef } from 'react';

// Check browser support
export const checkVoiceSupport = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  return !!SpeechRecognition;
};

// Voice-to-Text Hook
export const useVoiceToText = (options = {}) => {
  const {
    language = 'en-IN', // Default to English (India), supports Tamil
    continuous = false,
    interimResults = true,
    onResult = null,
    onError = null
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          if (onResult) onResult(transcript + finalTranscript);
        }
        setInterimTranscript(interimText);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(event.error);
        setIsListening(false);
        if (onError) onError(event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, interimResults, onResult, onError]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
};

// Voice Input Component
export const VoiceInput = ({ 
  value, 
  onChange, 
  placeholder = "Click mic to speak...",
  language = 'en-IN',
  className = '',
  disabled = false
}) => {
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening
  } = useVoiceToText({
    language,
    onResult: (text) => {
      onChange(value + text);
    }
  });

  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    if (transcript) {
      const newValue = localValue + transcript;
      setLocalValue(newValue);
      onChange(newValue);
    }
  }, [transcript]);

  const handleTextChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="voice-input-wrapper">
        <textarea
          value={localValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
        />
        <div className="voice-not-supported">
          ⚠️ Voice input not supported in this browser
        </div>
      </div>
    );
  }

  return (
    <div className="voice-input-wrapper">
      <div className="voice-input-container">
        <textarea
          value={localValue + (isListening ? ` ${interimTranscript}` : '')}
          onChange={handleTextChange}
          placeholder={placeholder}
          className={`voice-textarea ${className} ${isListening ? 'listening' : ''}`}
          disabled={disabled}
          rows={4}
        />
        <button
          type="button"
          onClick={toggleListening}
          className={`voice-button ${isListening ? 'listening' : ''}`}
          disabled={disabled}
          title={isListening ? "Stop recording" : "Start voice input"}
        >
          {isListening ? '🎤' : '🎙️'}
        </button>
      </div>
      {isListening && (
        <div className="voice-status">
          <span className="pulse-dot"></span>
          Recording... Speak in Tamil or English
        </div>
      )}
      {error && (
        <div className="voice-error">
          ⚠️ {error}
        </div>
      )}
      
      <style jsx>{`
        .voice-input-wrapper {
          position: relative;
          width: 100%;
        }

        .voice-input-container {
          position: relative;
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .voice-textarea {
          flex: 1;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          transition: all 0.3s;
        }

        .voice-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .voice-textarea.listening {
          border-color: #ef4444;
          background: #fef2f2;
          animation: pulse-border 1.5s infinite;
        }

        .voice-button {
          padding: 12px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.3s;
          min-width: 56px;
          height: 56px;
        }

        .voice-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .voice-button.listening {
          background: #ef4444;
          animation: pulse-mic 1s infinite;
        }

        .voice-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .voice-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fee2e2;
          border-radius: 6px;
          color: #dc2626;
          font-size: 13px;
          font-weight: 500;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse-dot 1s infinite;
        }

        .voice-error {
          margin-top: 8px;
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 13px;
        }

        .voice-not-supported {
          margin-top: 8px;
          padding: 8px 12px;
          background: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 6px;
          color: #d97706;
          font-size: 13px;
        }

        @keyframes pulse-border {
          0%, 100% {
            border-color: #ef4444;
          }
          50% {
            border-color: #f87171;
          }
        }

        @keyframes pulse-mic {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  );
};

// Language selector component
export const LanguageSelector = ({ value, onChange }) => {
  const languages = [
    { code: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
    { code: 'ta-IN', label: 'Tamil', flag: '🇮🇳' },
    { code: 'hi-IN', label: 'Hindi', flag: '🇮🇳' }
  ];

  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="language-selector"
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.label}
        </option>
      ))}
    </select>
  );
};

export default VoiceInput;

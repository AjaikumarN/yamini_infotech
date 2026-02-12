import React from 'react';

/**
 * ErrorState - Display error messages with retry option
 * 
 * @example
 * <ErrorState message="Failed to load data" />
 * <ErrorState message="Network error" onRetry={() => refetch()} />
 */
export default function ErrorState({ 
  message = 'Something went wrong',
  details = '',
  onRetry = null,
  className = ''
}) {
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    margin: '16px',
    background: '#FEE2E2',
    border: '1px solid #DC2626',
    borderRadius: '8px',
    color: '#DC2626'
  };
  
  const iconStyles = {
    fontSize: '32px',
    marginBottom: '12px'
  };
  
  const messageStyles = {
    fontSize: '14px',
    fontWeight: 500,
    textAlign: 'center',
    marginBottom: details ? '8px' : '0'
  };
  
  const detailsStyles = {
    fontSize: '12px',
    color: '#991B1B',
    textAlign: 'center',
    opacity: 0.8
  };
  
  const buttonStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '16px',
    padding: '8px 16px',
    background: 'transparent',
    color: '#DC2626',
    border: '1px solid #DC2626',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  };
  
  return (
    <div style={containerStyles} className={`erp-error-state ${className}`}>
      <div style={iconStyles}>⚠️</div>
      <div style={messageStyles}>{message}</div>
      {details && <div style={detailsStyles}>{details}</div>}
      {onRetry && (
        <button 
          onClick={onRetry} 
          style={buttonStyles}
          onMouseOver={e => {
            e.target.style.background = '#DC2626';
            e.target.style.color = 'white';
          }}
          onMouseOut={e => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#DC2626';
          }}
        >
          <span>↻</span>
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}

/**
 * Inline error for form fields
 */
export function InlineError({ message }) {
  if (!message) return null;
  
  return (
    <span style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '4px',
      fontSize: '12px',
      color: '#DC2626'
    }}>
      <span>⚠</span>
      {message}
    </span>
  );
}

/**
 * Toast-style error notification
 */
export function ErrorToast({ message, onDismiss }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 18px',
      background: '#DC2626',
      color: 'white',
      borderRadius: '10px',
      boxShadow: '0 10px 25px rgba(220, 38, 38, 0.3)',
      zIndex: 9999,
      animation: 'slideInRight 0.3s ease'
    }}>
      <span>⚠️</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            opacity: 0.8
          }}
        >
          ✕
        </button>
      )}
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

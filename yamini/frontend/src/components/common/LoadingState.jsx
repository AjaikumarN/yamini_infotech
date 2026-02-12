import React from 'react';

/**
 * LoadingState - Consistent loading indicator
 * 
 * @example
 * <LoadingState />
 * <LoadingState message="Loading data..." />
 * <LoadingState size="small" />
 */
export default function LoadingState({ 
  message = '', 
  size = 'default',
  fullScreen = false,
  className = '' 
}) {
  const sizeMap = {
    small: { spinner: 24, stroke: 2 },
    default: { spinner: 32, stroke: 3 },
    large: { spinner: 48, stroke: 4 }
  };
  
  const { spinner, stroke } = sizeMap[size];
  
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: fullScreen ? '0' : '32px',
    minHeight: fullScreen ? '100vh' : 'auto',
    width: '100%',
    ...(fullScreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255, 255, 255, 0.9)',
      zIndex: 9999
    })
  };
  
  const spinnerStyles = {
    width: spinner,
    height: spinner,
    border: `${stroke}px solid #E5E7EB`,
    borderTopColor: '#0891B2',
    borderRadius: '50%',
    animation: 'erp-spin 0.8s linear infinite'
  };
  
  const messageStyles = {
    marginTop: '16px',
    fontSize: '13px',
    color: '#6B7280'
  };
  
  return (
    <>
      <style>
        {`
          @keyframes erp-spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={containerStyles} className={`erp-loading ${className}`}>
        <div style={spinnerStyles} />
        {message && <span style={messageStyles}>{message}</span>}
      </div>
    </>
  );
}

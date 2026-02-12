import React from 'react';

/**
 * EmptyState - Display when no data is available
 * 
 * @example
 * <EmptyState title="No Results" message="Try adjusting your filters" />
 * <EmptyState 
 *   icon="📭" 
 *   title="No Messages" 
 *   message="Your inbox is empty"
 *   action={<button>Compose</button>}
 * />
 */
export default function EmptyState({ 
  icon = '📋',
  title = 'No Data',
  message = '',
  action = null,
  className = ''
}) {
  const containerStyles = {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#6B7280'
  };
  
  const iconStyles = {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5
  };
  
  const titleStyles = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '8px'
  };
  
  const messageStyles = {
    fontSize: '14px',
    color: '#6B7280',
    maxWidth: '300px',
    margin: '0 auto',
    lineHeight: 1.5
  };
  
  const actionStyles = {
    marginTop: '24px'
  };
  
  return (
    <div style={containerStyles} className={`erp-empty-state ${className}`}>
      <div style={iconStyles}>{icon}</div>
      <div style={titleStyles}>{title}</div>
      {message && <div style={messageStyles}>{message}</div>}
      {action && <div style={actionStyles}>{action}</div>}
    </div>
  );
}

/**
 * Pre-defined empty states for common scenarios
 */
export const NoSearchResults = ({ query }) => (
  <EmptyState
    icon="🔍"
    title="No Results Found"
    message={query ? `No results for "${query}"` : 'Try adjusting your search or filters'}
  />
);

export const NoDataYet = ({ itemName = 'items' }) => (
  <EmptyState
    icon="📭"
    title={`No ${itemName} Yet`}
    message={`When ${itemName} are added, they will appear here`}
  />
);

export const NetworkError = ({ onRetry }) => (
  <EmptyState
    icon="📡"
    title="Connection Error"
    message="Unable to connect to the server. Please check your connection."
    action={onRetry && (
      <button 
        onClick={onRetry}
        style={{
          padding: '10px 20px',
          background: '#0891B2',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        Try Again
      </button>
    )}
  />
);

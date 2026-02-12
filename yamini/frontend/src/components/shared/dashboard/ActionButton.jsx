import React from 'react';

/**
 * Action Button Component - Able Pro Style
 * Primary and secondary action buttons
 */
export default function ActionButton({ 
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  onClick,
  disabled = false,
  fullWidth = false,
  loading = false
}) {
  const variants = {
    primary: {
      background: '#6366f1',
      color: '#ffffff',
      border: 'none',
      hover: '#4f46e5'
    },
    secondary: {
      background: '#ffffff',
      color: '#374151',
      border: '1px solid #d1d5db',
      hover: '#f9fafb'
    },
    success: {
      background: '#10b981',
      color: '#ffffff',
      border: 'none',
      hover: '#059669'
    },
    danger: {
      background: '#ef4444',
      color: '#ffffff',
      border: 'none',
      hover: '#dc2626'
    },
    ghost: {
      background: 'transparent',
      color: '#6366f1',
      border: 'none',
      hover: '#f5f5ff'
    }
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '13px' },
    md: { padding: '10px 16px', fontSize: '14px' },
    lg: { padding: '12px 20px', fontSize: '15px' }
  };

  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...styles.button,
        ...sizeStyle,
        background: variantStyle.background,
        color: variantStyle.color,
        border: variantStyle.border,
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      onMouseOver={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = variantStyle.hover;
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = variantStyle.background;
        }
      }}
    >
      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <span>Loading...</span>
        </div>
      ) : (
        <div style={styles.content}>
          {icon && iconPosition === 'left' && (
            <span className="material-icons" style={styles.icon}>{icon}</span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="material-icons" style={styles.icon}>{icon}</span>
          )}
        </div>
      )}
    </button>
  );
}

const styles = {
  button: {
    borderRadius: '8px',
    fontWeight: '600',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
    outline: 'none',
    ':focus': {
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
    }
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  icon: {
    fontSize: '18px'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid currentColor',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite'
  }
};

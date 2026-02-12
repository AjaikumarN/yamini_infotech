import React from 'react';

/**
 * AdminModeBanner - Shows when admin is viewing staff pages
 * Shows different messages based on whether admin has edit access
 */
export default function AdminModeBanner({ staffType = 'Staff', onExit, editable = false }) {
  return (
    <div style={{
      background: editable 
        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
        : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      color: 'white',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: editable 
        ? '0 2px 8px rgba(16, 185, 129, 0.2)' 
        : '0 2px 8px rgba(59, 130, 246, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>{editable ? '✏️' : '👁️'}</span>
        <div>
          <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '2px' }}>
            {editable ? `Managing ${staffType} (Admin Mode)` : 'Viewing as Admin (Read-Only Mode)'}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {editable 
              ? `You can create, edit, and manage ${staffType.toLowerCase()}` 
              : `You can view ${staffType} data but cannot perform ${staffType.toLowerCase()} actions`}
          </div>
        </div>
      </div>
      {onExit && (
        <button
          onClick={onExit}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '6px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          Exit View
        </button>
      )}
    </div>
  );
}

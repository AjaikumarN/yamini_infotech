import React from 'react';

/**
 * ReadOnlyBanner - Indicates admin is viewing staff page in read-only mode
 */
export default function ReadOnlyBanner({ staffName, role }) {
  return (
    <div className="read-only-banner">
      <span className="icon">👁</span>
      <div>
        <div style={{ fontSize: '16px', fontWeight: '700' }}>
          Viewing as Admin (Read-Only)
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {staffName ? `Viewing ${staffName}'s ${role} Dashboard` : 'All actions are disabled in admin view'}
        </div>
      </div>
    </div>
  );
}

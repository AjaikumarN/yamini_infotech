import React from 'react';
import '../styles/salesman.css';

/**
 * StatCard - Reusable stat display card
 * @param {string} icon - Emoji icon
 * @param {string} label - Stat label
 * @param {string|number} value - Stat value
 * @param {string} iconBg - Background color for icon (default: #DBEAFE)
 * @param {string} subtext - Optional subtext below value
 */
export default function StatCard({ icon, label, value, iconBg = '#DBEAFE', subtext }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {subtext && (
          <div style={{ 
            fontSize: '12px', 
            color: '#6B7280', 
            marginTop: '4px' 
          }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

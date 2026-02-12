import React from 'react';
import '../styles/salesman.css';

/**
 * EmptyState - Empty state UI with icon and message
 * @param {string} icon - Emoji icon
 * @param {string} message - Empty state message
 */
export default function EmptyState({ icon = '📭', message = 'No data available' }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-message">{message}</div>
    </div>
  );
}

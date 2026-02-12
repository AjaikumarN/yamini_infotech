import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/salesman.css';

/**
 * AttendanceCard - Optional attendance reminder (NO blocking)
 * Shows yellow banner if not marked, green if marked
 * @param {boolean} marked - Whether attendance is marked today
 */
export default function AttendanceCard({ marked }) {
  if (marked) {
    return (
      <div className="attendance-banner marked">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div>
            <div style={{ fontWeight: 500 }}>Attendance Marked</div>
            <div style={{ fontSize: '14px', color: '#059669' }}>Thank you for marking your attendance today!</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-banner not-marked">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>⏰</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>Attendance Not Marked</div>
          <div style={{ fontSize: '14px', color: '#92400E' }}>
            You can mark your attendance for better tracking (optional).
          </div>
        </div>
        <Link to="/salesman/attendance" className="btn btn-primary btn-sm">
          Mark Now
        </Link>
      </div>
    </div>
  );
}

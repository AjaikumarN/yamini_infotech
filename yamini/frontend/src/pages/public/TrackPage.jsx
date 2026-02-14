import React, { useState } from 'react';
import { apiRequest } from '../../utils/api';

const STATUSES = ['NEW', 'ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'];

function getStatusBadgeClass(status) {
  if (status === 'COMPLETED') return 'completed';
  if (['IN_PROGRESS', 'ON_THE_WAY', 'ASSIGNED'].includes(status)) return 'in-progress';
  return 'new';
}

export default function TrackPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await apiRequest(`/api/service-requests/track/${encodeURIComponent(input.trim())}`);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Service not found. Please check your ticket ID or phone number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--sp-section) var(--page-mx)' }}>

      {/* ── Search Banner ── */}
      <div className="pub-track-banner">
        <div className="track-title">
          <h1>Track Your Service</h1>
          <p>Enter your ticket number or phone number to check current status</p>
        </div>

        <form onSubmit={handleTrack}>
          <div className="pub-track-searchbar">
            <span className="track-icon">🔍</span>
            <input
              type="text"
              placeholder="Ticket ID or phone number..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="track-btn" disabled={loading}>
              {loading ? <span className="track-spinner" /> : <>📡 <span className="btn-label">Track</span></>}
            </button>
          </div>
        </form>

        {error && (
          <div className="pub-track-error">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="pub-track-result">
            <div className="ticket-header">
              <span className="ticket-no">🎫 {result.ticket_no}</span>
              <span className={`status-badge ${getStatusBadgeClass(result.status)}`}>
                {result.status === 'COMPLETED' ? '✓ ' : '● '}{result.status?.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="ticket-meta">
              {result.customer_name && (
                <div><span>Name: </span><strong>{result.customer_name}</strong></div>
              )}
              {result.machine_model && (
                <div><span>Machine: </span><strong>{result.machine_model}</strong></div>
              )}
              {result.service_type && (
                <div><span>Type: </span><strong>{result.service_type}</strong></div>
              )}
              {result.engineer_name && (
                <div><span>Engineer: </span><strong>{result.engineer_name}</strong></div>
              )}
            </div>

            {/* Timeline */}
            <div style={{ marginTop: 'var(--sp-xl)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: 'var(--sp-md)' }}>
                Status Timeline
              </h4>
              <div className="pub-timeline">
                {STATUSES.map((s, i) => {
                  const currentIdx = STATUSES.indexOf(result.status);
                  const done = i < currentIdx;
                  const current = i === currentIdx;
                  return (
                    <div key={s} className="pub-timeline-step">
                      <div className={`pub-timeline-dot ${done ? 'active' : ''} ${current ? 'current' : ''}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <div className="pub-timeline-content">
                        <h4>{s.replace(/_/g, ' ')}</h4>
                        {current && <p>Current status</p>}
                        {done && <p>Completed</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <div style={{ marginTop: 'var(--sp-xl)', display: 'flex', gap: 'var(--sp-md)' }}>
              <a href="tel:+919842122952" className="btn btn-secondary" style={{ flex: 1 }}>
                📞 Call Support
              </a>
              <a
                href={`https://wa.me/919842122952?text=Hi%2C%20I%20need%20an%20update%20on%20ticket%20${result.ticket_no}`}
                target="_blank" rel="noopener noreferrer"
                className="btn btn-whatsapp" style={{ flex: 1 }}
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

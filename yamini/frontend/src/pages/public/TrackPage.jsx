import React, { useState } from 'react';
import { apiRequest } from '../../utils/api';

const STATUSES = ['NEW', 'ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'];

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
    <div className="container" style={{ padding: 'var(--sp-section) var(--page-margin)' }}>
      <div className="pub-section-header reveal">
        <h1>Track Your Service</h1>
        <p>Enter your ticket number or phone number to check current status</p>
      </div>

      <div className="pub-track-widget" style={{ maxWidth: 600, margin: '0 auto' }}>
        <form className="track-form" onSubmit={handleTrack}>
          <input
            placeholder="Ticket ID or phone number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '...' : '🔍 Track'}
          </button>
        </form>

        {error && (
          <div style={{
            marginTop: 'var(--sp-xl)', textAlign: 'center', padding: 'var(--sp-xl)',
            background: '#FEF2F2', borderRadius: 'var(--radius-md)', color: 'var(--danger)'
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{error}</p>
          </div>
        )}

        {result && (
          <div style={{ marginTop: 'var(--sp-2xl)' }}>
            {/* Ticket Summary Card */}
            <div style={{
              background: 'var(--brand-light)', borderRadius: 'var(--radius-md)',
              padding: 'var(--sp-xl)', marginBottom: 'var(--sp-2xl)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p className="text-sm text-muted">Ticket Number</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand)' }}>{result.ticket_no}</p>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700,
                  background: result.status === 'COMPLETED' ? 'var(--success)' : 'var(--brand)',
                  color: 'white'
                }}>
                  {result.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                {result.customer_name && (
                  <div><span className="text-muted">Name: </span><strong>{result.customer_name}</strong></div>
                )}
                {result.machine_model && (
                  <div><span className="text-muted">Machine: </span><strong>{result.machine_model}</strong></div>
                )}
                {result.service_type && (
                  <div><span className="text-muted">Type: </span><strong>{result.service_type}</strong></div>
                )}
                {result.engineer_name && (
                  <div><span className="text-muted">Engineer: </span><strong>{result.engineer_name}</strong></div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <h3 style={{ marginBottom: 'var(--sp-lg)' }}>Status Timeline</h3>
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

            {/* CTA */}
            <div style={{ marginTop: 'var(--sp-2xl)', display: 'flex', gap: 'var(--sp-md)' }}>
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

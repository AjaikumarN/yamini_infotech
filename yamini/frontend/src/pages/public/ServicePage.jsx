import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDeviceProfile } from '../../hooks/useDeviceProfile';
import { apiRequest } from '../../utils/api';

const SERVICE_TYPES = [
  { id: 'repair', icon: '🔧', label: 'Repair', desc: 'Machine not working or error' },
  { id: 'toner', icon: '🖨️', label: 'Toner / Supplies', desc: 'Toner refill or cartridge' },
  { id: 'installation', icon: '📦', label: 'Installation', desc: 'New machine setup' },
  { id: 'amc_support', icon: '✅', label: 'AMC Support', desc: 'Annual maintenance service' },
  { id: 'exchange', icon: '🔄', label: 'Exchange / Upgrade', desc: 'Trade-in or upgrade machine' },
  { id: 'other', icon: '💬', label: 'Other', desc: 'General enquiry' },
];

const STEP_LABELS = ['Service Type', 'Your Details', 'Confirm'];
const STATUSES = ['NEW', 'ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'];

export default function ServicePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { type: deviceType } = useDeviceProfile();
  const initialType = params.get('type') || '';
  const [step, setStep] = useState(initialType ? 2 : 1);
  const [serviceType, setServiceType] = useState(initialType);
  const [form, setForm] = useState({
    customer_name: '', phone: '', email: '', address: '',
    machine_model: '', serial_number: '', description: '', priority: 'MEDIUM',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const handleSelect = (type) => {
    setServiceType(type);
    setStep(2);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.phone.trim()) {
      setError('Name and phone are required');
      return;
    }
    if (!form.description.trim()) {
      setError('Please describe your issue');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // Map frontend fields to backend ComplaintCreate schema
      const selectedService = SERVICE_TYPES.find(s => s.id === serviceType);
      const payload = {
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        email: form.email || null,
        address: form.address || null,
        machine_model: form.machine_model || null,
        fault_description: `[${selectedService?.label || serviceType}] ${form.description.trim()}${form.serial_number ? `\nSerial: ${form.serial_number}` : ''}`,
        priority: form.priority === 'LOW' ? 'NORMAL' : form.priority === 'HIGH' ? 'URGENT' : 'NORMAL',
      };
      const data = await apiRequest('/api/service-requests/public', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSuccess(data);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--sp-2xl) var(--page-mx)' }}>

      {/* ── STEPPER INDICATOR ── */}
      {!success && (
        <div className="pub-stepper reveal">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const done = step > stepNum;
            const current = step === stepNum;
            return (
              <React.Fragment key={label}>
                {i > 0 && <div className={`pub-stepper-line${done ? ' done' : ''}`} />}
                <div className={`pub-stepper-dot${done ? ' done' : ''}${current ? ' current' : ''}`}>
                  {done ? '✓' : stepNum}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Step 1: Choose Service Type */}
      {step === 1 && (
        <>
          <div className="pub-section-header reveal" style={{ textAlign: 'left' }}>
            <h1>What do you need?</h1>
            <p>Select the type of service you require</p>
          </div>
          <div className="pub-service-grid">
            {SERVICE_TYPES.map((s, idx) => (
              <div key={s.id} className="pub-service-card reveal-scale" style={{ '--i': idx }} onClick={() => handleSelect(s.id)}>
                <div className="icon">{s.icon}</div>
                <div className="label">{s.label}</div>
                <p className="text-sm text-muted" style={{ marginTop: 4 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Track Service (inline on services page) ── */}
          <div style={{ marginTop: 'var(--sp-section)' }}>
            <ServiceTrackWidget />
          </div>
        </>
      )}

      {/* Step 2: Service Form */}
      {step === 2 && !success && (
        <>
          <button
            onClick={() => { setStep(1); setServiceType(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, color: 'var(--brand)', marginBottom: 'var(--sp-xl)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Change Service Type
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--sp-2xl)' }}>
            <span style={{ fontSize: 36 }}>
              {SERVICE_TYPES.find(s => s.id === serviceType)?.icon || '🔧'}
            </span>
            <div>
              <h2>{SERVICE_TYPES.find(s => s.id === serviceType)?.label || 'Service Request'}</h2>
              <p className="text-sm text-muted">Fill in your details below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
            <div className="pub-form-group">
              <label>Your Name *</label>
              <input name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="Enter your name" required />
            </div>

            <div className="pub-form-group">
              <label>Phone Number *</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Enter your phone number" required />
            </div>

            <div className="pub-form-group">
              <label>Email (optional)</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Enter your email" />
            </div>

            <div className="pub-form-group">
              <label>Address / Location</label>
              <textarea name="address" value={form.address} onChange={handleChange} placeholder="Enter your address or location" rows={2} />
            </div>

            <div className="pub-form-group">
              <label>Machine Model</label>
              <input name="machine_model" value={form.machine_model} onChange={handleChange} placeholder="e.g., Kyocera 2040dn" />
            </div>

            <div className="pub-form-group">
              <label>Serial Number</label>
              <input name="serial_number" value={form.serial_number} onChange={handleChange} placeholder="Machine serial number (if known)" />
            </div>

            <div className="pub-form-group">
              <label>Issue Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe your issue or requirement" rows={3} required />
            </div>

            <div className="pub-form-group">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                <option value="LOW">Low — Not urgent</option>
                <option value="MEDIUM">Medium — Normal</option>
                <option value="HIGH">High — Urgent</option>
              </select>
            </div>

            {error && <p style={{ color: 'var(--danger)', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{error}</p>}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? 'Submitting...' : '📤 Submit Service Request'}
            </button>
          </form>
        </>
      )}

      {/* Step 3: Success */}
      {step === 3 && success && (
        <div style={{ textAlign: 'center', padding: 'var(--sp-section) 0' }}>
          <div style={{ fontSize: 64, marginBottom: 'var(--sp-lg)' }}>✅</div>
          <h2>Service Request Submitted!</h2>
          <p className="text-muted" style={{ margin: '8px auto 24px', maxWidth: 400 }}>
            Your request has been received. Our team will contact you shortly.
          </p>

          {success.ticket_no && (
            <div style={{
              background: 'var(--brand-light)', borderRadius: 'var(--radius-md)',
              padding: 'var(--sp-xl)', display: 'inline-block', marginBottom: 'var(--sp-2xl)'
            }}>
              <p className="text-sm text-muted">Your Ticket Number</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>{success.ticket_no}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
            <a
              href={`https://wa.me/919842122952?text=${encodeURIComponent(`Hi Yamini Infotech, I just submitted a service request.\nTicket: ${success.ticket_no}\nName: ${form.customer_name}\nIssue: ${form.description}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-block btn-lg"
            >
              💬 Confirm on WhatsApp
            </a>
            <button className="btn btn-primary btn-block" onClick={() => navigate('/track')}>
              📍 Track Service Status
            </button>
            <button className="btn btn-secondary btn-block" onClick={() => { setStep(1); setSuccess(null); setForm({ customer_name: '', phone: '', email: '', address: '', machine_model: '', serial_number: '', description: '', priority: 'MEDIUM' }); }}>
              ➕ Submit Another Request
            </button>
            <button className="btn btn-secondary btn-block" onClick={() => navigate('/')}>
              🏠 Go Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Service Track Widget (embedded in Services page) ── */
function ServiceTrackWidget() {
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
      setError(err.message || 'Service not found. Check your ticket ID or phone number.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'COMPLETED') return 'completed';
    if (['IN_PROGRESS', 'ON_THE_WAY', 'ASSIGNED'].includes(status)) return 'in-progress';
    return 'new';
  };

  return (
    <div className="pub-track-banner">
      <div className="track-title">
        <h2>Already submitted? Track here</h2>
        <p>Enter your ticket number or phone to check status</p>
      </div>

      <form onSubmit={handleTrack}>
        <div className="pub-track-searchbar">
          <span className="track-icon">🔍</span>
          <input
            type="text"
            placeholder="Ticket ID or phone number..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="track-btn" disabled={loading}>
            {loading ? <span className="track-spinner" /> : <>📡 <span className="btn-label">Track</span></>}
          </button>
        </div>
      </form>

      {error && <div className="pub-track-error">❌ {error}</div>}

      {result && (
        <div className="pub-track-result">
          <div className="ticket-header">
            <span className="ticket-no">🎫 {result.ticket_no}</span>
            <span className={`status-badge ${getStatusBadgeClass(result.status)}`}>
              {result.status === 'COMPLETED' ? '✓ ' : '● '}{result.status?.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="ticket-meta">
            {result.customer_name && <div><span>Name: </span><strong>{result.customer_name}</strong></div>}
            {result.machine_model && <div><span>Machine: </span><strong>{result.machine_model}</strong></div>}
            {result.service_type && <div><span>Type: </span><strong>{result.service_type}</strong></div>}
            {result.engineer_name && <div><span>Engineer: </span><strong>{result.engineer_name}</strong></div>}
          </div>

          <div style={{ marginTop: 'var(--sp-lg)' }}>
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

          <div style={{ marginTop: 'var(--sp-lg)', display: 'flex', gap: 'var(--sp-md)' }}>
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
  );
}

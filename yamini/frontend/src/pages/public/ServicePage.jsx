import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

const SERVICE_TYPES = [
  { id: 'repair', icon: '🔧', label: 'Repair', desc: 'Machine not working or error' },
  { id: 'toner', icon: '🖨️', label: 'Toner / Supplies', desc: 'Toner refill or cartridge' },
  { id: 'installation', icon: '📦', label: 'Installation', desc: 'New machine setup' },
  { id: 'amc_support', icon: '✅', label: 'AMC Support', desc: 'Annual maintenance service' },
  { id: 'exchange', icon: '🔄', label: 'Exchange / Upgrade', desc: 'Trade-in or upgrade machine' },
  { id: 'other', icon: '💬', label: 'Other', desc: 'General enquiry' },
];

export default function ServicePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
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
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        service_type: serviceType,
        source: 'WEBSITE',
        status: 'NEW',
      };
      const data = await apiRequest('/api/complaints/', {
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
    <div className="container" style={{ padding: 'var(--sp-2xl) var(--page-margin)' }}>
      {/* Step 1: Choose Service Type */}
      {step === 1 && (
        <>
          <div className="pub-section-header" style={{ textAlign: 'left' }}>
            <h1>What do you need?</h1>
            <p>Select the type of service you require</p>
          </div>
          <div className="pub-service-grid">
            {SERVICE_TYPES.map(s => (
              <div key={s.id} className="pub-service-card" onClick={() => handleSelect(s.id)}>
                <div className="icon">{s.icon}</div>
                <div className="label">{s.label}</div>
                <p className="text-sm text-muted" style={{ marginTop: 4 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Step 2: Service Form */}
      {step === 2 && (
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
              <label>Issue Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe your issue or requirement" rows={3} />
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

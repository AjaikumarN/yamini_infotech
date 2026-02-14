import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { getUploadUrl } from '../../config';

const TESTIMONIALS = [
  { name: 'Rajesh Kumar', company: 'ABC Enterprises', rating: 5, text: 'Excellent service! Quick response and genuine parts. Yamini Infotech is our go-to for all copier needs.' },
  { name: 'Priya Sharma', company: 'XYZ School', rating: 5, text: 'Very professional team. They installed our machines within hours and the AMC support is outstanding.' },
  { name: 'Suresh Menon', company: 'Legal Associates', rating: 4, text: 'Reliable service for over 5 years. Toner delivery is always fast and machines run smoothly.' },
  { name: 'Deepa Nair', company: 'City Print Shop', rating: 5, text: 'Best prices in town and genuine spares. The engineer was very knowledgeable and fixed our issue quickly.' },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest('/api/products');
        setProducts((data || []).slice(0, 6));
      } catch (e) {
        console.error('Error fetching products:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      {/* ── HERO ── */}
      <section className="pub-hero">
        <div className="pub-hero-text">
          <h1>Your Trusted Copier &amp; Printer Partner</h1>
          <p>Sales, Service, Toner &amp; AMC — 25+ years serving Tirunelveli, Tenkasi &amp; Nagercoil with fast, reliable support.</p>
          <div className="pub-hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/products')}>
              View Products
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/services')}>
              Book Service
            </button>
          </div>
        </div>
        <div className="pub-hero-image">
          <img
            src="/assets/images/hero-copier.webp"
            alt="Copier Machine"
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ maxHeight: 400, objectFit: 'contain' }}
          />
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className="container reveal">
        <div className="pub-trust">
          <div className="pub-trust-item"><span className="icon">✅</span> 25+ Years</div>
          <div className="pub-trust-item"><span className="icon">⚡</span> Fast Response</div>
          <div className="pub-trust-item"><span className="icon">🔧</span> Genuine Parts</div>
          <div className="pub-trust-item"><span className="icon">📍</span> Local Support</div>
        </div>
      </div>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="pub-section">
        <div className="container">
          <div className="pub-section-header reveal">
            <h2>Featured Products</h2>
            <p>Top-selling copiers and printers for your business</p>
          </div>

          {loading ? (
            <div className="pub-products-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="pub-product-card">
                  <div className="pub-product-card-img pub-skeleton" style={{ aspectRatio: 1 }} />
                  <div className="pub-product-card-body">
                    <div className="pub-skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
                    <div className="pub-skeleton" style={{ height: 16, width: '80%', marginBottom: 8 }} />
                    <div className="pub-skeleton" style={{ height: 20, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pub-products-grid">
              {products.map((p) => (
                <div key={p.id} className="pub-product-card" onClick={() => navigate(`/products/${p.id}`)}>
                  <div className="pub-product-card-img">
                    {p.image_url ? (
                      <img
                        src={getUploadUrl(p.image_url)}
                        alt={p.name}
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: 32 }}>🖨</span>
                    )}
                  </div>
                  <div className="pub-product-card-body">
                    <span className="tag">{p.category || 'Copier'}</span>
                    <div className="name">{p.name}</div>
                    <div className="price">₹{(p.price || 0).toLocaleString()}</div>
                    <div className="pub-product-card-actions">
                      <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}`); }}>View</button>
                      <a
                        className="btn btn-whatsapp"
                        href={`https://wa.me/919842122952?text=Hi%2C%20I%27m%20interested%20in%20${encodeURIComponent(p.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && products.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 'var(--sp-xl)' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/products')}>
                View All Products →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── SERVICE OPTIONS ── */}
      <section className="pub-section" style={{ background: 'var(--bg-section)' }}>
        <div className="container">
          <div className="pub-section-header reveal">
            <h2>What do you need?</h2>
            <p>Tap to request service directly</p>
          </div>
          <div className="pub-service-grid reveal stagger">
            {[
              { icon: '🔧', label: 'Repair', id: 'repair' },
              { icon: '🖨️', label: 'Toner', id: 'toner' },
              { icon: '📦', label: 'Install', id: 'installation' },
              { icon: '✅', label: 'AMC', id: 'amc_support' },
              { icon: '🔄', label: 'Exchange', id: 'exchange' },
            ].map((s) => (
              <div
                key={s.id}
                className="pub-service-card"
                onClick={() => navigate(`/services?type=${s.id}`)}
              >
                <div className="icon">{s.icon}</div>
                <div className="label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK TRACK ── */}
      <section className="pub-section">
        <div className="container">
          <div className="pub-section-header reveal">
            <h2>Track Your Service</h2>
            <p>Enter your ticket number or phone to check status</p>
          </div>
          <TrackWidget />
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="pub-section" style={{ background: 'var(--bg-section)' }}>
        <div className="container">
          <div className="pub-section-header reveal">
            <h2>What Our Customers Say</h2>
          </div>
          <div className="pub-testimonials-track">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="pub-testimonial-card">
                <div className="stars">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                <div className="quote">"{t.text}"</div>
                <div className="author">{t.name}</div>
                <div className="text-sm text-muted">{t.company}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STICKY BOTTOM CTA (Mobile) ── */}
      <div className="pub-sticky-cta">
        <a
          href="https://wa.me/919842122952?text=Hi%20Yamini%20Infotech%2C%20I%20need%20a%20price%20quote"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-whatsapp btn-block btn-lg"
        >
          💬 Get Price on WhatsApp
        </a>
      </div>
    </>
  );
}

/* ── Inline Track Widget ── */
function TrackWidget() {
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

  const STATUSES = ['NEW', 'ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'];

  return (
    <div className="pub-track-widget">
      <form className="track-form" onSubmit={handleTrack}>
        <input
          placeholder="Ticket ID or phone number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '...' : '🔍 Track'}
        </button>
      </form>

      {error && <p style={{ color: 'var(--danger)', marginTop: 12, textAlign: 'center', fontSize: 14 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 24 }}>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Ticket: {result.ticket_no}</p>
          <p className="text-muted text-sm" style={{ marginBottom: 16 }}>{result.customer_name} — {result.machine_model}</p>
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceProfile } from '../../hooks/useDeviceProfile';
import { apiRequest } from '../../utils/api';
import { getUploadUrl } from '../../config';
import SEO, { buildLocalBusinessJsonLd, buildWebSiteJsonLd, buildOrganizationJsonLd, buildAggregateRatingJsonLd, buildFAQJsonLd } from '../../components/SEO';

const TESTIMONIALS = [
  { name: 'Rajesh Kumar', company: 'ABC Enterprises', rating: 5, text: 'Excellent service! Quick response and genuine parts. Yamini Infotech is our go-to for all copier needs.' },
  { name: 'Priya Sharma', company: 'XYZ School', rating: 5, text: 'Very professional team. They installed our machines within hours and the AMC support is outstanding.' },
  { name: 'Suresh Menon', company: 'Legal Associates', rating: 4, text: 'Reliable service for over 5 years. Toner delivery is always fast and machines run smoothly.' },
  { name: 'Deepa Nair', company: 'City Print Shop', rating: 5, text: 'Best prices in town and genuine spares. The engineer was very knowledgeable and fixed our issue quickly.' },
];

const SERVICES = [
  { icon: '🔧', label: 'Repair', id: 'repair', desc: 'Machine not working' },
  { icon: '🖨️', label: 'Toner', id: 'toner', desc: 'Refill or cartridge' },
  { icon: '📦', label: 'Install', id: 'installation', desc: 'New machine setup' },
  { icon: '✅', label: 'AMC', id: 'amc_support', desc: 'Annual contract' },
  { icon: '🔄', label: 'Exchange', id: 'exchange', desc: 'Trade-in / upgrade' },
];

const HOME_FAQS = [
  { question: 'Where is Yamini Infotech located?', answer: 'Yamini Infotech has branches in Tirunelveli (South Bypass Road, Palayamkottai), Tenkasi (Main Road), and Nagercoil (Court Road). We serve all of South Tamil Nadu.' },
  { question: 'What brands does Yamini Infotech sell?', answer: 'We are authorized dealers for Kyocera and Konica Minolta. We also sell and service Canon, Ricoh, HP, Epson, Brother, and Sharp copiers and printers.' },
  { question: 'Does Yamini Infotech offer copier rental?', answer: 'Yes! We offer flexible copier and printer rental plans starting from ₹3,000/month. Ideal for offices, schools, and businesses in Tirunelveli, Tenkasi, and Nagercoil.' },
  { question: 'How can I contact Yamini Infotech?', answer: 'Call us at +91 98421 22952, WhatsApp us, or visit our branches. You can also book a service request directly on our website.' },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { type: deviceType } = useDeviceProfile();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest('/api/products');
        setProducts((data || []).slice(0, deviceType === 'mobile' ? 4 : 6));
      } catch (e) {
        console.error('Error fetching products:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [deviceType]);

  // Combine multiple JSON-LD schemas for the home page
  const homeJsonLd = [
    buildLocalBusinessJsonLd(),
    buildWebSiteJsonLd(),
    buildOrganizationJsonLd(),
    buildAggregateRatingJsonLd({ ratingValue: 4.8, reviewCount: 250 }),
    buildFAQJsonLd(HOME_FAQS),
  ];

  return (
    <>
      <SEO
        title="Xerox Machine Sales & Service in Tirunelveli"
        description="Yamini Infotech - #1 photocopier & printer sales, service, toner supply and AMC in Tirunelveli, Tenkasi & Nagercoil. Kyocera, Konica Minolta, Canon, Ricoh dealer. 25+ years trusted support. Call 98421 22952."
        path="/"
        keywords="Yamini Infotech, xerox machine Tirunelveli, copier service Tirunelveli, printer repair Tirunelveli, photocopier sales Tamil Nadu, toner supply Tirunelveli, AMC service copier, Konica Minolta dealer Tirunelveli, Kyocera dealer Tirunelveli, Canon printer service, Ricoh copier Tirunelveli, copier machine Tenkasi, printer service Nagercoil, office equipment Tirunelveli, multifunction printer sales"
        jsonLd={homeJsonLd}
      />
      {/* ── HERO ── */}
      <section className="pub-hero">
        <div className="pub-hero-text">
          <h1 className="reveal">Your Trusted Copier &amp; Printer Partner</h1>
          <p className="reveal">Sales, Service, Toner &amp; AMC — 25+ years serving Tirunelveli, Tenkasi &amp; Nagercoil with fast, reliable support.</p>
          <div className="pub-hero-actions reveal">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/products')}>
              View Products
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/services')}>
              Book Service
            </button>
            <a
              href="https://yamini-infotech-erp-files.s3.ap-south-1.amazonaws.com/apps/app-release.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg"
              style={{
                background: '#4CAF50',
                color: 'white',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📱 Download Staff App
            </a>
          </div>
        </div>
        <div className="pub-hero-image reveal-scale">
          <img
            src="/assets/images/hero-copier.webp"
            alt="Yamini Infotech - Xerox copier and printer sales service in Tirunelveli"
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
              {products.map((p, i) => (
                <div key={p.id} className="pub-product-card" style={{ '--i': i }} onClick={() => navigate(`/products/${p.id}`)}>
                  <div className="pub-product-card-img">
                    {p.image_url ? (
                      <img
                        src={getUploadUrl(p.image_url)}
                        alt={`${p.name} - ${p.brand || 'copier'} available at Yamini Infotech Tirunelveli`}
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
            <div style={{ textAlign: 'center', marginTop: 'var(--sp-xl)' }} className="reveal">
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
          <div className="pub-service-grid reveal">
            {SERVICES.map((s, i) => (
              <div
                key={s.id}
                className="pub-service-card"
                style={{ '--i': i }}
                onClick={() => navigate(`/services?type=${s.id}`)}
              >
                <div className="icon">{s.icon}</div>
                <div className="label">{s.label}</div>
                <p className="text-sm text-muted" style={{ marginTop: 4, fontSize: 11 }}>{s.desc}</p>
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
            <p>Trusted by 500+ businesses across South Tamil Nadu</p>
          </div>
          <div className="pub-testimonials-track">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="pub-testimonial-card" itemScope itemType="https://schema.org/Review">
                <div className="stars" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                  <meta itemProp="ratingValue" content={t.rating} />
                  {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                </div>
                <div className="quote" itemProp="reviewBody">"{t.text}"</div>
                <div className="author" itemProp="author">{t.name}</div>
                <div className="text-sm text-muted">{t.company}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOME FAQ (SEO rich results) ── */}
      <section className="pub-section">
        <div className="container">
          <div className="pub-section-header reveal">
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="pub-accordion" style={{ maxWidth: 720, margin: '0 auto' }}>
            {HOME_FAQS.map((faq, i) => (
              <HomeFAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ── STICKY BOTTOM CTA (Mobile only — hidden by CSS on tablet+) ── */}
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

/* ── Home FAQ Accordion Item ── */
function HomeFAQItem({ question, answer }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="pub-accordion-item" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
      <button className={`pub-accordion-header ${open ? 'open' : ''}`} onClick={() => setOpen(!open)} itemProp="name">
        {question}
        <span className="arrow">▼</span>
      </button>
      {open && (
        <div className="pub-accordion-body" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
          <p itemProp="text">{answer}</p>
        </div>
      )}
    </div>
  );
}

/* ── Inline Track Widget (Advanced) ── */
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

  const getStatusBadgeClass = (status) => {
    if (status === 'COMPLETED') return 'completed';
    if (['IN_PROGRESS', 'ON_THE_WAY', 'ASSIGNED'].includes(status)) return 'in-progress';
    return 'new';
  };

  return (
    <div className="pub-track-banner">
      <div className="track-title">
        <h2>Track Your Service</h2>
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

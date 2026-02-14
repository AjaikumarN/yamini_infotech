import React from 'react';

const WHY_CARDS = [
  { icon: '🏆', title: '25+ Years Experience', desc: 'Serving businesses since 1998 with reliable copier and printer solutions.' },
  { icon: '⚡', title: 'Fast Response Time', desc: 'Our engineers reach you within hours, not days. Same-day service guaranteed.' },
  { icon: '🔧', title: 'Genuine Spare Parts', desc: 'We use only original OEM parts for lasting repairs and optimal performance.' },
  { icon: '🛡️', title: 'Comprehensive AMC', desc: 'Annual maintenance contracts that keep your machines running 24/7.' },
  { icon: '📍', title: '3 Branch Locations', desc: 'Strategically located in Tirunelveli, Tenkasi & Nagercoil for local support.' },
  { icon: '💰', title: 'Best Prices', desc: 'Competitive pricing on machines, toner, and service — guaranteed value.' },
];

const BRANDS = [
  'Kyocera', 'Canon', 'Ricoh', 'Konica Minolta', 'HP', 'Epson', 'Brother', 'Sharp',
];

const AREAS = [
  'Tirunelveli', 'Tenkasi', 'Nagercoil', 'Kanyakumari', 'Thoothukudi',
  'Ambasamudram', 'Sankarankovil', 'Rajapalayam', 'Srivaikundam', 'Courtallam',
  'Palayamkottai', 'Vallioor', 'Thisayanvilai', 'Kovilpatti', 'Kadayam',
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--brand-light) 0%, #f0f4ff 100%)',
        padding: 'var(--sp-section) var(--page-margin)',
        textAlign: 'center',
      }}>
        <div className="container">
          <h1>About Yamini Infotech</h1>
          <p className="text-muted" style={{ margin: '12px auto 0', maxWidth: 600, fontSize: 16 }}>
            South Tamil Nadu's trusted partner for copier & printer sales, service, toner & AMC since 1998
          </p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="pub-section">
        <div className="container reveal" style={{ maxWidth: 720 }}>
          <h2 style={{ marginBottom: 'var(--sp-lg)' }}>Who We Are</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--sp-lg)' }}>
            Yamini Infotech is a leading authorized dealer and service provider for copiers, printers, and multifunction devices in the Tirunelveli, Tenkasi, and Nagercoil regions. With over 25 years of industry experience, we specialize in delivering reliable document solutions for offices, schools, shops, and businesses of all sizes.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Our team of trained engineers provides fast on-site support for installation, repair, toner supply, and annual maintenance contracts. We pride ourselves on genuine parts, transparent pricing, and a customer-first approach that has earned us the trust of thousands of businesses across South Tamil Nadu.
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="pub-section" style={{ background: 'var(--bg-section)' }}>
        <div className="container">
          <div className="pub-section-header">
            <h2>Why Choose Yamini Infotech?</h2>
          </div>
          <div className="pub-why-grid stagger">
            {WHY_CARDS.map((c, i) => (
              <div key={i} className="pub-why-card reveal-scale" style={{ '--i': i }}>
                <div className="icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="pub-section">
        <div className="container">
          <div className="pub-section-header">
            <h2>Brands We Service</h2>
            <p>Authorized dealer and service partner for leading brands</p>
          </div>
          <div className="pub-brands">
            {BRANDS.map((b, i) => (
              <div key={i} style={{
                padding: '12px 24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--text-secondary)'
              }}>
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Areas */}
      <section className="pub-section" style={{ background: 'var(--bg-section)' }}>
        <div className="container">
          <div className="pub-section-header">
            <h2>Our Coverage Area</h2>
            <p>We provide service across South Tamil Nadu</p>
          </div>
          <div className="pub-area-chips reveal">
            {AREAS.map((a, i) => (
              <span key={i} className="chip">{a}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pub-section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Ready to get started?</h2>
          <p className="text-muted" style={{ margin: '8px auto var(--sp-xl)' }}>
            Contact us today for a free consultation and quote
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+919842122952" className="btn btn-primary btn-lg">📞 Call Now</a>
            <a
              href="https://wa.me/919842122952?text=Hi%20Yamini%20Infotech%2C%20I%20need%20a%20quote"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-whatsapp btn-lg"
            >💬 WhatsApp</a>
          </div>
        </div>
      </section>
    </div>
  );
}

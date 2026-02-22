import React from 'react';
import SEO, { buildBreadcrumbJsonLd } from '../../components/SEO';

const BRANCHES = [
  {
    city: 'Tirunelveli',
    address: '123, South Bypass Road, Palayamkottai, Tirunelveli - 627002',
    phone: '+91 98421 22952',
    phone2: '+91 98425 04171',
    email: 'yaminiinfotechtvl@gmail.com',
    mapUrl: 'https://maps.app.goo.gl/SkFjxc5EnUjZc34L8',
    hours: 'Mon–Sat: 9:30 AM – 7:00 PM',
  },
  {
    city: 'Tenkasi',
    address: 'Main Road, Tenkasi, Tamil Nadu',
    phone: '+91 98421 22952',
    mapUrl: 'https://maps.app.goo.gl/Td9rribid4CQKg6q6',
    hours: 'Mon–Sat: 9:30 AM – 7:00 PM',
  },
  {
    city: 'Nagercoil',
    address: 'Court Road, Nagercoil, Kanyakumari',
    phone: '+91 98421 22952',
    mapUrl: 'https://maps.app.goo.gl/qdFhJTpKfeZ1pMzt7',
    hours: 'Mon–Sat: 9:30 AM – 7:00 PM',
  },
];

export default function ContactPage() {
  return (
    <div>
      <SEO
        title="Contact Yamini Infotech - Branches in Tirunelveli, Tenkasi & Nagercoil"
        description="Contact Yamini Infotech for copier sales, printer service, toner supply and AMC. Call 98421 22952. Branches in Tirunelveli, Tenkasi and Nagercoil."
        path="/contact"
        keywords="Yamini Infotech contact, copier service Tirunelveli phone, Yamini Infotech address, printer service near me Tirunelveli, Yamini Infotech Tenkasi, Yamini Infotech Nagercoil"
        jsonLd={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ])}
      />
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--brand-light) 0%, #f0f4ff 100%)',
        padding: 'var(--sp-section) var(--page-margin)',
        textAlign: 'center',
      }}>
        <div className="container">
          <h1>Contact Us</h1>
          <p className="text-muted" style={{ margin: '12px auto 0', maxWidth: 500, fontSize: 16 }}>
            Get in touch with us for sales, service, or any enquiry
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="pub-section">
        <div className="container">
          <div className="pub-contact-actions reveal">
            <a href="tel:+919842122952">
              <span className="icon">📞</span>
              Call Us
            </a>
            <a
              href="https://wa.me/919842122952?text=Hi%20Yamini%20Infotech%2C%20I%20have%20an%20enquiry"
              target="_blank" rel="noopener noreferrer"
            >
              <span className="icon">💬</span>
              WhatsApp
            </a>
            <a href="mailto:yaminiinfotechtvl@gmail.com">
              <span className="icon">✉️</span>
              Email
            </a>
            <a href="https://maps.app.goo.gl/SkFjxc5EnUjZc34L8" target="_blank" rel="noopener noreferrer">
              <span className="icon">📍</span>
              Directions
            </a>
          </div>
        </div>
      </section>

      {/* Branch Cards */}
      <section className="pub-section" style={{ background: 'var(--bg-section)', paddingTop: 0 }}>
        <div className="container">
          <div className="pub-section-header">
            <h2>Our Branches</h2>
          </div>
          <div className="pub-branch-cards stagger">
            {BRANCHES.map((b, i) => (
              <div key={i} className="pub-branch-card reveal" style={{ '--i': i }}>
                <h3>📍 {b.city}</h3>
                <p>{b.address}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                  <a href={`tel:${b.phone.replace(/\s/g, '')}`} style={{ color: 'var(--brand)', fontWeight: 600 }}>
                    📞 {b.phone}
                  </a>
                  {b.phone2 && (
                    <a href={`tel:${b.phone2.replace(/\s/g, '')}`} style={{ color: 'var(--brand)', fontWeight: 600 }}>
                      📞 {b.phone2}
                    </a>
                  )}
                  {b.email && (
                    <a href={`mailto:${b.email}`} style={{ color: 'var(--text-secondary)' }}>
                      ✉️ {b.email}
                    </a>
                  )}
                  <p className="text-sm text-muted">🕐 {b.hours}</p>
                </div>
                <a
                  href={b.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-block"
                  style={{ marginTop: 'var(--sp-lg)' }}
                >
                  🗺️ View on Map
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="pub-section">
        <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 'var(--sp-xl)' }}>Business Hours</h2>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', overflow: 'hidden'
          }}>
            {[
              ['Monday – Saturday', '9:30 AM – 7:00 PM'],
              ['Sunday', 'Closed'],
              ['Emergency Service', '24/7 Available'],
            ].map(([day, time], i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '14px 20px',
                borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                fontSize: 14,
              }}>
                <span style={{ fontWeight: 600 }}>{day}</span>
                <span style={{ color: time === 'Closed' ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pub-section" style={{ background: 'var(--brand)', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ color: 'white' }}>Need Immediate Assistance?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '8px auto var(--sp-xl)', maxWidth: 400 }}>
            Our support team is just a call or message away
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+919842122952" className="btn btn-lg" style={{ background: 'white', color: 'var(--brand)' }}>
              📞 Call +91 98421 22952
            </a>
            <a
              href="https://wa.me/919842122952"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-whatsapp btn-lg"
            >
              💬 WhatsApp Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

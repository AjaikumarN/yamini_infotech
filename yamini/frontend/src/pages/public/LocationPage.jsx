import React, { useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import SEO, { buildServiceJsonLd, buildFAQJsonLd, buildBreadcrumbJsonLd, buildLocalBusinessJsonLd } from '../../components/SEO';
import { getLocation, getAllLocations } from '../../data/locationData';

function LocationFAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      itemScope
      itemProp="mainEntity"
      itemType="https://schema.org/Question"
      style={{ borderBottom: '1px solid #eee', padding: '14px 0' }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)',
          textAlign: 'left', lineHeight: 1.4,
        }}
      >
        <span itemProp="name">{question}</span>
        <span style={{ fontSize: 18, marginLeft: 12, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
      </button>
      {open && (
        <div
          itemScope
          itemProp="acceptedAnswer"
          itemType="https://schema.org/Answer"
          style={{ marginTop: 10, color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}
        >
          <span itemProp="text">{answer}</span>
        </div>
      )}
    </div>
  );
}

export default function LocationPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, ''); // Remove leading slash to get slug
  const location = getLocation(slug);

  if (!location) return <Navigate to="/" replace />;

  const allLocations = getAllLocations().filter(l => l.slug !== slug);

  const jsonLd = [
    buildServiceJsonLd({
      serviceName: `Copier & Printer Service in ${location.city}`,
      serviceType: 'Copier and Printer Sales, Service & Rental',
      areaServed: location.city,
      description: location.description,
    }),
    buildLocalBusinessJsonLd(),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: location.city, path: `/${location.slug}` },
    ]),
    ...(location.faqs ? [buildFAQJsonLd(location.faqs)] : []),
  ];

  return (
    <div>
      <SEO
        title={location.title}
        description={location.description}
        path={`/${location.slug}`}
        keywords={location.keywords}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
        padding: 'var(--sp-section) var(--page-margin)',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div className="container">
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            padding: '4px 16px',
            borderRadius: 20,
            fontSize: 13,
            marginBottom: 16,
          }}>
            📍 {location.city}
          </div>
          <h1 style={{ color: '#fff', fontSize: 28, lineHeight: 1.3, marginBottom: 12 }}>
            {location.h1}
          </h1>
          <p style={{ opacity: 0.9, maxWidth: 600, margin: '0 auto 24px', fontSize: 16 }}>
            {location.heroText}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={`tel:${location.phone}`}
              style={{
                padding: '12px 28px',
                background: '#fff',
                color: 'var(--brand-dark)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              📞 Call Now
            </a>
            <Link
              to="/services"
              style={{
                padding: '12px 28px',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 14,
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              Book Service
            </Link>
          </div>
        </div>
      </section>

      {/* About this location */}
      <section className="pub-section">
        <div className="container reveal" style={{ maxWidth: 760 }}>
          <h2 style={{ marginBottom: 'var(--sp-lg)' }}>
            Yamini Infotech in {location.city}
          </h2>
          {location.content.split('\n\n').map((para, i) => (
            <p key={i} style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--sp-md)' }}>
              {para}
            </p>
          ))}
          <div style={{
            marginTop: 'var(--sp-lg)',
            padding: 'var(--sp-lg)',
            background: 'var(--brand-light)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            gap: 'var(--sp-lg)',
            flexWrap: 'wrap',
          }}>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>📍 Address</strong>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>{location.address}</p>
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>📞 Phone</strong>
              <p style={{ margin: '4px 0 0', fontSize: 14 }}>
                <a href={`tel:${location.phone}`} style={{ color: 'var(--brand)', textDecoration: 'none' }}>{location.phone}</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="pub-section" style={{ background: '#f8f9fa' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }}>
            Our Services in {location.city}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--sp-lg)',
            maxWidth: 960,
            margin: '0 auto',
          }}>
            {location.services.map((svc, i) => (
              <div key={i} style={{
                background: 'var(--surface)',
                padding: 'var(--sp-lg)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{svc.icon}</div>
                <h3 style={{ fontSize: 16, margin: '0 0 6px', color: 'var(--text-primary)' }}>{svc.name}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas Served */}
      <section className="pub-section">
        <div className="container" style={{ maxWidth: 760 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-lg)' }}>
            Areas We Serve in {location.city} District
          </h2>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
          }}>
            {location.areas.map(area => (
              <span key={area} style={{
                background: 'var(--brand-light)',
                color: 'var(--brand-dark)',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
              }}>
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Products CTA */}
      <section className="pub-section" style={{ background: '#f8f9fa' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Browse Our Machines</h2>
          <p className="text-muted" style={{ maxWidth: 500, margin: '0 auto 20px' }}>
            View our complete range of copiers, printers, and multifunction devices available in {location.city}
          </p>
          <Link to="/products" style={{
            display: 'inline-block',
            padding: '12px 32px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--brand)',
            color: '#fff',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            View Products →
          </Link>
        </div>
      </section>

      {/* FAQs */}
      {location.faqs && location.faqs.length > 0 && (
        <section className="pub-section" itemScope itemType="https://schema.org/FAQPage">
          <div className="container" style={{ maxWidth: 720 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }}>
              Frequently Asked Questions — {location.city}
            </h2>
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--sp-lg)',
              boxShadow: 'var(--shadow-card)',
            }}>
              {location.faqs.map((faq, idx) => (
                <LocationFAQItem key={idx} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other Locations */}
      {allLocations.length > 0 && (
        <section className="pub-section" style={{ background: '#f8f9fa' }}>
          <div className="container" style={{ maxWidth: 760 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-lg)' }}>
              Our Other Service Locations
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--sp-md)',
            }}>
              {allLocations.map(loc => (
                <Link
                  key={loc.slug}
                  to={`/${loc.slug}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    background: 'var(--surface)',
                    padding: 'var(--sp-lg)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-card)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📍</div>
                  <h3 style={{ fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>{loc.city}</h3>
                  <p style={{ fontSize: 13, color: 'var(--brand)', margin: '6px 0 0', fontWeight: 500 }}>View Details →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

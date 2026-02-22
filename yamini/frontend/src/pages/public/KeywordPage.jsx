import React, { useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import SEO, { buildServiceJsonLd, buildFAQJsonLd, buildBreadcrumbJsonLd, buildLocalBusinessJsonLd } from '../../components/SEO';
import { getKeywordPage, getAllKeywordPages } from '../../data/keywordPageData';

/* Simple markdown table + list renderer */
function renderContent(markdown) {
  const lines = markdown.trim().split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1]?.match(/^\|[\s-|]+\|$/)) {
      const tableLines = [];
      let j = i;
      while (j < lines.length && lines[j].includes('|')) { tableLines.push(lines[j]); j++; }
      const header = tableLines[0].split('|').filter(Boolean).map(c => c.trim());
      const rows = tableLines.slice(2).map(r => r.split('|').filter(Boolean).map(c => c.trim()));
      elements.push(
        <div key={i} style={{ overflowX: 'auto', margin: '16px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>{header.map((h, hi) => <th key={hi} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--brand)', background: 'var(--brand-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatInline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => <tr key={ri} style={{ background: ri % 2 ? 'var(--brand-light)' : 'transparent' }}>{row.map((cell, ci) => <td key={ci} style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: 'var(--text-secondary)' }}>{formatInline(cell)}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      );
      i = j;
      continue;
    }

    if (line.startsWith('### ')) { elements.push(<h3 key={i} style={{ margin: '28px 0 12px', fontSize: 18 }}>{formatInline(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith('## ')) { elements.push(<h2 key={i} style={{ margin: '32px 0 14px', fontSize: 21 }}>{formatInline(line.slice(3))}</h2>); i++; continue; }

    if (line.match(/^- /)) {
      const items = [];
      let j = i;
      while (j < lines.length && lines[j].match(/^- /)) { items.push(lines[j].slice(2)); j++; }
      elements.push(<ul key={i} style={{ margin: '12px 0', paddingLeft: 24, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{items.map((it, idx) => <li key={idx}>{formatInline(it)}</li>)}</ul>);
      i = j;
      continue;
    }

    if (line.match(/^\d+\. /)) {
      const items = [];
      let j = i;
      while (j < lines.length && lines[j].match(/^\d+\. /)) { items.push(lines[j].replace(/^\d+\. /, '')); j++; }
      elements.push(<ol key={i} style={{ margin: '12px 0', paddingLeft: 24, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{items.map((it, idx) => <li key={idx}>{formatInline(it)}</li>)}</ol>);
      i = j;
      continue;
    }

    if (line.trim() === '') { i++; continue; }
    elements.push(<p key={i} style={{ color: 'var(--text-secondary)', lineHeight: 1.8, margin: '12px 0' }}>{formatInline(line)}</p>);
    i++;
  }
  return elements;
}

function formatInline(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((.+?)\))/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index}>{match[2]}</strong>);
    else if (match[4]) {
      const href = match[5];
      parts.push(href.startsWith('/') ? <Link key={match.index} to={href} style={{ color: 'var(--brand)' }}>{match[4]}</Link> : <a key={match.index} href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>{match[4]}</a>);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

function KWFAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question" style={{ borderBottom: '1px solid #eee', padding: '14px 0' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left', lineHeight: 1.4 }}>
        <span itemProp="name">{question}</span>
        <span style={{ fontSize: 18, marginLeft: 12, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
      </button>
      {open && (
        <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" style={{ marginTop: 10, color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>
          <span itemProp="text">{answer}</span>
        </div>
      )}
    </div>
  );
}

export default function KeywordPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '');
  const page = getKeywordPage(slug);

  if (!page) return <Navigate to="/" replace />;

  const otherPages = getAllKeywordPages().filter(p => p.slug !== slug).slice(0, 5);

  const jsonLd = [
    buildServiceJsonLd({
      serviceName: page.title,
      serviceType: page.service,
      areaServed: page.city,
      description: page.description,
    }),
    buildLocalBusinessJsonLd(),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      ...(page.brand ? [{ name: page.brand, path: `/${page.slug}` }] : []),
      { name: `${page.service} ${page.city}`, path: `/${page.slug}` },
    ]),
    ...(page.faqs?.length ? [buildFAQJsonLd(page.faqs)] : []),
  ];

  return (
    <div>
      <SEO
        title={page.title}
        description={page.description}
        path={`/${page.slug}`}
        keywords={page.keywords}
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
          {page.brand && (
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '4px 16px', borderRadius: 20, fontSize: 13, marginBottom: 12 }}>
              {page.brand} Authorized Dealer
            </div>
          )}
          <h1 style={{ color: '#fff', fontSize: 26, lineHeight: 1.3, marginBottom: 12 }}>{page.h1}</h1>
          <p style={{ opacity: 0.9, maxWidth: 600, margin: '0 auto 24px', fontSize: 15 }}>
            Yamini Infotech — 25+ years of trusted {page.service.toLowerCase()} support in {page.city}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+919842122952" style={{ padding: '12px 28px', background: '#fff', color: 'var(--brand-dark)', borderRadius: 'var(--radius-md)', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
              📞 Call 98421 22952
            </a>
            <a href={`https://wa.me/919842122952?text=Hi,%20I%20need%20${encodeURIComponent(page.service)}%20in%20${page.city}`} target="_blank" rel="noopener noreferrer" style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 600, textDecoration: 'none', fontSize: 14, border: '1px solid rgba(255,255,255,0.3)' }}>
              💬 WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="pub-section">
        <div className="container reveal" style={{ maxWidth: 760 }}>
          {renderContent(page.content)}
        </div>
      </article>

      {/* Popular Models */}
      {page.popularModels?.length > 0 && (
        <section className="pub-section" style={{ background: '#f8f9fa' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: 'var(--sp-lg)' }}>Popular {page.brand} Models</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              {page.popularModels.map(m => (
                <span key={m} style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)', padding: '8px 18px', borderRadius: 20, fontWeight: 600, fontSize: 14 }}>{m}</span>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <Link to="/products" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'underline' }}>
                Browse All {page.brand || ''} Products →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="pub-section" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ color: '#fff', marginBottom: 8 }}>Need {page.brand || page.service} in {page.city}?</h2>
          <p style={{ opacity: 0.9, maxWidth: 500, margin: '0 auto 20px', fontSize: 15 }}>
            Get a free consultation and quote from our experts. Call or WhatsApp now.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+919842122952" style={{ padding: '12px 32px', background: '#fff', color: 'var(--brand-dark)', borderRadius: 'var(--radius-md)', fontWeight: 600, textDecoration: 'none' }}>📞 Call Now</a>
            <Link to="/services" style={{ padding: '12px 32px', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>Book Service →</Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      {page.faqs?.length > 0 && (
        <section className="pub-section" itemScope itemType="https://schema.org/FAQPage">
          <div className="container" style={{ maxWidth: 720 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }}>Frequently Asked Questions</h2>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-lg)', boxShadow: 'var(--shadow-card)' }}>
              {page.faqs.map((faq, idx) => <KWFAQItem key={idx} question={faq.question} answer={faq.answer} />)}
            </div>
          </div>
        </section>
      )}

      {/* Related Pages */}
      {otherPages.length > 0 && (
        <section className="pub-section" style={{ background: '#f8f9fa' }}>
          <div className="container" style={{ maxWidth: 960 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-lg)' }}>More Services</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--sp-md)' }}>
              {otherPages.map(p => (
                <Link key={p.slug} to={`/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit', background: 'var(--surface)', padding: 'var(--sp-lg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
                  <h3 style={{ fontSize: 15, color: 'var(--text-primary)', margin: '0 0 6px' }}>{p.h1}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{p.description.slice(0, 100)}...</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Inquiry Form */}
      <InquirySection service={page.service} city={page.city} brand={page.brand} />
    </div>
  );
}

/** Quick inquiry form — Conversion SEO */
function InquirySection({ service, city, brand }) {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = fd.get('name');
    const phone = fd.get('phone');
    const msg = fd.get('message') || '';
    const text = `Hi, I'm ${name} (${phone}). I need ${brand || ''} ${service} in ${city}. ${msg}`.trim();
    window.open(`https://wa.me/919842122952?text=${encodeURIComponent(text)}`, '_blank');
    setSent(true);
  };

  return (
    <section className="pub-section">
      <div className="container" style={{ maxWidth: 520 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-lg)' }}>Get a Free Quote</h2>
        {sent ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-xl)', background: 'var(--brand-light)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <p style={{ fontWeight: 600 }}>Thank you! We'll contact you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input name="name" required placeholder="Your Name" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #ddd', fontSize: 15 }} />
            <input name="phone" required type="tel" placeholder="Phone Number" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #ddd', fontSize: 15 }} />
            <textarea name="message" rows={3} placeholder={`Tell us about your ${service.toLowerCase()} requirement...`} style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #ddd', fontSize: 15, resize: 'vertical' }} />
            <button type="submit" style={{ padding: '14px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              Get Free Quote →
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

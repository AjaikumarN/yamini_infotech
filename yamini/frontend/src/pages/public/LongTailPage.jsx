import React, { useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import SEO, { buildServiceJsonLd, buildFAQJsonLd, buildBreadcrumbJsonLd, buildLocalBusinessJsonLd } from '../../components/SEO';
import { getLongTailPage, getAllLongTailPages } from '../../data/longTailPageData';

/* ── Markdown renderer (shared pattern) ── */
function renderContent(markdown) {
  const lines = markdown.trim().split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteText = line.slice(2);
      elements.push(
        <blockquote key={i} style={{ margin: '20px 0', padding: '16px 20px', borderLeft: '4px solid var(--brand)', background: 'var(--brand-light)', borderRadius: '0 var(--radius-md) var(--radius-md) 0', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15 }}>
          {formatInline(quoteText)}
        </blockquote>
      );
      i++;
      continue;
    }

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

    // Italics-only line (note lines)
    if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      elements.push(<p key={i} style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13, margin: '8px 0' }}>{formatInline(line.slice(1, -1))}</p>);
      i++;
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

function FAQItem({ question, answer }) {
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

export default function LongTailPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '');
  const page = getLongTailPage(slug);

  if (!page) return <Navigate to="/" replace />;

  const isCaseStudy = page.type === 'case-study';
  const allPages = getAllLongTailPages();
  const otherPages = allPages.filter(p => p.slug !== slug).slice(0, 4);

  const jsonLd = [
    buildServiceJsonLd({
      serviceName: page.title,
      serviceType: isCaseStudy ? 'Case Study' : 'Printer/Copier Service',
      areaServed: 'Tirunelveli',
      description: page.description,
    }),
    buildLocalBusinessJsonLd(),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      ...(isCaseStudy ? [{ name: 'Case Studies', path: `/${slug}` }] : []),
      { name: page.h1, path: `/${slug}` },
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
        background: isCaseStudy
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
        padding: 'var(--sp-section) var(--page-margin)',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div className="container">
          {isCaseStudy && (
            <div style={{ display: 'inline-block', background: '#f59e0b', color: '#000', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              📄 Case Study
            </div>
          )}
          {!isCaseStudy && (
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '4px 16px', borderRadius: 20, fontSize: 13, marginBottom: 12 }}>
              Serving Tirunelveli & Surrounding Areas
            </div>
          )}
          <h1 style={{ color: '#fff', fontSize: 26, lineHeight: 1.3, marginBottom: 12 }}>{page.h1}</h1>
          <p style={{ opacity: 0.9, maxWidth: 600, margin: '0 auto 24px', fontSize: 15 }}>
            {isCaseStudy
              ? 'Real results from a real customer — see how Yamini Infotech solved their printing challenges'
              : 'Yamini Infotech — 25+ years of trusted copier & printer support in Tirunelveli'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+919842122952" style={{ padding: '12px 28px', background: '#fff', color: isCaseStudy ? '#0f172a' : 'var(--brand-dark)', borderRadius: 'var(--radius-md)', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
              📞 Call 98421 22952
            </a>
            <a href="https://wa.me/919842122952?text=Hi,%20I%20saw%20your%20page%20about%20" target="_blank" rel="noopener noreferrer" style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 600, textDecoration: 'none', fontSize: 14, border: '1px solid rgba(255,255,255,0.3)' }}>
              💬 WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* E-E-A-T Author Box (case studies) */}
      {isCaseStudy && (
        <div className="pub-section" style={{ paddingBottom: 0 }}>
          <div className="container" style={{ maxWidth: 760 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 18px', background: 'var(--brand-light)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>YI</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  <span itemProp="author" itemScope itemType="https://schema.org/Organization">
                    <span itemProp="name">Yamini Infotech</span>
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  25+ years experience | 500+ copier installations | Authorized Kyocera & Konica Minolta dealer
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <h2 style={{ marginBottom: 'var(--sp-lg)' }}>Featured Models</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              {page.popularModels.map(m => (
                <span key={m} style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)', padding: '8px 18px', borderRadius: 20, fontWeight: 600, fontSize: 14 }}>{m}</span>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <Link to="/products" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'underline' }}>
                Browse All Products →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="pub-section" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))', color: '#fff', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ color: '#fff', marginBottom: 8 }}>
            {isCaseStudy ? 'Want Similar Results?' : 'Ready to Get Started?'}
          </h2>
          <p style={{ opacity: 0.9, maxWidth: 500, margin: '0 auto 20px', fontSize: 15 }}>
            {isCaseStudy
              ? 'Get a free consultation and a solution customized to your needs.'
              : 'Call or WhatsApp now for a free quote and expert consultation.'}
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
              {page.faqs.map((faq, idx) => <FAQItem key={idx} question={faq.question} answer={faq.answer} />)}
            </div>
          </div>
        </section>
      )}

      {/* Related Pages */}
      {otherPages.length > 0 && (
        <section className="pub-section" style={{ background: '#f8f9fa' }}>
          <div className="container" style={{ maxWidth: 960 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-lg)' }}>More From Yamini Infotech</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--sp-md)' }}>
              {otherPages.map(p => (
                <Link key={p.slug} to={`/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit', background: 'var(--surface)', padding: 'var(--sp-lg)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
                  {p.type === 'case-study' && <span style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>CASE STUDY</span>}
                  <h3 style={{ fontSize: 15, color: 'var(--text-primary)', margin: '0 0 6px' }}>{p.h1}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{p.description.slice(0, 100)}...</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Inquiry Form */}
      <InquirySection page={page} isCaseStudy={isCaseStudy} />
    </div>
  );
}

/** Quick inquiry form — Conversion SEO */
function InquirySection({ page, isCaseStudy }) {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = fd.get('name');
    const phone = fd.get('phone');
    const msg = fd.get('message') || '';
    const text = `Hi, I'm ${name} (${phone}). I saw your page "${page.h1}". ${msg}`.trim();
    window.open(`https://wa.me/919842122952?text=${encodeURIComponent(text)}`, '_blank');
    setSent(true);
  };

  return (
    <section className="pub-section">
      <div className="container" style={{ maxWidth: 520 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-lg)' }}>
          {isCaseStudy ? 'Request a Similar Solution' : 'Get a Free Quote'}
        </h2>
        {sent ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-xl)', background: 'var(--brand-light)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <p style={{ fontWeight: 600 }}>Thank you! We'll contact you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input name="name" required placeholder="Your Name" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #ddd', fontSize: 15 }} />
            <input name="phone" required type="tel" placeholder="Phone Number" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #ddd', fontSize: 15 }} />
            <textarea name="message" rows={3} placeholder="Tell us about your requirement..." style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #ddd', fontSize: 15, resize: 'vertical' }} />
            <button type="submit" style={{ padding: '14px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              {isCaseStudy ? 'Request Consultation →' : 'Get Free Quote →'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

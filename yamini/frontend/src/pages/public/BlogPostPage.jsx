import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import SEO, { buildArticleJsonLd, buildFAQJsonLd, buildBreadcrumbJsonLd } from '../../components/SEO';
import { getBlogPost, getAllBlogPosts } from '../../data/blogData';
import { autoLinkMarkdown } from '../../utils/autoLinker';

/* Simple Markdown-ish renderer — handles ##, ###, **bold**, [link](url), tables, lists */
function renderContent(markdown) {
  const lines = markdown.trim().split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table detection
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1]?.match(/^\|[\s-|]+\|$/)) {
      const tableLines = [];
      let j = i;
      while (j < lines.length && lines[j].includes('|')) {
        tableLines.push(lines[j]);
        j++;
      }
      elements.push(renderTable(tableLines, i));
      i = j;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ margin: '28px 0 12px', fontSize: 18, color: 'var(--text-primary)' }}>{inlineFormat(line.slice(4))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ margin: '32px 0 14px', fontSize: 21, color: 'var(--text-primary)' }}>{inlineFormat(line.slice(3))}</h2>);
      i++;
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(<h4 key={i} style={{ margin: '24px 0 8px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{inlineFormat(line.slice(5))}</h4>);
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^- /)) {
      const items = [];
      let j = i;
      while (j < lines.length && lines[j].match(/^- /)) {
        items.push(lines[j].slice(2));
        j++;
      }
      elements.push(
        <ul key={i} style={{ margin: '12px 0', paddingLeft: 24, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          {items.map((item, idx) => <li key={idx}>{inlineFormat(item)}</li>)}
        </ul>
      );
      i = j;
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const items = [];
      let j = i;
      while (j < lines.length && lines[j].match(/^\d+\. /)) {
        items.push(lines[j].replace(/^\d+\. /, ''));
        j++;
      }
      elements.push(
        <ol key={i} style={{ margin: '12px 0', paddingLeft: 24, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          {items.map((item, idx) => <li key={idx}>{inlineFormat(item)}</li>)}
        </ol>
      );
      i = j;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={i} style={{ color: 'var(--text-secondary)', lineHeight: 1.8, margin: '12px 0' }}>
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return elements;
}

/* Inline formatting: **bold**, [text](url), `code` */
function inlineFormat(text) {
  // Convert **bold**
  const parts = [];
  const regex = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((.+?)\))|(`(.+?)`)|([⭐✅❌🆕📊🔄⏱️🏫🏢📈💰⚙️📋📞💬🔧🖨️📦🛡️])/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[4] && match[5]) {
      const href = match[5];
      if (href.startsWith('/')) {
        parts.push(<Link key={match.index} to={href} style={{ color: 'var(--brand)', textDecoration: 'underline' }}>{match[4]}</Link>);
      } else {
        parts.push(<a key={match.index} href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>{match[4]}</a>);
      }
    } else if (match[7]) {
      parts.push(<code key={match.index} style={{ background: 'var(--brand-light)', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>{match[7]}</code>);
    } else {
      parts.push(match[0]);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length ? parts : text;
}

/* Table renderer */
function renderTable(tableLines, key) {
  const header = tableLines[0].split('|').filter(Boolean).map(c => c.trim());
  const rows = tableLines.slice(2).map(row => row.split('|').filter(Boolean).map(c => c.trim()));

  return (
    <div key={key} style={{ overflowX: 'auto', margin: '16px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {header.map((h, i) => (
              <th key={i} style={{
                padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--brand)',
                background: 'var(--brand-light)', fontWeight: 600, color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
              }}>
                {inlineFormat(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'var(--brand-light)' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: 'var(--text-secondary)' }}>
                  {inlineFormat(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* FAQ accordion for blog post */
function BlogFAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      itemScope
      itemProp="mainEntity"
      itemType="https://schema.org/Question"
      style={{
        borderBottom: '1px solid #eee',
        padding: '14px 0',
      }}
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

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getBlogPost(slug);

  if (!post) return <Navigate to="/blog" replace />;

  const allPosts = getAllBlogPosts().filter(p => p.slug !== slug).slice(0, 3);
  const jsonLd = [
    buildArticleJsonLd({
      title: post.title,
      description: post.description,
      path: `/blog/${post.slug}`,
      image: post.image,
      datePublished: post.date,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
    ...(post.faqs ? [buildFAQJsonLd(post.faqs)] : []),
  ];

  return (
    <div>
      <SEO
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        type="article"
        keywords={post.keywords}
        jsonLd={jsonLd}
      />

      {/* Breadcrumb */}
      <nav style={{
        padding: '12px var(--page-margin)',
        fontSize: 13,
        color: 'var(--text-tertiary)',
        background: 'var(--brand-light)',
      }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <Link to="/" style={{ color: 'var(--brand)', textDecoration: 'none' }}>Home</Link>{' / '}
          <Link to="/blog" style={{ color: 'var(--brand)', textDecoration: 'none' }}>Blog</Link>{' / '}
          <span>{post.title}</span>
        </div>
      </nav>

      {/* Article */}
      <article className="pub-section" itemScope itemType="https://schema.org/Article">
        <div className="container reveal" style={{ maxWidth: 760 }}>
          {/* Meta info */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{
              background: 'var(--brand-light)',
              color: 'var(--brand-dark)',
              padding: '3px 12px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
            }}>
              {post.category}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              📅 {new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              ⏱️ {post.readTime} read
            </span>
          </div>

          <h1 itemProp="headline" style={{ fontSize: 28, lineHeight: 1.3, marginBottom: 24, color: 'var(--text-primary)' }}>
            {post.title}
          </h1>
          <meta itemProp="author" content="Yamini Infotech" />
          <meta itemProp="datePublished" content={post.date} />

          {/* E-E-A-T Author Box */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 18px', background: 'var(--brand-light)', borderRadius: 'var(--radius-lg)', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>YI</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                <span itemProp="author" itemScope itemType="https://schema.org/Organization">
                  <span itemProp="name">Yamini Infotech</span>
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                25+ years experience in copier & printer solutions | Authorized Kyocera & Konica Minolta dealer
              </div>
            </div>
          </div>

          {/* Article body — auto-linked */}
          <div itemProp="articleBody" style={{ fontSize: 15 }}>
            {renderContent(autoLinkMarkdown(post.content, `/blog/${post.slug}`))}
          </div>

          {/* Post FAQs */}
          {post.faqs && post.faqs.length > 0 && (
            <section
              itemScope
              itemType="https://schema.org/FAQPage"
              style={{
                marginTop: 40,
                padding: 'var(--sp-lg)',
                background: 'var(--brand-light)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <h2 style={{ fontSize: 20, marginBottom: 16 }}>Frequently Asked Questions</h2>
              {post.faqs.map((faq, idx) => (
                <BlogFAQItem key={idx} question={faq.question} answer={faq.answer} />
              ))}
            </section>
          )}

          {/* Related Products CTA */}
          {post.relatedProducts && (
            <div style={{
              marginTop: 32,
              background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--sp-xl)',
              textAlign: 'center',
              color: '#fff',
            }}>
              <h3 style={{ margin: '0 0 8px', color: '#fff' }}>Browse Our Machines</h3>
              <p style={{ margin: '0 0 16px', opacity: 0.9, fontSize: 14 }}>
                Explore our full range of copiers, printers, and multifunction devices
              </p>
              <Link to="/products" style={{
                display: 'inline-block',
                padding: '10px 28px',
                background: '#fff',
                color: 'var(--brand-dark)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 14,
              }}>
                View Products →
              </Link>
            </div>
          )}
        </div>
      </article>

      {/* Related Posts */}
      {allPosts.length > 0 && (
        <section className="pub-section" style={{ background: '#f8f9fa' }}>
          <div className="container" style={{ maxWidth: 960 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-xl)' }}>More Articles</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 'var(--sp-lg)',
            }}>
              {allPosts.map(p => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{
                    background: 'var(--surface)',
                    padding: 'var(--sp-lg)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-card)',
                  }}>
                    <span style={{
                      fontSize: 11,
                      background: 'var(--brand-light)',
                      color: 'var(--brand-dark)',
                      padding: '2px 8px',
                      borderRadius: 8,
                      fontWeight: 600,
                    }}>
                      {p.category}
                    </span>
                    <h3 style={{ fontSize: 15, margin: '10px 0 6px', lineHeight: 1.4, color: 'var(--text-primary)' }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {p.description.slice(0, 100)}...
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

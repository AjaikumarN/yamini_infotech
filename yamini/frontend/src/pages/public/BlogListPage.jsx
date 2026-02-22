import React from 'react';
import { Link } from 'react-router-dom';
import SEO, { buildBreadcrumbJsonLd } from '../../components/SEO';
import { getAllBlogPosts } from '../../data/blogData';

export default function BlogListPage() {
  const posts = getAllBlogPosts();

  return (
    <div>
      <SEO
        title="Blog - Copier & Printer Tips, Guides & Comparisons"
        description="Expert articles on copiers, printers, toner, AMC maintenance, and office printing tips from Yamini Infotech. Read buying guides, brand comparisons, and cost-saving tips."
        path="/blog"
        type="website"
        keywords="copier blog, printer tips, Yamini Infotech blog, office printing guide, copier buying guide, printer comparison, AMC guide Tirunelveli"
        jsonLd={buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
        ])}
      />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--brand-light) 0%, #f0f4ff 100%)',
        padding: 'var(--sp-section) var(--page-margin)',
        textAlign: 'center',
      }}>
        <div className="container">
          <h1>Yamini Infotech Blog</h1>
          <p className="text-muted" style={{ margin: '12px auto 0', maxWidth: 600, fontSize: 16 }}>
            Expert guides, tips &amp; comparisons to help you choose the right copier, printer &amp; save money
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="pub-section">
        <div className="container reveal" style={{ maxWidth: 960 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--sp-xl)',
          }}>
            {posts.map(post => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                  }}
                >
                  {/* Colored header bar */}
                  <div style={{
                    height: 6,
                    background: 'linear-gradient(90deg, var(--brand) 0%, var(--brand-dark) 100%)',
                  }} />
                  <div style={{ padding: 'var(--sp-lg)' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <span style={{
                        background: 'var(--brand-light)',
                        color: 'var(--brand-dark)',
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {post.category}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                        {post.readTime} read
                      </span>
                    </div>
                    <h2 style={{ fontSize: 17, lineHeight: 1.4, margin: '8px 0', color: 'var(--text-primary)' }}>
                      {post.title}
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      {post.description}
                    </p>
                    <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-tertiary)' }}>
                      📅 {new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pub-section" style={{ textAlign: 'center', paddingBottom: 'var(--sp-section)' }}>
        <div className="container">
          <h2 style={{ marginBottom: 'var(--sp-md)' }}>Need Expert Advice?</h2>
          <p className="text-muted" style={{ maxWidth: 500, margin: '0 auto 20px' }}>
            Our team has 25+ years of experience helping businesses choose the right copier and printer solutions.
          </p>
          <Link to="/contact" className="btn-primary" style={{
            display: 'inline-block',
            padding: '12px 32px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--brand)',
            color: '#fff',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}

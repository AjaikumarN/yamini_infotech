import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { getUploadUrl } from '../../config';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest(`/api/products/${id}`);
        setProduct(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const parseSpecs = (specs) => {
    if (!specs) return null;
    try { return typeof specs === 'string' ? JSON.parse(specs) : specs; }
    catch { return null; }
  };

  const usageTags = {
    office: '🏢 Office', school: '🎓 School', shop: '🏪 Shop', home: '🏠 Home'
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--sp-2xl) var(--page-margin)' }}>
        <div className="pub-skeleton" style={{ width: '100%', aspectRatio: 1, marginBottom: 'var(--sp-xl)' }} />
        <div className="pub-skeleton" style={{ height: 20, width: '60%', marginBottom: 12 }} />
        <div className="pub-skeleton" style={{ height: 28, width: '40%', marginBottom: 12 }} />
        <div className="pub-skeleton" style={{ height: 14, width: '80%' }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 'var(--sp-section) var(--page-margin)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <h2>Product Not Found</h2>
        <p className="text-muted" style={{ margin: '8px auto 24px' }}>This product may have been removed</p>
        <button className="btn btn-primary" onClick={() => navigate('/products')}>← Back to Products</button>
      </div>
    );
  }

  const specs = parseSpecs(product.specifications);
  const features = product.features ? product.features.split('\n').filter(f => f.trim()) : [];

  const sections = [
    { id: 'desc', title: '📝 Description', content: product.description },
    features.length > 0 && {
      id: 'features', title: '⭐ Key Features',
      content: (
        <ul style={{ paddingLeft: 18 }}>
          {features.map((f, i) => <li key={i} style={{ marginBottom: 6 }}>{f.trim()}</li>)}
        </ul>
      ),
    },
    specs && {
      id: 'specs', title: '🔧 Specifications',
      content: (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {Object.entries(specs).map(([k, v]) => (
              <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 0', fontWeight: 600, fontSize: 13, width: '40%' }}>{k}</td>
                <td style={{ padding: '8px 0', fontSize: 13, color: 'var(--text-secondary)' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
  ].filter(Boolean);

  return (
    <>
      <div className="pub-detail-layout">
        {/* Image */}
        <div className="pub-detail-carousel">
          {product.image_url ? (
            <img src={getUploadUrl(product.image_url)} alt={product.name} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, color: '#94a3b8' }}>
              🖨
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pub-detail-info">
          <button onClick={() => navigate('/products')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 14, fontWeight: 600, color: 'var(--brand)', marginBottom: 'var(--sp-lg)', background: 'none', border: 'none', cursor: 'pointer'
          }}>
            ← Back
          </button>

          <span className="tag" style={{ display: 'inline-block', padding: '4px 12px', background: 'var(--brand-light)', color: 'var(--brand)', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            {product.brand || 'Premium'}
          </span>

          <h1>{product.name}</h1>

          {product.price && (
            <div className="price">₹{product.price.toLocaleString()}</div>
          )}

          {/* Best-for chips */}
          <div className="pub-detail-chips">
            {product.usage_type && (
              <span className="chip">{usageTags[product.usage_type] || product.usage_type}</span>
            )}
            {product.category && <span className="chip">{product.category}</span>}
            {product.model && <span className="chip">Model: {product.model}</span>}
            <span className="chip">
              {product.stock_quantity > 0 ? '✅ In Stock' : '❌ Out of Stock'}
            </span>
          </div>

          {/* Accordion sections */}
          <div className="pub-accordion">
            {sections.map(s => (
              <div key={s.id} className="pub-accordion-item">
                <button
                  className={`pub-accordion-header ${openSection === s.id ? 'open' : ''}`}
                  onClick={() => setOpenSection(openSection === s.id ? null : s.id)}
                >
                  {s.title}
                  <span className="arrow">▼</span>
                </button>
                {openSection === s.id && (
                  <div className="pub-accordion-body">
                    {typeof s.content === 'string' ? <p>{s.content}</p> : s.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="pub-detail-action-bar">
        <a href="tel:+919842122952" className="btn btn-secondary">
          📞 Call
        </a>
        <a
          href={`https://wa.me/919842122952?text=Hi%2C%20I%27m%20interested%20in%20${encodeURIComponent(product.name)}%20(ID%3A%20${product.id})`}
          target="_blank" rel="noopener noreferrer"
          className="btn btn-whatsapp"
        >
          💬 WhatsApp
        </a>
        <button className="btn btn-primary" onClick={() => navigate(`/enquiry/${product.id}`)}>
          📝 Enquire
        </button>
      </div>
    </>
  );
}

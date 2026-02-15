import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceProfile } from '../../hooks/useDeviceProfile';
import { apiRequest } from '../../utils/api';
import { getUploadUrl } from '../../config';

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState('name');
  const [loading, setLoading] = useState(true);
  const { type: deviceType } = useDeviceProfile();
  const navigate = useNavigate();

  const categories = [
    { id: 'office', label: 'Office', icon: '🏢' },
    { id: 'school', label: 'School', icon: '🎓' },
    { id: 'shop', label: 'Shop', icon: '🏪' },
    { id: 'home', label: 'Home', icon: '🏠' },
  ];

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest('/api/products');
        setProducts(data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    let list = [...products];
    if (category) list = list.filter(p => p.usage_type === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    if (sort === 'price-low') list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === 'price-high') list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    setFiltered(list);
  }, [products, search, category, sort]);

  return (
    <>
      {/* Search bar */}
      <div className="pub-list-controls">
        <input
          className="search-input"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category chips - horizontal scroll */}
      <div className="container" style={{ paddingTop: 'var(--sp-md)', paddingBottom: 'var(--sp-md)' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {categories.map(c => (
            <button
              key={c.id}
              className={`btn ${category === c.id ? 'btn-primary' : 'btn-secondary'} btn-pill`}
              style={{ flexShrink: 0, minHeight: 36, padding: '6px 16px', fontSize: 13 }}
              onClick={() => setCategory(category === c.id ? null : c.id)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <p className="text-sm text-muted">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Product Grid */}
      <div className="container">
        {loading ? (
          <div className="pub-products-grid">
            {[...Array(6)].map((_, i) => (
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
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-section) 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <h3>No products found</h3>
            <p className="text-muted" style={{ margin: '8px auto' }}>Try adjusting your search or filter</p>
            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => { setSearch(''); setCategory(null); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="pub-products-grid">
            {filtered.map(p => (
              <div key={p.id} className="pub-product-card" onClick={() => navigate(`/products/${p.id}`)}>
                <div className="pub-product-card-img">
                  {p.image_url ? (
                    <img src={getUploadUrl(p.image_url)} alt={p.name} loading="lazy"
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 32 }}>🖨</span>
                  )}
                </div>
                <div className="pub-product-card-body">
                  <span className="tag">{p.usage_type || p.category || 'Copier'}</span>
                  <div className="name">{p.name}</div>
                  {p.description && <div className="feature">{p.description.substring(0, 50)}</div>}
                  <div className="price">₹{(p.price || 0).toLocaleString()}</div>
                  <div className="pub-product-card-actions">
                    <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}`); }}>View</button>
                    <a
                      className="btn btn-whatsapp"
                      href={`https://wa.me/919842122952?text=Hi%2C%20I%27m%20interested%20in%20${encodeURIComponent(p.name)}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >WhatsApp</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </>
  );
}

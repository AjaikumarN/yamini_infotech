import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { FiPlus, FiSearch, FiGrid, FiList, FiPackage, FiEdit2, FiPhone, FiEye, FiX, FiHome, FiBriefcase, FiBook, FiShoppingBag } from 'react-icons/fi';

const ProductListing = ({ mode = 'staff' }) => {
  const isAdminMode = mode === 'admin';
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      const data = await apiRequest('/api/products');
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.usage_type === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const categories = [
    { id: 'all', label: 'All Products', icon: FiPackage, color: '#667eea' },
    { id: 'office', label: 'Office', icon: FiBriefcase, color: '#3b82f6' },
    { id: 'school', label: 'School', icon: FiBook, color: '#10b981' },
    { id: 'shop', label: 'Shop', icon: FiShoppingBag, color: '#f59e0b' },
    { id: 'home', label: 'Home', icon: FiHome, color: '#ec4899' },
  ];

  const getUsageConfig = (usageType) => {
    const configs = {
      office: { label: 'Office', color: '#3b82f6', bg: '#eff6ff', icon: '🏢' },
      school: { label: 'School', color: '#10b981', bg: '#ecfdf5', icon: '🎓' },
      shop: { label: 'Shop', color: '#f59e0b', bg: '#fffbeb', icon: '🏪' },
      home: { label: 'Home', color: '#ec4899', bg: '#fdf2f8', icon: '🏠' }
    };
    return configs[usageType] || { label: usageType, color: '#6b7280', bg: '#f3f4f6', icon: '📦' };
  };

  if (loading) {
    return (
      <div className="prod-loading">
        <div className="prod-loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="prod-page">
      {/* Floating Header */}
      <header className="prod-header">
        <div className="prod-header-content">
          <div className="prod-header-left">
            <div className="prod-logo">
              <FiPackage size={28} />
            </div>
            <div>
              <h1 className="prod-title">
                {isAdminMode ? 'Product Management' : 'Product Catalog'}
              </h1>
              <p className="prod-subtitle">
                {isAdminMode ? 'Manage your product inventory' : 'Find the perfect printer for your needs'}
              </p>
            </div>
          </div>
          <div className="prod-header-actions">
            {isAdminMode && (
              <button className="prod-add-btn" onClick={() => navigate('/products/add')}>
                <FiPlus size={20} />
                <span>Add Product</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Search & Filter Section */}
      <section className="prod-filters-section">
        <div className="prod-search-wrapper">
          <div className="prod-search-box">
            <FiSearch className="prod-search-icon" />
            <input
              type="text"
              className="prod-search-input"
              placeholder="Search products by name, brand, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="prod-search-clear" onClick={() => setSearchTerm('')}>
                <FiX size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="prod-filter-row">
          <div className="prod-categories">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  className={`prod-cat-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    '--cat-color': cat.color,
                    '--cat-bg': `${cat.color}15`
                  }}
                >
                  <Icon size={18} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="prod-view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <FiGrid size={18} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FiList size={18} />
            </button>
          </div>
        </div>

        <div className="prod-results-info">
          <span className="prod-count">{filteredProducts.length} products</span>
          {searchTerm && <span className="prod-search-term">matching "{searchTerm}"</span>}
        </div>
      </section>

      {/* Products Display */}
      <section className="prod-content">
        {filteredProducts.length === 0 ? (
          <div className="prod-empty">
            <div className="prod-empty-icon">
              <FiPackage size={64} />
            </div>
            <h3>No products found</h3>
            <p>Try adjusting your search or filter criteria</p>
            <button className="prod-clear-btn" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div className={`prod-grid ${viewMode}`}>
            {filteredProducts.map((product, index) => {
              const usage = getUsageConfig(product.usage_type);
              return (
                <article 
                  key={product.id} 
                  className="prod-card"
                  style={{ '--delay': `${index * 0.05}s` }}
                >
                  <div className="prod-card-image">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} />
                    ) : (
                      <div className="prod-placeholder">
                        <FiPackage size={48} />
                      </div>
                    )}
                    <span 
                      className="prod-usage-badge"
                      style={{ background: usage.bg, color: usage.color }}
                    >
                      {usage.icon} {usage.label}
                    </span>
                    {product.stock_quantity <= 5 && (
                      <span className="prod-stock-badge">Low Stock</span>
                    )}
                  </div>

                  <div className="prod-card-body">
                    <div className="prod-card-header">
                      <span className="prod-brand">{product.brand || 'Premium'}</span>
                      <h3 className="prod-name">{product.name}</h3>
                    </div>

                    <p className="prod-desc">
                      {product.description?.substring(0, 80)}
                      {product.description?.length > 80 && '...'}
                    </p>

                    <div className="prod-card-footer">
                      {product.price && (
                        <div className="prod-price">
                          <span className="currency">₹</span>
                          <span className="amount">{product.price.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="prod-actions">
                        <button
                          className="prod-btn prod-btn-primary"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <FiEye size={16} />
                          <span>View</span>
                        </button>
                        {isAdminMode ? (
                          <button
                            className="prod-btn prod-btn-success"
                            onClick={() => navigate(`/products/edit/${product.id}`)}
                          >
                            <FiEdit2 size={16} />
                            <span>Edit</span>
                          </button>
                        ) : (
                          <button
                            className="prod-btn prod-btn-secondary"
                            onClick={() => navigate(`/enquiry/${product.id}`)}
                          >
                            <FiPhone size={16} />
                            <span>Enquire</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <style>{`
        /* ========================================
           Product Listing - Modern Premium UI
           ======================================== */

        .prod-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        }

        /* Loading State */
        .prod-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          color: #64748b;
        }

        .prod-loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Header */
        .prod-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 0;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        .prod-header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .prod-header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .prod-logo {
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .prod-title {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
        }

        .prod-subtitle {
          margin: 4px 0 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
        }

        .prod-add-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .prod-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        /* Filters Section */
        .prod-filters-section {
          background: white;
          padding: 28px 32px;
          border-bottom: 1px solid #e2e8f0;
          max-width: 1400px;
          margin: 0 auto;
        }

        .prod-search-wrapper {
          margin-bottom: 24px;
        }

        .prod-search-box {
          position: relative;
          max-width: 600px;
        }

        .prod-search-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 20px;
        }

        .prod-search-input {
          width: 100%;
          padding: 16px 50px 16px 54px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 15px;
          background: #f8fafc;
          transition: all 0.3s ease;
        }

        .prod-search-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .prod-search-input::placeholder {
          color: #94a3b8;
        }

        .prod-search-clear {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: #f1f5f9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .prod-search-clear:hover {
          background: #e2e8f0;
          color: #334155;
        }

        .prod-filter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .prod-categories {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .prod-cat-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .prod-cat-btn:hover {
          border-color: var(--cat-color);
          color: var(--cat-color);
          background: var(--cat-bg);
        }

        .prod-cat-btn.active {
          background: var(--cat-color);
          color: white;
          border-color: var(--cat-color);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .prod-view-toggle {
          display: flex;
          background: #f1f5f9;
          border-radius: 10px;
          padding: 4px;
        }

        .view-btn {
          padding: 10px 14px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          color: #94a3b8;
          transition: all 0.2s ease;
        }

        .view-btn:hover {
          color: #64748b;
        }

        .view-btn.active {
          background: white;
          color: #667eea;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .prod-results-info {
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #64748b;
        }

        .prod-count {
          font-weight: 600;
          color: #334155;
        }

        .prod-search-term {
          color: #667eea;
        }

        /* Products Content */
        .prod-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px;
        }

        /* Grid Styles */
        .prod-grid {
          display: grid;
          gap: 24px;
        }

        .prod-grid.grid {
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        }

        .prod-grid.list {
          grid-template-columns: 1fr;
        }

        .prod-grid.list .prod-card {
          display: flex;
          flex-direction: row;
        }

        .prod-grid.list .prod-card-image {
          width: 200px;
          min-height: 180px;
          border-radius: 16px 0 0 16px;
        }

        .prod-grid.list .prod-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* Product Card */
        .prod-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeIn 0.5s ease forwards;
          animation-delay: var(--delay);
          opacity: 0;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
          from {
            opacity: 0;
            transform: translateY(20px);
          }
        }

        .prod-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px -10px rgba(102, 126, 234, 0.2);
          border-color: transparent;
        }

        .prod-card-image {
          position: relative;
          height: 220px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          overflow: hidden;
        }

        .prod-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .prod-card:hover .prod-card-image img {
          transform: scale(1.08);
        }

        .prod-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #cbd5e1;
        }

        .prod-usage-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .prod-stock-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 6px 12px;
          background: #fef2f2;
          color: #dc2626;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
        }

        .prod-card-body {
          padding: 24px;
        }

        .prod-card-header {
          margin-bottom: 12px;
        }

        .prod-brand {
          font-size: 12px;
          font-weight: 600;
          color: #667eea;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .prod-name {
          margin: 6px 0 0;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.3;
        }

        .prod-desc {
          margin: 0 0 20px;
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
        }

        .prod-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .prod-price {
          display: flex;
          align-items: baseline;
          gap: 2px;
        }

        .prod-price .currency {
          font-size: 16px;
          font-weight: 600;
          color: #10b981;
        }

        .prod-price .amount {
          font-size: 24px;
          font-weight: 800;
          color: #10b981;
        }

        .prod-actions {
          display: flex;
          gap: 10px;
        }

        .prod-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .prod-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .prod-btn-primary:hover {
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transform: translateY(-2px);
        }

        .prod-btn-secondary {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .prod-btn-secondary:hover {
          background: #dcfce7;
        }

        .prod-btn-success {
          background: #10b981;
          color: white;
        }

        .prod-btn-success:hover {
          background: #059669;
          transform: translateY(-2px);
        }

        /* Empty State */
        .prod-empty {
          text-align: center;
          padding: 80px 40px;
          background: white;
          border-radius: 24px;
          border: 2px dashed #e2e8f0;
        }

        .prod-empty-icon {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: #94a3b8;
        }

        .prod-empty h3 {
          margin: 0;
          font-size: 22px;
          color: #334155;
        }

        .prod-empty p {
          margin: 8px 0 24px;
          color: #64748b;
        }

        .prod-clear-btn {
          padding: 14px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .prod-clear-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .prod-header-content {
            flex-direction: column;
            gap: 20px;
            padding: 20px;
            text-align: center;
          }

          .prod-header-left {
            flex-direction: column;
          }

          .prod-title {
            font-size: 24px;
          }

          .prod-add-btn {
            width: 100%;
            justify-content: center;
          }

          .prod-filters-section {
            padding: 20px;
          }

          .prod-filter-row {
            flex-direction: column;
            align-items: stretch;
          }

          .prod-categories {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 10px;
          }

          .prod-cat-btn {
            white-space: nowrap;
          }

          .prod-view-toggle {
            align-self: flex-end;
          }

          .prod-content {
            padding: 20px;
          }

          .prod-grid.grid {
            grid-template-columns: 1fr;
          }

          .prod-grid.list .prod-card {
            flex-direction: column;
          }

          .prod-grid.list .prod-card-image {
            width: 100%;
            border-radius: 20px 20px 0 0;
          }

          .prod-card-footer {
            flex-direction: column;
            align-items: stretch;
          }

          .prod-actions {
            width: 100%;
          }

          .prod-btn {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductListing;

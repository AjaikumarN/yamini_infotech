import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const data = await apiRequest(`/api/products/${id}`);
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsageTag = (usageType) => {
    const tags = {
      office: { label: '🏢 Office Use', color: '#007bff' },
      school: { label: '🎓 School/College', color: '#28a745' },
      shop: { label: '🏪 Shop/Business', color: '#ffc107' },
      home: { label: '🏠 Home Use', color: '#17a2b8' }
    };
    return tags[usageType] || { label: usageType, color: '#6c757d' };
  };

  const parseSpecifications = (specs) => {
    if (!specs) return null;
    try {
      return typeof specs === 'string' ? JSON.parse(specs) : specs;
    } catch {
      return null;
    }
  };

  if (loading) {
    return <div className="loading-state">⏳ Loading product details...</div>;
  }

  if (!product) {
    return (
      <div className="error-state">
        <h2>❌ Product not found</h2>
        <button onClick={() => navigate('/products')}>← Back to Products</button>
      </div>
    );
  }

  const usageTag = getUsageTag(product.usage_type);
  const specifications = parseSpecifications(product.specifications);

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button onClick={() => navigate('/products')}>← Back to Products</button>
        </div>

        <div className="product-detail-container">
          {/* Product Image Section */}
          <div className="image-section">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="main-image" />
            ) : (
              <div className="placeholder-image">
                <span>🖨️</span>
              </div>
            )}
            <div
              className="usage-badge"
              style={{ background: usageTag.color }}
            >
              {usageTag.label}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="info-section">
            <h1>{product.name}</h1>
            <p className="brand">By {product.brand || 'Premium Brand'}</p>

            {product.price && (
              <div className="price-section">
                <span className="price-label">Starting Price</span>
                <div className="price">₹{product.price.toLocaleString()}</div>
                <span className="price-note">*Price may vary based on configuration</span>
              </div>
            )}

            <div className="quick-info">
              <div className="info-item">
                <span className="label">Category:</span>
                <span className="value">{product.category || 'General'}</span>
              </div>
              <div className="info-item">
                <span className="label">Model:</span>
                <span className="value">{product.model || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Stock Status:</span>
                <span className={`value ${product.stock_quantity > 0 ? 'in-stock' : 'out-stock'}`}>
                  {product.stock_quantity > 0 ? '✅ In Stock' : '❌ Out of Stock'}
                </span>
              </div>
            </div>

            <div className="description-section">
              <h3>📝 Description</h3>
              <p>{product.description || 'No description available'}</p>
            </div>

            {product.features && (
              <div className="features-section">
                <h3>⭐ Key Features</h3>
                <ul>
                  {product.features.split('\n').filter(f => f.trim()).map((feature, idx) => (
                    <li key={idx}>{feature.trim()}</li>
                  ))}
                </ul>
              </div>
            )}

            {specifications && (
              <div className="specifications-section">
                <h3>🔧 Technical Specifications</h3>
                <table className="specs-table">
                  <tbody>
                    {Object.entries(specifications).map(([key, value]) => (
                      <tr key={key}>
                        <td className="spec-label">{key}</td>
                        <td className="spec-value">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="action-buttons">
              <button
                className="btn-enquire"
                onClick={() => navigate(`/enquiry/${product.id}`)}
              >
                📞 Enquire Now
              </button>
              <button
                className="btn-call"
                onClick={() => window.location.href = 'tel:+911234567890'}
              >
                📱 Call Us
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .product-detail-page {
          min-height: 100vh;
          background: #f8f9fa;
          padding: 30px 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .breadcrumb {
          margin-bottom: 25px;
        }

        .breadcrumb button {
          background: white;
          border: 2px solid #ddd;
          padding: 10px 20px;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
          color: #667eea;
          transition: all 0.3s;
        }

        .breadcrumb button:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .product-detail-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .image-section {
          position: relative;
        }

        .main-image {
          width: 100%;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .placeholder-image {
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 120px;
        }

        .usage-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .info-section h1 {
          margin: 0 0 10px 0;
          font-size: 32px;
          color: #1a1a1a;
        }

        .brand {
          color: #667eea;
          font-weight: 700;
          font-size: 18px;
          margin: 0 0 25px 0;
        }

        .price-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }

        .price-label {
          display: block;
          color: #666;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .price {
          font-size: 36px;
          font-weight: 700;
          color: #28a745;
          margin: 5px 0;
        }

        .price-note {
          display: block;
          color: #999;
          font-size: 12px;
          margin-top: 5px;
        }

        .quick-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-item .label {
          font-weight: 600;
          color: #666;
        }

        .info-item .value {
          color: #1a1a1a;
          font-weight: 600;
        }

        .info-item .value.in-stock {
          color: #28a745;
        }

        .info-item .value.out-stock {
          color: #dc3545;
        }

        .description-section,
        .features-section,
        .specifications-section {
          margin-bottom: 25px;
        }

        .description-section h3,
        .features-section h3,
        .specifications-section h3 {
          font-size: 20px;
          margin: 0 0 15px 0;
          color: #1a1a1a;
        }

        .description-section p {
          color: #666;
          line-height: 1.8;
          margin: 0;
        }

        .features-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .features-section li {
          color: #666;
          line-height: 2;
          padding-left: 10px;
        }

        .features-section li::marker {
          color: #667eea;
        }

        .specs-table {
          width: 100%;
          border-collapse: collapse;
        }

        .specs-table tr {
          border-bottom: 1px solid #e0e0e0;
        }

        .specs-table tr:last-child {
          border-bottom: none;
        }

        .specs-table td {
          padding: 12px 0;
        }

        .spec-label {
          font-weight: 600;
          color: #666;
          width: 40%;
        }

        .spec-value {
          color: #1a1a1a;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          margin-top: 30px;
        }

        .btn-enquire,
        .btn-call {
          flex: 1;
          padding: 16px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-enquire {
          background: #667eea;
          color: white;
        }

        .btn-enquire:hover {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-call {
          background: #28a745;
          color: white;
        }

        .btn-call:hover {
          background: #218838;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
        }

        .loading-state,
        .error-state {
          text-align: center;
          padding: 100px 20px;
        }

        .loading-state {
          font-size: 24px;
          color: #666;
        }

        .error-state h2 {
          color: #dc3545;
          margin-bottom: 20px;
        }

        .error-state button {
          padding: 12px 30px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 968px) {
          .product-detail-container {
            grid-template-columns: 1fr;
            gap: 30px;
            padding: 20px;
          }

          .info-section h1 {
            font-size: 24px;
          }

          .price {
            font-size: 28px;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetail;

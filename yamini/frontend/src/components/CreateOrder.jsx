import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const CreateOrder = ({ enquiry, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    enquiry_id: enquiry.id,
    quantity: 1,
    discount_percent: 0,
    expected_delivery_date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (enquiry.product_id) {
      fetchProduct();
    }
  }, [enquiry.product_id]);

  const fetchProduct = async () => {
    try {
      const productData = await apiRequest(`/api/products/${enquiry.product_id}`);
      setProduct(productData);
    } catch (err) {
      console.error('Failed to fetch product:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const orderData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        discount_percent: parseFloat(formData.discount_percent) || 0,
        expected_delivery_date: formData.expected_delivery_date || null
      };

      const result = await apiRequest('/api/orders/', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      onSuccess && onSuccess(result);
      onClose && onClose();
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const subtotal = product.price * formData.quantity;
    const discount = (subtotal * formData.discount_percent) / 100;
    return subtotal - discount;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🛒 Create Order</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-alert">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Customer Info - Readonly */}
            <div className="form-group full-width">
              <label>Customer Name</label>
              <input
                type="text"
                value={enquiry.customer_name}
                readOnly
                className="readonly-input"
              />
            </div>

            {/* Product Info - Readonly */}
            <div className="form-group full-width">
              <label>Product</label>
              <input
                type="text"
                value={product ? `${product.name} - ${product.model || ''}` : 'Loading...'}
                readOnly
                className="readonly-input"
              />
            </div>

            {/* Unit Price - Display Only */}
            {product && (
              <div className="form-group">
                <label>Unit Price</label>
                <input
                  type="text"
                  value={`₹${product.price.toLocaleString()}`}
                  readOnly
                  className="readonly-input"
                />
              </div>
            )}

            {/* Quantity */}
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            {/* Discount */}
            <div className="form-group">
              <label>Discount Requested (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
              />
            </div>

            {/* Expected Delivery */}
            <div className="form-group">
              <label>Expected Delivery Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
              />
            </div>

            {/* Total Calculation */}
            {product && (
              <div className="form-group full-width total-display">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>₹{(product.price * formData.quantity).toLocaleString()}</span>
                </div>
                {formData.discount_percent > 0 && (
                  <div className="total-row discount">
                    <span>Discount ({formData.discount_percent}%):</span>
                    <span>-₹{((product.price * formData.quantity * formData.discount_percent) / 100).toLocaleString()}</span>
                  </div>
                )}
                <div className="total-row grand-total">
                  <span>Total Amount:</span>
                  <span>₹{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes or special requests..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '⏳ Creating...' : '✅ Create Order'}
            </button>
          </div>
        </form>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal-content {
            background: white;
            border-radius: 12px;
            max-width: 700px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 25px;
            border-bottom: 2px solid #f0f0f0;
          }

          .modal-header h2 {
            margin: 0;
            color: #1a1a1a;
            font-size: 24px;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 32px;
            cursor: pointer;
            color: #999;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.3s;
          }

          .close-btn:hover {
            background: #f0f0f0;
            color: #666;
          }

          .error-alert {
            margin: 20px 25px 0;
            padding: 15px;
            background: #fff5f5;
            border-left: 4px solid #dc3545;
            border-radius: 8px;
            color: #dc3545;
            font-weight: 600;
          }

          form {
            padding: 25px;
          }

          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
          }

          .form-group.full-width {
            grid-column: 1 / -1;
          }

          .form-group label {
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
            font-size: 14px;
          }

          .form-group input,
          .form-group textarea {
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s;
          }

          .form-group input:focus,
          .form-group textarea:focus {
            border-color: #667eea;
            outline: none;
          }

          .readonly-input {
            background: #f8f9fa !important;
            color: #666 !important;
            cursor: not-allowed;
          }

          .total-display {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 10px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 15px;
          }

          .total-row.discount {
            color: #28a745;
          }

          .total-row.grand-total {
            border-top: 2px solid #e0e0e0;
            padding-top: 15px;
            margin-top: 10px;
            font-size: 18px;
            font-weight: 700;
            color: #667eea;
          }

          .modal-footer {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            padding-top: 20px;
            border-top: 2px solid #f0f0f0;
          }

          .btn-primary,
          .btn-secondary {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 15px;
            transition: all 0.3s;
          }

          .btn-primary {
            background: #667eea;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: #5568d3;
            transform: translateY(-2px);
          }

          .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-secondary {
            background: #f0f0f0;
            color: #666;
          }

          .btn-secondary:hover {
            background: #e0e0e0;
          }

          @media (max-width: 576px) {
            .form-grid {
              grid-template-columns: 1fr;
            }

            .modal-footer {
              flex-direction: column;
            }

            .btn-primary,
            .btn-secondary {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default CreateOrder;

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { showToast } from '../components/ToastNotification';
import ActionButton from '../../components/shared/dashboard/ActionButton';
import DataCard from '../../components/shared/dashboard/DataCard';
import '../styles/salesman.css';

/**
 * Create Order Page - Full page form for creating orders from enquiries
 */
export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const enquiryId = searchParams.get('enquiry_id');

  const [enquiry, setEnquiry] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    enquiry_id: enquiryId || '',
    quantity: 1,
    discount_percent: 0,
    expected_delivery_date: '',
    notes: ''
  });

  useEffect(() => {
    if (enquiryId) {
      loadEnquiry();
    } else {
      setLoading(false);
    }
  }, [enquiryId]);

  const loadEnquiry = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/enquiries/${enquiryId}`);
      setEnquiry(data);
      setFormData(prev => ({ ...prev, enquiry_id: data.id }));
      
      if (data.product_id) {
        const productData = await apiRequest(`/api/products/${data.product_id}`);
        setProduct(productData);
      }
    } catch (error) {
      console.error('Failed to load enquiry:', error);
      showToast && showToast('Failed to load enquiry details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.enquiry_id) {
        showToast && showToast('Please select or provide an enquiry', 'warning');
        return;
      }

      const orderData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        discount_percent: parseFloat(formData.discount_percent) || 0,
        expected_delivery_date: formData.expected_delivery_date 
          ? new Date(formData.expected_delivery_date).toISOString() 
          : null
      };

      await apiRequest('/api/orders/', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      showToast && showToast('✅ Order created successfully!', 'success');
      navigate('/salesman/orders');
    } catch (error) {
      console.error('Failed to create order:', error);
      
      // Show specific error messages
      if (error.message?.includes('Order already exists')) {
        showToast && showToast('An order already exists for this enquiry. View it in your orders list.', 'warning');
      } else if (error.message?.includes('Insufficient stock')) {
        showToast && showToast('Insufficient stock available for this product', 'error');
      } else if (error.message?.includes('not found')) {
        showToast && showToast('Enquiry or product not found', 'error');
      } else {
        showToast && showToast('Failed to create order. Please check your input.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#6B7280' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
            Create New Order
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            {enquiry ? `From: ${enquiry.customer_name}` : 'Log a new order'}
          </p>
        </div>
        <ActionButton 
          variant="secondary"
          icon="arrow_back"
          onClick={() => navigate(-1)}
        >
          Back
        </ActionButton>
      </div>

      {/* Order Form */}
      <DataCard title="Order Details" subtitle="Fill in the order information" noPadding>
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Customer & Product Info */}
            {enquiry && (
              <div style={{ 
                padding: '16px', 
                borderRadius: '8px', 
                background: '#F3F4F6',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Customer</label>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '4px 0 0 0' }}>
                      {enquiry.customer_name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                      {enquiry.phone}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Product</label>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '4px 0 0 0' }}>
                      {product ? product.name : 'Not specified'}
                    </p>
                    {product && (
                      <p style={{ fontSize: '12px', color: '#059669', margin: '2px 0 0 0' }}>
                        ₹{product.price?.toLocaleString() || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                Quantity <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                placeholder="Enter quantity"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Discount Percent */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                Discount (%) <span style={{ color: '#9CA3AF' }}>Optional</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                placeholder="Enter discount percentage"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                Expected Delivery Date <span style={{ color: '#9CA3AF' }}>Optional</span>
              </label>
              <input
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                Additional Notes <span style={{ color: '#9CA3AF' }}>Optional</span>
              </label>
              <textarea
                rows="4"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes about this order..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  background: submitting ? '#D1D5DB' : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {submitting ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </form>
      </DataCard>
    </div>
  );
}

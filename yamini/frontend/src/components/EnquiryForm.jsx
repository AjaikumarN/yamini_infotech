import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const EnquiryForm = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    company_name: '',
    address: '',
    enquiry_details: '',
    preferred_contact_time: '',
    source: 'website'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const data = await apiRequest(`/api/products/${productId}`);
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.enquiry_details.trim()) {
      newErrors.enquiry_details = 'Please tell us about your requirement';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customer_name: formData.customer_name,
        phone: formData.phone,
        email: formData.email || null,
        product_id: productId ? parseInt(productId) : null,
        product_interest: product ? product.name : null,
        description: formData.enquiry_details,
        notes: formData.address ? `Address: ${formData.address}\nCompany: ${formData.company_name || 'N/A'}` : null,
        source: 'website',
        priority: 'HOT' // New enquiries from website start as HOT
      };

      await apiRequest('/api/enquiries/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSubmitted(true);
      
      // Redirect to success page after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error('Failed to submit enquiry:', error);
      alert('Failed to submit enquiry. Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="success-page">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h1>Thank You!</h1>
          <p>Your enquiry has been submitted successfully.</p>
          <p className="info-text">
            Our team will contact you within 24 hours.
          </p>
          <div className="reference-info">
            <p>You will receive a confirmation message shortly.</p>
          </div>
          <button onClick={() => navigate('/')} className="btn-home">
            Return to Home
          </button>
        </div>

        <style>{`
          .success-page {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .success-card {
            background: white;
            padding: 60px 40px;
            border-radius: 16px;
            text-align: center;
            max-width: 500px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }

          .success-icon {
            font-size: 80px;
            margin-bottom: 20px;
          }

          .success-card h1 {
            color: #28a745;
            margin: 0 0 15px 0;
            font-size: 36px;
          }

          .success-card p {
            color: #666;
            font-size: 18px;
            margin: 0 0 10px 0;
          }

          .info-text {
            font-weight: 600;
            color: #667eea;
            margin-bottom: 25px;
          }

          .reference-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
          }

          .reference-info p {
            margin: 0;
            font-size: 14px;
            color: #666;
          }

          .btn-home {
            padding: 14px 40px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
          }

          .btn-home:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="enquiry-form-page">
      <div className="container">
        <div className="breadcrumb">
          <button onClick={() => navigate(-1)}>← Back</button>
        </div>

        <div className="enquiry-container">
          {/* Left Panel - Product Info */}
          {product && (
            <div className="product-summary">
              <h3>📋 Enquiry For</h3>
              <div className="product-card">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} />
                ) : (
                  <div className="placeholder-img">🖨️</div>
                )}
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="brand">{product.brand}</p>
                  {product.price && (
                    <p className="price">₹{product.price.toLocaleString()}</p>
                  )}
                </div>
              </div>
              
              <div className="contact-info">
                <h4>📞 Need Immediate Help?</h4>
                <p>Call us at: <strong>+91 123-456-7890</strong></p>
                <p>Email: <strong>sales@company.com</strong></p>
              </div>
            </div>
          )}

          {/* Right Panel - Form */}
          <div className="form-section">
            <h1>Get a Quote</h1>
            <p className="subtitle">Fill out the form and our team will get back to you within 24 hours</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={errors.customer_name ? 'error' : ''}
                />
                {errors.customer_name && (
                  <span className="error-message">{errors.customer_name}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && (
                    <span className="error-message">{errors.phone}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && (
                    <span className="error-message">{errors.email}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Company / Organization Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group">
                  <label>Preferred Contact Time</label>
                  <select
                    name="preferred_contact_time"
                    value={formData.preferred_contact_time}
                    onChange={handleChange}
                  >
                    <option value="">Anytime</option>
                    <option value="morning">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                    <option value="evening">Evening (4 PM - 7 PM)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address / Location</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Your address for service delivery"
                />
              </div>

              <div className="form-group">
                <label>
                  Your Requirements <span className="required">*</span>
                </label>
                <textarea
                  name="enquiry_details"
                  value={formData.enquiry_details}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Tell us about your requirements, quantity needed, expected timeline, etc."
                  className={errors.enquiry_details ? 'error' : ''}
                />
                {errors.enquiry_details && (
                  <span className="error-message">{errors.enquiry_details}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? '⏳ Submitting...' : '📤 Submit Enquiry'}
              </button>

              <p className="privacy-note">
                🔒 Your information is safe with us. We respect your privacy.
              </p>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .enquiry-form-page {
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

        .enquiry-container {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 30px;
        }

        .product-summary {
          background: white;
          padding: 25px;
          border-radius: 12px;
          height: fit-content;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .product-summary h3 {
          margin: 0 0 20px 0;
          color: #1a1a1a;
          font-size: 18px;
        }

        .product-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          text-align: center;
        }

        .product-card img {
          width: 100%;
          max-width: 200px;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .placeholder-img {
          font-size: 80px;
          margin-bottom: 15px;
        }

        .product-info h4 {
          margin: 0 0 5px 0;
          color: #1a1a1a;
        }

        .brand {
          color: #667eea;
          font-weight: 600;
          margin: 0 0 10px 0;
        }

        .price {
          font-size: 24px;
          font-weight: 700;
          color: #28a745;
          margin: 0;
        }

        .contact-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }

        .contact-info h4 {
          margin: 0 0 15px 0;
          color: #1a1a1a;
        }

        .contact-info p {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
        }

        .contact-info strong {
          color: #1a1a1a;
        }

        .form-section {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .form-section h1 {
          margin: 0 0 10px 0;
          color: #1a1a1a;
          font-size: 32px;
        }

        .subtitle {
          color: #666;
          margin: 0 0 30px 0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .required {
          color: #dc3545;
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.3s;
        }

        input:focus,
        select:focus,
        textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        input.error,
        textarea.error {
          border-color: #dc3545;
        }

        .error-message {
          display: block;
          color: #dc3545;
          font-size: 12px;
          margin-top: 5px;
        }

        .btn-submit {
          width: 100%;
          padding: 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 10px;
        }

        .btn-submit:hover:not(:disabled) {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .privacy-note {
          text-align: center;
          color: #999;
          font-size: 13px;
          margin: 15px 0 0 0;
        }

        @media (max-width: 968px) {
          .enquiry-container {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-section {
            padding: 25px;
          }

          .form-section h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default EnquiryForm;

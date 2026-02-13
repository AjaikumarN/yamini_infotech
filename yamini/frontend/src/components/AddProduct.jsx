import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';
import { API_BASE_URL } from '../config';

const AddProduct = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEdit = Boolean(productId);

  const [formData, setFormData] = useState({
    // Basic Details
    name: '',
    brand: '',
    category: 'Printers & Copiers',
    model_number: '',
    product_type: 'B&W',
    description: '',
    
    // Pricing
    price_type: 'FIXED',
    price: '',
    
    // Usage & Target
    usage_type: 'office',
    ideal_for: '',
    recommended_usage: '',
    
    // Specifications
    specifications: {
      print_speed: '',
      paper_size: 'A4',
      connectivity: '',
      duplex: false,
    },
    
    // Warranty & Service
    warranty_period: '',
    installation_support: false,
    amc_available: false,
    
    // Internal (Admin/Office Staff only)
    purchase_cost: '',
    vendor_name: '',
    stock_quantity: 0,
    internal_notes: '',
    
    // Status
    status: 'Active',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [productPhoto, setProductPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    fetchPermissions();
    if (isEdit) {
      fetchProduct();
    }
  }, [productId]);

  const fetchPermissions = async () => {
    try {
      const data = await apiRequest('/api/products/permissions/check');
      setPermissions(data.permissions || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const product = await apiRequest(`/api/products/${productId}`);
      
      // Parse specifications safely
      let specs = formData.specifications;
      if (product.specifications) {
        const parsedSpecs = typeof product.specifications === 'string' 
          ? JSON.parse(product.specifications) 
          : product.specifications;
        specs = {
          print_speed: parsedSpecs.print_speed || '',
          paper_size: parsedSpecs.paper_size || 'A4',
          connectivity: parsedSpecs.connectivity || '',
          duplex: parsedSpecs.duplex || false,
        };
      }
      
      // Ensure all string fields have empty string instead of null
      const sanitizedProduct = {
        name: product.name || '',
        brand: product.brand || '',
        category: product.category || 'Printers & Copiers',
        model_number: product.model_number || '',
        product_type: product.product_type || 'B&W',
        description: product.description || '',
        price_type: product.price_type || 'FIXED',
        price: product.price || '',
        usage_type: product.usage_type || 'office',
        ideal_for: product.ideal_for || '',
        recommended_usage: product.recommended_usage || '',
        warranty_period: product.warranty_period || '',
        installation_support: product.installation_support || false,
        amc_available: product.amc_available || false,
        status: product.status || 'Active',
        specifications: specs,
        purchase_cost: '',
        vendor_name: '',
        stock_quantity: 0,
        internal_notes: '',
      };
      
      setFormData({
        ...formData,
        ...sanitizedProduct,
      });

      // Fetch internal data if user has permission
      if (permissions.includes('VIEW_INTERNAL_DATA')) {
        const internalData = await apiRequest(`/api/products/${productId}/internal`);
        const sanitizedInternal = {
          purchase_cost: internalData.purchase_cost || '',
          vendor_name: internalData.vendor_name || '',
          stock_quantity: internalData.stock_quantity || 0,
          internal_notes: internalData.internal_notes || '',
        };
        setFormData(prev => ({ ...prev, ...sanitizedInternal }));
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product details');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('spec_')) {
      const specKey = name.replace('spec_', '');
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProductImage(null);
    setImagePreview(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setProductPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setProductPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
      };

      let savedProductId;
      if (isEdit) {
        await apiRequest(`/api/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        savedProductId = productId;
        alert('Product updated successfully!');
      } else {
        const responseData = await apiRequest('/api/products/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        savedProductId = responseData.id;
        alert('Product created successfully!');
      }

      // Upload image if selected
      if (productImage && savedProductId) {
        const imageFormData = new FormData();
        imageFormData.append('file', productImage);
        imageFormData.append('is_primary', 'true');
        
        try {
          await apiRequest(`/api/products/${savedProductId}/images`, {
            method: 'POST',
            body: imageFormData,
            isFormData: true,
          });
          console.log('Image uploaded successfully');
        } catch (imgError) {
          console.error('Failed to upload image:', imgError);
          alert('⚠️ Product saved but image upload failed');
        }
      }

      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      // Handle validation errors that come as arrays
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          setError(detail.map(err => err.msg).join(', '));
        } else if (typeof detail === 'string') {
          setError(detail);
        } else {
          setError('Failed to save product');
        }
      } else {
        setError('Failed to save product');
      }
    } finally {
      setLoading(false);
    }
  };

  // Admin has god mode - no permission checks needed
  // Removed permission restrictions for admin

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>{isEdit ? '✏️ Edit Product' : '➕ Add New Product'}</h1>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Back
        </button>
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Basic Product Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>1️⃣ Basic Product Details</h2>
          
          {/* Product Image Upload */}
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Product Image</label>
            <div style={{
              border: '2px dashed #ced4da',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              position: 'relative'
            }}>
              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={imagePreview} 
                    alt="Product preview" 
                    style={{
                      maxWidth: '300px',
                      maxHeight: '300px',
                      borderRadius: '8px',
                      objectFit: 'contain'
                    }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
                  <p style={{ color: '#6c757d', marginBottom: '10px' }}>
                    Click to upload product image (Max 5MB)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    id="product-image-upload"
                  />
                  <label
                    htmlFor="product-image-upload"
                    style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Choose Image
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="e.g., Konica Minolta Bizhub C226i"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand || ''}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., Konica Minolta"
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Category *</label>
              <select name="category" value={formData.category || 'Printers & Copiers'} onChange={handleChange} style={styles.input} required>
                <option value="Printers & Copiers">Printers & Copiers</option>
                <option value="Scanners">Scanners</option>
                <option value="MFP">Multifunction Printer (MFP)</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Model Number</label>
              <input
                type="text"
                name="model_number"
                value={formData.model_number || ''}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., C226i"
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Product Type</label>
              <select name="product_type" value={formData.product_type || 'B&W'} onChange={handleChange} style={styles.input}>
                <option value="B&W">Black & White</option>
                <option value="Color">Color</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows="4"
              style={styles.textarea}
              placeholder="Enter detailed product description..."
            />
          </div>
        </div>

        {/* Product Photo Upload */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2️⃣ Product Photo</h2>
          
          <div style={styles.photoUploadContainer}>
            {photoPreview ? (
              <div style={styles.photoPreviewWrapper}>
                <img 
                  src={photoPreview} 
                  alt="Product preview" 
                  style={styles.photoPreview}
                />
                <button 
                  type="button" 
                  onClick={removePhoto}
                  style={styles.removePhotoBtn}
                >
                  ✕ Remove
                </button>
              </div>
            ) : (
              <label style={styles.photoDropzone}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                <div style={styles.photoDropzoneContent}>
                  <div style={styles.photoIcon}>📷</div>
                  <div style={styles.photoText}>Click to upload product photo</div>
                  <div style={styles.photoHint}>PNG, JPG up to 5MB</div>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Product Specifications */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3️⃣ Product Specifications</h2>
          
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Print Speed (PPM)</label>
              <input
                type="text"
                name="spec_print_speed"
                value={formData.specifications.print_speed || ''}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., 22 ppm"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Paper Size</label>
              <select name="spec_paper_size" value={formData.specifications.paper_size || 'A4'} onChange={handleChange} style={styles.input}>
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Both">A3 & A4</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Connectivity</label>
              <input
                type="text"
                name="spec_connectivity"
                value={formData.specifications.connectivity || ''}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., USB, LAN, Wi-Fi"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="spec_duplex"
                  checked={formData.specifications.duplex}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                Duplex Printing
              </label>
            </div>
          </div>
        </div>

        {/* Usage & Target */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>4️⃣ Usage & Target</h2>
          
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Ideal For *</label>
              <select name="usage_type" value={formData.usage_type || 'office'} onChange={handleChange} style={styles.input} required>
                <option value="office">🏢 Office</option>
                <option value="school">🎓 School</option>
                <option value="shop">🏪 Shop</option>
                <option value="home">🏠 Home</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Recommended Usage (Optional)</label>
              <input
                type="text"
                name="recommended_usage"
                value={formData.recommended_usage || ''}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., Up to 5000 pages/month"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Availability */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>5️⃣ Pricing & Availability</h2>
          
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Price Type *</label>
              <select name="price_type" value={formData.price_type || 'FIXED'} onChange={handleChange} style={styles.input} required>
                <option value="FIXED">Fixed Price</option>
                <option value="REQUEST">Price on Request</option>
              </select>
            </div>

            {formData.price_type === 'FIXED' && (
              <div style={styles.field}>
                <label style={styles.label}>Selling Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., 150000"
                  required={formData.price_type === 'FIXED'}
                />
              </div>
            )}
          </div>
        </div>

        {/* Warranty & Service */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>6️⃣ Warranty & Service</h2>
          
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Warranty Period</label>
              <input
                type="text"
                name="warranty_period"
                value={formData.warranty_period || ''}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., 1 Year"
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="installation_support"
                  checked={formData.installation_support}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                Installation Support Available
              </label>
            </div>

            <div style={styles.field}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="amc_available"
                  checked={formData.amc_available}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                AMC Available
              </label>
            </div>
          </div>
        </div>

        {/* Internal Data (Admin/Office Staff only) */}
        {permissions.includes('VIEW_INTERNAL_DATA') && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>8️⃣ Internal Data (Confidential)</h2>
            
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Purchase Cost (₹)</label>
                <input
                  type="number"
                  name="purchase_cost"
                  value={formData.purchase_cost || ''}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., 120000"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Vendor Name</label>
                <input
                  type="text"
                  name="vendor_name"
                  value={formData.vendor_name || ''}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., ABC Distributors"
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Stock Quantity</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity || 0}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., 5"
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Internal Notes</label>
              <textarea
                name="internal_notes"
                value={formData.internal_notes || ''}
                onChange={handleChange}
                rows="3"
                style={styles.textarea}
                placeholder="Internal remarks (not visible to customers)..."
              />
            </div>
          </div>
        )}

        {/* Publish Control */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>9️⃣ Publish Control</h2>
          
          <div style={styles.field}>
            <label style={styles.label}>Product Status *</label>
            <select name="status" value={formData.status || 'Active'} onChange={handleChange} style={styles.input} required>
              <option value="Draft">Draft (Not Visible to Customers)</option>
              <option value="Active">Published (Visible to Customers)</option>
            </select>
          </div>
        </div>

        {/* Submit Buttons */}
        <div style={styles.actions}>
          <button type="button" onClick={() => navigate(-1)} style={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
  },
  section: {
    marginBottom: '40px',
    paddingBottom: '30px',
    borderBottom: '2px solid #e9ecef',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '8px',
  },
  input: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    transition: 'border-color 0.3s',
  },
  textarea: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#495057',
  },
  checkbox: {
    marginRight: '10px',
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-end',
    marginTop: '30px',
  },
  cancelBtn: {
    padding: '12px 30px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '12px 30px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    padding: '40px',
    textAlign: 'center',
    color: '#dc3545',
  },
  errorAlert: {
    padding: '15px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '6px',
    marginBottom: '20px',
  },
  photoUploadContainer: {
    marginBottom: '20px',
  },
  photoPreviewWrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  photoPreview: {
    width: '200px',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '12px',
    border: '2px solid #e9ecef',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    padding: '6px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  photoDropzone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '200px',
    height: '200px',
    border: '2px dashed #ced4da',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    backgroundColor: '#f8f9fa',
  },
  photoDropzoneContent: {
    textAlign: 'center',
  },
  photoIcon: {
    fontSize: '40px',
    marginBottom: '10px',
  },
  photoText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '5px',
  },
  photoHint: {
    fontSize: '12px',
    color: '#6c757d',
  },
};

export default AddProduct;

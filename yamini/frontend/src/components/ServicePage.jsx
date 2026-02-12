import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

export default function ServicePage() {
  // ==================== STATE MANAGEMENT ====================
  const [currentStep, setCurrentStep] = useState(0); // 0=intent, 1=form, 2=success
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: '',
    machine_model: '',
    priority: 'normal',
    description: '',
    toner_quantity: '',
    exchange_reason: '',
    amc_id: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Track Service State
  const [trackMode, setTrackMode] = useState(false);
  const [trackInput, setTrackInput] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ==================== SERVICE TYPES ====================
  const serviceTypes = [
    { 
      id: 'repair', 
      title: 'Repair / Breakdown', 
      icon: '🔧',
      description: 'Machine not working or error messages'
    },
    { 
      id: 'toner', 
      title: 'Toner / Consumables', 
      icon: '🖨️',
      description: 'Need toner, drum, or supplies'
    },
    { 
      id: 'installation', 
      title: 'Installation / Relocation', 
      icon: '📦',
      description: 'Install new machine or move existing'
    },
    { 
      id: 'exchange', 
      title: 'Exchange Machine', 
      icon: '🔄',
      description: 'Replace with different model'
    },
    { 
      id: 'amc_support', 
      title: 'AMC Support', 
      icon: '✅',
      description: 'Annual maintenance contract service'
    },
    { 
      id: 'chatbot', 
      title: 'Not Sure?', 
      icon: '❓',
      description: 'Talk to our support assistant'
    }
  ];

  // ==================== FORM HANDLERS ====================
  const handleServiceSelect = (service) => {
    if (service.id === 'chatbot') {
      // Stub: Open chatbot widget
      alert('Chatbot integration coming soon! Please call +91-XXXXXXXXXX for immediate assistance.');
      return;
    }
    setSelectedService(service);
    setCurrentStep(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    if (!formData.machine_model.trim()) {
      newErrors.machine_model = 'Machine model is required';
    }

    // Conditional validation
    if (selectedService.id !== 'toner' && !formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (selectedService.id === 'toner' && !formData.toner_quantity.trim()) {
      newErrors.toner_quantity = 'Quantity is required';
    }

    if (selectedService.id === 'exchange' && !formData.exchange_reason.trim()) {
      newErrors.exchange_reason = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the errors', 'error');
      return;
    }

    setLoading(true);

    try {
      // Build payload
      const priorityMap = {
        'normal': 'NORMAL',
        'high': 'URGENT',
        'emergency': 'CRITICAL'
      };

      const payload = {
        service_type: selectedService.id,
        customer_name: formData.customer_name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        machine_model: formData.machine_model,
        priority: priorityMap[formData.priority] || 'NORMAL',
        fault_description: selectedService.id === 'toner' 
          ? `Toner request - Quantity: ${formData.toner_quantity}`
          : formData.description
      };

      // Add conditional fields to description
      if (selectedService.id === 'exchange') {
        payload.fault_description += `\nExchange Reason: ${formData.exchange_reason}`;
      }
      if (selectedService.id === 'amc_support' && formData.amc_id) {
        payload.fault_description += `\nAMC ID: ${formData.amc_id}`;
      }

      const response = await apiRequest('/api/service-requests/public', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setTicketData(response);
      setCurrentStep(2);
      showToast('Service request created successfully!', 'success');
    } catch (error) {
      console.error('Failed to create service request:', error);
      showToast(error.message || 'Failed to create request. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setSelectedService(null);
    setFormData({
      customer_name: '',
      phone: '',
      email: '',
      address: '',
      machine_model: '',
      priority: 'normal',
      description: '',
      toner_quantity: '',
      exchange_reason: '',
      amc_id: ''
    });
    setErrors({});
    setTicketData(null);
  };

  // ==================== TRACK SERVICE ====================
  const handleTrackService = async (e) => {
    e.preventDefault();
    
    if (!trackInput.trim()) {
      showToast('Please enter ticket ID or phone number', 'error');
      return;
    }

    setTrackLoading(true);
    setTrackResult(null);

    try {
      // Use the new tracking endpoint with identifier (ticket_no or phone)
      const response = await apiRequest(`/api/service-requests/track/${encodeURIComponent(trackInput.trim())}`);
      setTrackResult(response);
    } catch (error) {
      console.error('Failed to track service:', error);
      showToast(error.message || 'Service not found. Please check your ticket ID or phone number.', 'error');
    } finally {
      setTrackLoading(false);
    }
  };

  // ==================== TOAST NOTIFICATION ====================
  const showToast = (message, type = 'info') => {
    // Simple toast implementation (can be replaced with react-toastify)
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 12px;
      color: white;
      font-weight: 700;
      z-index: 99999;
      animation: slideIn 0.3s ease;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 
                   type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                   'linear-gradient(135deg, #3b82f6, #2563eb)'};
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // ==================== STYLES ====================
  const styles = {
    pageWrapper: {
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f0f4ff 0%, #e0e7ff 100%)',
      padding: isMobile ? '20px' : '40px 20px'
    },
    container: {
      maxWidth: '900px',
      margin: '0 auto'
    },
    header: {
      textAlign: 'center',
      marginBottom: isMobile ? '30px' : '40px'
    },
    title: {
      fontSize: isMobile ? '28px' : '36px',
      fontWeight: 900,
      color: '#1e293b',
      marginBottom: '12px'
    },
    subtitle: {
      fontSize: isMobile ? '14px' : '16px',
      color: '#64748b',
      lineHeight: 1.6
    },
    progressBar: {
      display: 'flex',
      justifyContent: 'center',
      gap: isMobile ? '8px' : '12px',
      marginBottom: isMobile ? '24px' : '32px'
    },
    progressStep: (active) => ({
      width: isMobile ? '60px' : '80px',
      height: '4px',
      borderRadius: '999px',
      background: active ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : '#cbd5e1',
      transition: 'all 0.3s ease'
    }),
    serviceGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: isMobile ? '12px' : '16px',
      marginBottom: '32px'
    },
    serviceCard: {
      background: 'white',
      borderRadius: '16px',
      padding: isMobile ? '20px' : '24px',
      border: '2px solid #e2e8f0',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    },
    formCard: {
      background: 'white',
      borderRadius: '20px',
      padding: isMobile ? '24px' : '32px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: 700,
      color: '#475569',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '10px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      color: '#1e293b',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '10px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      color: '#1e293b',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '10px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      color: '#1e293b',
      background: 'white',
      cursor: 'pointer',
      fontFamily: 'inherit'
    },
    error: {
      color: '#ef4444',
      fontSize: '13px',
      marginTop: '6px',
      fontWeight: 600
    },
    button: (variant = 'primary') => ({
      padding: isMobile ? '14px 24px' : '16px 32px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: 800,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
      background: variant === 'primary' 
        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
        : variant === 'secondary'
        ? 'white'
        : 'linear-gradient(135deg, #10b981, #059669)',
      color: variant === 'secondary' ? '#475569' : 'white',
      border: variant === 'secondary' ? '2px solid #e2e8f0' : 'none'
    }),
    successCard: {
      background: 'white',
      borderRadius: '20px',
      padding: isMobile ? '32px 24px' : '48px 32px',
      textAlign: 'center',
      boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0'
    },
    ticketBox: {
      background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      border: '2px solid #86efac',
      borderRadius: '16px',
      padding: isMobile ? '20px' : '24px',
      margin: '24px 0'
    },
    trackSection: {
      background: 'white',
      borderRadius: '20px',
      padding: isMobile ? '24px' : '32px',
      marginTop: '32px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0'
    },
    statusTimeline: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '16px' : '8px',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '24px'
    },
    statusStep: (active, completed) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      flex: 1,
      position: 'relative'
    }),
    statusDot: (active, completed) => ({
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: completed || active 
        ? 'linear-gradient(135deg, #10b981, #059669)' 
        : '#e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      color: 'white',
      fontWeight: 900,
      boxShadow: completed || active ? '0 4px 20px rgba(16,185,129,0.3)' : 'none'
    }),
    statusLine: (completed) => ({
      height: isMobile ? '40px' : '2px',
      width: isMobile ? '2px' : '100%',
      background: completed ? 'linear-gradient(90deg, #10b981, #059669)' : '#e2e8f0',
      flex: isMobile ? 'none' : 1
    })
  };

  // ==================== RENDER ====================
  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.title}>🔧 Service Request Center</h1>
          <p style={styles.subtitle}>
            Fast, reliable service for your office equipment. We respond within 2 working hours.
          </p>
        </div>

        {/* PROGRESS INDICATOR */}
        {currentStep > 0 && (
          <div style={styles.progressBar}>
            <div style={styles.progressStep(currentStep >= 1)} />
            <div style={styles.progressStep(currentStep >= 2)} />
          </div>
        )}

        {/* STEP 0: SERVICE TYPE CHOOSER */}
        {currentStep === 0 && (
          <>
            <h2 style={{ 
              fontSize: isMobile ? '20px' : '24px', 
              fontWeight: 800, 
              color: '#1e293b', 
              textAlign: 'center',
              marginBottom: '24px' 
            }}>
              How can we help you today?
            </h2>
            <div style={styles.serviceGrid}>
              {serviceTypes.map(service => (
                <div
                  key={service.id}
                  style={styles.serviceCard}
                  onClick={() => handleServiceSelect(service)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(99,102,241,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                    {service.icon}
                  </div>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 800, 
                    color: '#1e293b', 
                    marginBottom: '8px' 
                  }}>
                    {service.title}
                  </h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#64748b', 
                    margin: 0,
                    lineHeight: 1.5
                  }}>
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* STEP 1: SERVICE REQUEST FORM */}
        {currentStep === 1 && (
          <div style={styles.formCard}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '32px' }}>{selectedService.icon}</span>
              <div>
                <h2 style={{ 
                  fontSize: isMobile ? '20px' : '24px', 
                  fontWeight: 800, 
                  color: '#1e293b',
                  margin: 0
                }}>
                  {selectedService.title}
                </h2>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#64748b',
                  margin: '4px 0 0 0'
                }}>
                  Fill in the details below and we'll get back to you soon
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* CUSTOMER INFO */}
              <div style={{ 
                marginBottom: '24px',
                paddingBottom: '24px',
                borderBottom: '2px solid #f1f5f9'
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 800, 
                  color: '#475569',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  📋 Customer Information
                </h3>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Name *</label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    style={{
                      ...styles.input,
                      borderColor: errors.customer_name ? '#ef4444' : '#e2e8f0'
                    }}
                    placeholder="Enter your full name"
                  />
                  {errors.customer_name && (
                    <div style={styles.error}>{errors.customer_name}</div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      style={{
                        ...styles.input,
                        borderColor: errors.phone ? '#ef4444' : '#e2e8f0'
                      }}
                      placeholder="10 digit mobile"
                      maxLength="10"
                    />
                    {errors.phone && (
                      <div style={styles.error}>{errors.phone}</div>
                    )}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    style={styles.textarea}
                    placeholder="Your office/home address"
                    rows="2"
                  />
                </div>
              </div>

              {/* MACHINE INFO */}
              <div style={{ 
                marginBottom: '24px',
                paddingBottom: '24px',
                borderBottom: '2px solid #f1f5f9'
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 800, 
                  color: '#475569',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  🖨️ Machine Details
                </h3>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Machine Model *</label>
                  <input
                    type="text"
                    name="machine_model"
                    value={formData.machine_model}
                    onChange={handleInputChange}
                    style={{
                      ...styles.input,
                      borderColor: errors.machine_model ? '#ef4444' : '#e2e8f0'
                    }}
                    placeholder="e.g., Bizhub 227, Ricoh MP 301"
                  />
                  {errors.machine_model && (
                    <div style={styles.error}>{errors.machine_model}</div>
                  )}
                </div>
              </div>

              {/* SERVICE DETAILS */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 800, 
                  color: '#475569',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  🔧 Service Details
                </h3>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="normal">Normal - Within 2 days</option>
                    <option value="high">High - Within 1 day</option>
                    <option value="emergency">Emergency - Same day</option>
                  </select>
                </div>

                {/* CONDITIONAL FIELDS */}
                {selectedService.id === 'toner' ? (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Toner Quantity *</label>
                    <input
                      type="text"
                      name="toner_quantity"
                      value={formData.toner_quantity}
                      onChange={handleInputChange}
                      style={{
                        ...styles.input,
                        borderColor: errors.toner_quantity ? '#ef4444' : '#e2e8f0'
                      }}
                      placeholder="e.g., 2 black, 1 color"
                    />
                    {errors.toner_quantity && (
                      <div style={styles.error}>{errors.toner_quantity}</div>
                    )}
                  </div>
                ) : (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      {selectedService.id === 'exchange' ? 'Problem with Current Machine *' : 'Problem Description *'}
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      style={{
                        ...styles.textarea,
                        borderColor: errors.description ? '#ef4444' : '#e2e8f0'
                      }}
                      placeholder="Describe the issue in detail..."
                      rows="4"
                    />
                    {errors.description && (
                      <div style={styles.error}>{errors.description}</div>
                    )}
                  </div>
                )}

                {selectedService.id === 'exchange' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Reason for Exchange *</label>
                    <input
                      type="text"
                      name="exchange_reason"
                      value={formData.exchange_reason}
                      onChange={handleInputChange}
                      style={{
                        ...styles.input,
                        borderColor: errors.exchange_reason ? '#ef4444' : '#e2e8f0'
                      }}
                      placeholder="e.g., Frequent breakdowns, outdated"
                    />
                    {errors.exchange_reason && (
                      <div style={styles.error}>{errors.exchange_reason}</div>
                    )}
                  </div>
                )}

                {selectedService.id === 'amc_support' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>AMC ID (if available)</label>
                    <input
                      type="text"
                      name="amc_id"
                      value={formData.amc_id}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="Your AMC contract ID"
                    />
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  style={{
                    ...styles.button('secondary'),
                    flex: isMobile ? 'none' : '1'
                  }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.button('primary'),
                    flex: isMobile ? 'none' : '2',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Request →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: SUCCESS CONFIRMATION */}
        {currentStep === 2 && ticketData && (
          <div style={styles.successCard}>
            <div style={{ 
              fontSize: '64px',
              marginBottom: '16px'
            }}>
              ✅
            </div>
            <h2 style={{ 
              fontSize: isMobile ? '24px' : '28px',
              fontWeight: 900,
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              Service Request Created!
            </h2>
            <p style={{ 
              fontSize: '16px',
              color: '#64748b',
              marginBottom: '24px'
            }}>
              We've received your request and will contact you shortly
            </p>

            <div style={styles.ticketBox}>
              <div style={{ 
                fontSize: '14px',
                fontWeight: 700,
                color: '#166534',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                Your Ticket ID
              </div>
              <div style={{ 
                fontSize: isMobile ? '24px' : '32px',
                fontWeight: 900,
                color: '#15803d',
                fontFamily: 'monospace',
                letterSpacing: '2px'
              }}>
                {ticketData.ticket_no || `SR-${ticketData.id}`}
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              border: '2px solid #93c5fd',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px',
              marginBottom: '32px'
            }}>
              <div style={{ 
                fontSize: '14px',
                fontWeight: 700,
                color: '#1e40af',
                marginBottom: '8px'
              }}>
                ⏱️ Expected Response Time
              </div>
              <div style={{ 
                fontSize: '16px',
                color: '#1e3a8a',
                fontWeight: 600
              }}>
                Within 2 working hours
              </div>
            </div>

            <div style={{ 
              fontSize: '14px',
              color: '#64748b',
              marginBottom: '24px',
              lineHeight: 1.6
            }}>
              Our team will review your request and contact you at<br/>
              <strong style={{ color: '#1e293b' }}>{formData.phone}</strong>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '12px',
              justifyContent: 'center',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={() => {
                  setTrackInput(ticketData.ticket_no || `SR-${ticketData.id}`);
                  setTrackMode(true);
                }}
                style={styles.button('success')}
              >
                🔍 Track Service
              </button>
              <button
                onClick={resetForm}
                style={styles.button('secondary')}
              >
                Create Another Request
              </button>
            </div>
          </div>
        )}

        {/* TRACK SERVICE SECTION */}
        {(currentStep === 0 || trackMode) && (
          <div style={styles.trackSection}>
            <h2 style={{ 
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: 800,
              color: '#1e293b',
              textAlign: 'center',
              marginBottom: '8px'
            }}>
              🔍 Track Your Service
            </h2>
            <p style={{ 
              fontSize: '14px',
              color: '#64748b',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              Enter your ticket ID or phone number to check status
            </p>

            <form onSubmit={handleTrackService}>
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <input
                  type="text"
                  value={trackInput}
                  onChange={(e) => setTrackInput(e.target.value)}
                  style={{
                    ...styles.input,
                    flex: isMobile ? 'none' : '1'
                  }}
                  placeholder="Enter ticket ID (SR-XXXXX) or phone"
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  style={{
                    ...styles.button('primary'),
                    flex: 'none',
                    opacity: trackLoading ? 0.7 : 1,
                    cursor: trackLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {trackLoading ? 'Searching...' : 'Track'}
                </button>
              </div>
            </form>

            {/* TRACK RESULT */}
            {trackResult && (
              <div style={{ 
                marginTop: '32px',
                padding: isMobile ? '20px' : '24px',
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                borderRadius: '16px',
                border: '2px solid #e2e8f0'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '20px',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '12px' : '0'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '4px'
                    }}>
                      Ticket ID
                    </div>
                    <div style={{ 
                      fontSize: '20px',
                      fontWeight: 900,
                      color: '#1e293b',
                      fontFamily: 'monospace'
                    }}>
                      {trackResult.ticket_no || `SR-${trackResult.id}`}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background: trackResult.status === 'COMPLETED' 
                      ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)'
                      : trackResult.status === 'IN_PROGRESS'
                      ? 'linear-gradient(135deg, #e0e7ff, #c7d2fe)'
                      : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    color: '#1e293b',
                    fontWeight: 800,
                    fontSize: '14px'
                  }}>
                    {trackResult.status}
                  </div>
                </div>

                {/* STATUS TIMELINE */}
                <div style={styles.statusTimeline}>
                  {[
                    { key: 'NEW', label: 'Received', icon: '📝' },
                    { key: 'ASSIGNED', label: 'Assigned', icon: '👤' },
                    { key: 'IN_PROGRESS', label: 'In Progress', icon: '🔧' },
                    { key: 'COMPLETED', label: 'Completed', icon: '✅' }
                  ].map((step, index, array) => {
                    const statusOrder = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
                    const currentIndex = statusOrder.indexOf(trackResult.status);
                    const stepIndex = statusOrder.indexOf(step.key);
                    
                    // Special handling for ASSIGNED step - show as completed if assigned_to exists
                    let isActive = stepIndex === currentIndex;
                    let isCompleted = stepIndex < currentIndex;
                    
                    if (step.key === 'ASSIGNED' && trackResult.assigned_to && trackResult.status === 'NEW') {
                      // Service is assigned but status is still NEW
                      isCompleted = true;
                      isActive = false;
                    }

                    return (
                      <React.Fragment key={step.key}>
                        <div style={styles.statusStep(isActive, isCompleted)}>
                          <div style={styles.statusDot(isActive, isCompleted)}>
                            {isCompleted ? '✓' : step.icon}
                          </div>
                          <div style={{ 
                            fontSize: '12px',
                            fontWeight: 700,
                            color: isActive || isCompleted ? '#1e293b' : '#94a3b8',
                            textAlign: 'center'
                          }}>
                            {step.label}
                          </div>
                        </div>
                        {index < array.length - 1 && (
                          <div style={styles.statusLine(isCompleted)} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* ADDITIONAL INFO */}
                <div style={{ 
                  marginTop: '24px',
                  padding: '16px',
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: '16px'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#64748b',
                        marginBottom: '4px'
                      }}>
                        Customer
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1e293b'
                      }}>
                        {trackResult.customer_name}
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#64748b',
                        marginBottom: '4px'
                      }}>
                        Machine
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1e293b'
                      }}>
                        {trackResult.machine_model}
                      </div>
                    </div>
                    {trackResult.assigned_engineer && (
                      <div>
                        <div style={{ 
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#64748b',
                          marginBottom: '4px'
                        }}>
                          Engineer
                        </div>
                        <div style={{ 
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#1e293b'
                        }}>
                          {trackResult.assigned_engineer.name}
                        </div>
                      </div>
                    )}
                    <div>
                      <div style={{ 
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#64748b',
                        marginBottom: '4px'
                      }}>
                        Last Updated
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1e293b'
                      }}>
                        {new Date(trackResult.updated_at || trackResult.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SLA PROMISE */}
                <div style={{ 
                  marginTop: '16px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#78350f',
                  textAlign: 'center'
                }}>
                  ⏱️ We aim to complete all service requests within 24-48 hours
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* INLINE CSS FOR ANIMATIONS */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

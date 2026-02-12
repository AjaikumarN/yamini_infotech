import React, { useState, useEffect } from 'react'
import { useNotifications } from '../contexts/NotificationContext.jsx'
import { productAPI, bookingAPI, complaintAPI } from '../utils/api'

export default function Customer() {
  const { addNotification, templates } = useNotifications()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    machinesOwned: [],
    serviceHistory: []
  })

  const [formData, setFormData] = useState({
    type: '', // 'service', 'complaint', 'enquiry'
    machine: '',
    description: '',
    preferredDate: '',
    urgency: 'normal'
  })

  // Fetch products and services from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, servicesData] = await Promise.all([
          productAPI.getAll(),
          productAPI.getServices()
        ])
        setProducts(productsData)
        setServices(servicesData)
      } catch (error) {
        console.error('Error fetching data:', error)
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load products and services',
          priority: 'high',
          module: 'Customer'
        })
      }
    }
    fetchData()
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    // Simple mock login
    setIsLoggedIn(true)
    setShowLoginForm(false)
    setCustomerData({
      name: 'John Doe',
      phone: '+91 98765 43210',
      email: 'john@example.com',
      address: '123 Main Street, Bangalore - 560001',
      machinesOwned: ['HP LaserJet Pro M404dn', 'Canon PIXMA G3000'],
      serviceHistory: [
        { date: '2025-11-15', service: 'Maintenance & Cleaning', status: 'Completed' },
        { date: '2025-10-05', service: 'Repair Service', status: 'Completed' }
      ]
    })
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setActiveSection('home')
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (formData.type === 'service') {
        // Submit booking via API
        const booking = await bookingAPI.create({
          service_name: formData.machine,
          description: formData.description,
          preferred_date: formData.preferredDate,
          urgency: formData.urgency
        })
        addNotification(templates.bookingConfirmed(booking.booking_id, formData.machine))
      } else if (formData.type === 'complaint') {
        // Submit complaint via API
        const complaint = await complaintAPI.create({
          machine_model: formData.machine,
          fault_description: formData.description,
          priority: formData.urgency === 'urgent' ? 'High' : 'Medium'
        })
        addNotification(templates.complaintRaised(complaint.ticket_no, 'Technical Issue'))
      } else {
        addNotification({
          type: 'info',
          title: '✅ Enquiry Submitted',
          message: `Your enquiry has been received. Our team will respond within 24 hours.`,
          priority: 'medium',
          module: 'Customer',
          actionUrl: '/customer'
        })
      }
      
      setFormData({ type: '', machine: '', description: '', preferredDate: '', urgency: 'normal' })
      setActiveSection('home')
    } catch (error) {
      console.error('Submission error:', error)
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error.message || 'Failed to submit request',
        priority: 'high',
        module: 'Customer'
      })
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    switch(activeSection) {
      case 'printers':
        return (
          <div className="section-content">
            <h2>Available Printers</h2>
            {loading ? <p>Loading products...</p> : (
              <div className="cards-grid">
                {products.map(product => (
                  <div key={product.id} className="card">
                    <h3>{product.name}</h3>
                    <p><strong>Category:</strong> {product.category}</p>
                    <p><strong>Price:</strong> ₹{product.price}</p>
                    {product.description && <p>{product.description}</p>}
                    <button className="btn-primary">Request Quote</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'services':
        return (
          <div className="section-content">
            <h2>Our Services</h2>
            {loading ? (
              <p>Loading services...</p>
            ) : (
              <div className="cards-grid">
                {services.map(service => (
                  <div key={service.id} className="card">
                    <h3>{service.name}</h3>
                    <p><strong>Price:</strong> ₹{service.price}</p>
                    <p><strong>Duration:</strong> {service.duration}</p>
                    {service.description && <p>{service.description}</p>}
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setFormData({ ...formData, type: 'service' })
                        setActiveSection('bookService')
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'bookService':
        return (
          <div className="section-content">
            <h2>Book a Service</h2>
            <form onSubmit={handleFormSubmit} className="form-container">
              <div className="form-group">
                <label>Service Type:</label>
                <select value={formData.machine} onChange={(e) => setFormData({...formData, machine: e.target.value})} required>
                  <option value="">Select Service</option>
                  {sampleServices.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Your Machine:</label>
                <input type="text" value={formData.machine} onChange={(e) => setFormData({...formData, machine: e.target.value})} placeholder="e.g., HP LaserJet Pro" />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="4" placeholder="Describe the issue or service needed..." required></textarea>
              </div>
              <div className="form-group">
                <label>Preferred Date:</label>
                <input type="date" value={formData.preferredDate} onChange={(e) => setFormData({...formData, preferredDate: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Urgency:</label>
                <select value={formData.urgency} onChange={(e) => setFormData({...formData, urgency: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Submit Booking</button>
            </form>
          </div>
        )

      case 'complaint':
        return (
          <div className="section-content">
            <h2>Raise a Complaint</h2>
            <form onSubmit={handleFormSubmit} className="form-container">
              <div className="form-group">
                <label>Machine/Service:</label>
                <input type="text" value={formData.machine} onChange={(e) => setFormData({...formData, machine: e.target.value, type: 'complaint'})} placeholder="Product or service" required />
              </div>
              <div className="form-group">
                <label>Complaint Details:</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="5" placeholder="Describe your complaint in detail..." required></textarea>
              </div>
              <div className="form-group">
                <label>Priority:</label>
                <select value={formData.urgency} onChange={(e) => setFormData({...formData, urgency: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Submit Complaint</button>
            </form>
          </div>
        )

      case 'enquiry':
        return (
          <div className="section-content">
            <h2>Enquire / Request Quote</h2>
            <form onSubmit={handleFormSubmit} className="form-container">
              <div className="form-group">
                <label>Product/Service:</label>
                <input type="text" value={formData.machine} onChange={(e) => setFormData({...formData, machine: e.target.value, type: 'enquiry'})} placeholder="What are you interested in?" required />
              </div>
              <div className="form-group">
                <label>Details:</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="5" placeholder="Provide details about your requirement..." required></textarea>
              </div>
              <div className="form-group">
                <label>Quantity (if applicable):</label>
                <input type="number" placeholder="1" min="1" />
              </div>
              <button type="submit" className="btn-primary">Send Enquiry</button>
            </form>
          </div>
        )

      case 'profile':
        if (!isLoggedIn) {
          return <div className="section-content"><p>Please login to view your profile.</p></div>
        }
        return (
          <div className="section-content">
            <h2>My Profile</h2>
            <div className="profile-info">
              <div className="info-section">
                <h3>Personal Information</h3>
                <p><strong>Name:</strong> {customerData.name}</p>
                <p><strong>Phone:</strong> {customerData.phone}</p>
                <p><strong>Email:</strong> {customerData.email}</p>
                <p><strong>Address:</strong> {customerData.address}</p>
              </div>
              
              <div className="info-section">
                <h3>Machines Owned</h3>
                {customerData.machinesOwned.length > 0 ? (
                  <ul>
                    {customerData.machinesOwned.map((machine, idx) => (
                      <li key={idx}>{machine}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No machines registered</p>
                )}
              </div>

              <div className="info-section">
                <h3>Service History</h3>
                {customerData.serviceHistory.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Service</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerData.serviceHistory.map((history, idx) => (
                        <tr key={idx}>
                          <td>{history.date}</td>
                          <td>{history.service}</td>
                          <td><span className={`status ${history.status.toLowerCase()}`}>{history.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No service history</p>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="section-content">
            <h2>Welcome to Customer Portal</h2>
            <p className="welcome-text">
              Explore our products and services, book service appointments, raise complaints, 
              or request quotes for your printing needs.
            </p>
            <div className="feature-cards">
              <div className="feature-card" onClick={() => setActiveSection('printers')}>
                <h3>🖨️ View Printers</h3>
                <p>Browse our range of printers</p>
              </div>
              <div className="feature-card" onClick={() => setActiveSection('services')}>
                <h3>🔧 View Services</h3>
                <p>Check our service offerings</p>
              </div>
              <div className="feature-card" onClick={() => setActiveSection('bookService')}>
                <h3>📅 Book Service</h3>
                <p>Schedule a service appointment</p>
              </div>
              <div className="feature-card" onClick={() => setActiveSection('complaint')}>
                <h3>⚠️ Raise Complaint</h3>
                <p>Report an issue</p>
              </div>
              <div className="feature-card" onClick={() => setActiveSection('enquiry')}>
                <h3>💬 Enquire</h3>
                <p>Request a quote</p>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="page-container customer-portal">
      <div className="content-wrapper">
        <div className="page-header">
          <h1 className="page-title">Customer Portal</h1>
          <div className="header-actions">
            {isLoggedIn ? (
              <>
                <button className="btn-secondary" onClick={() => setActiveSection('profile')}>
                  My Profile
                </button>
                <button className="btn-secondary" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="btn-primary" onClick={() => setShowLoginForm(!showLoginForm)}>
                {showLoginForm ? 'Close' : 'Login'}
              </button>
            )}
          </div>
        </div>

        {showLoginForm && !isLoggedIn && (
          <div className="login-form-container">
            <form onSubmit={handleLogin} className="login-form">
              <h3>Customer Login</h3>
              <div className="form-group">
                <label>Email/Phone:</label>
                <input type="text" placeholder="Enter email or phone" required />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input type="password" placeholder="Enter password" required />
              </div>
              <button type="submit" className="btn-primary">Login</button>
              <p className="form-note">Don't have an account? Continue as guest or contact us to register.</p>
            </form>
          </div>
        )}

        <div className="navigation-tabs">
          <button className={activeSection === 'home' ? 'active' : ''} onClick={() => setActiveSection('home')}>Home</button>
          <button className={activeSection === 'printers' ? 'active' : ''} onClick={() => setActiveSection('printers')}>Printers</button>
          <button className={activeSection === 'services' ? 'active' : ''} onClick={() => setActiveSection('services')}>Services</button>
          <button className={activeSection === 'bookService' ? 'active' : ''} onClick={() => setActiveSection('bookService')}>Book Service</button>
          <button className={activeSection === 'complaint' ? 'active' : ''} onClick={() => setActiveSection('complaint')}>Complaint</button>
          <button className={activeSection === 'enquiry' ? 'active' : ''} onClick={() => setActiveSection('enquiry')}>Enquiry</button>
        </div>

        <div className="page-content">
          {renderContent()}
        </div>
      </div>

      <style>{`
        .customer-portal {
          min-height: 100vh;
          padding: 20px;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .btn-primary, .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .login-form-container {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          max-width: 400px;
        }

        .login-form h3 {
          margin-top: 0;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-note {
          font-size: 12px;
          color: #666;
          margin-top: 10px;
        }

        .navigation-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }

        .navigation-tabs button {
          padding: 10px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }

        .navigation-tabs button:hover {
          background: #f0f0f0;
        }

        .navigation-tabs button.active {
          border-bottom-color: #007bff;
          color: #007bff;
          font-weight: 600;
        }

        .section-content {
          background: white;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .section-content h2 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #007bff;
          padding-bottom: 10px;
        }

        .welcome-text {
          font-size: 16px;
          color: #555;
          margin: 20px 0;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          transition: transform 0.3s;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .card h3 {
          margin-top: 0;
          color: #007bff;
        }

        .feature-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }

        .feature-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          border-radius: 10px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }

        .feature-card:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }

        .feature-card h3 {
          margin-top: 0;
          font-size: 20px;
        }

        .form-container {
          max-width: 600px;
          margin-top: 20px;
        }

        .profile-info {
          margin-top: 20px;
        }

        .info-section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .info-section h3 {
          margin-top: 0;
          color: #007bff;
          border-bottom: 2px solid #007bff;
          padding-bottom: 8px;
        }

        .info-section p {
          margin: 10px 0;
        }

        .info-section ul {
          list-style: none;
          padding: 0;
        }

        .info-section ul li {
          padding: 8px;
          background: white;
          margin: 5px 0;
          border-radius: 4px;
          border-left: 3px solid #007bff;
          padding-left: 15px;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          background: white;
        }

        .data-table th,
        .data-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .data-table th {
          background: #007bff;
          color: white;
          font-weight: 600;
        }

        .data-table tr:hover {
          background: #f8f9fa;
        }

        .status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .status.completed {
          background: #d4edda;
          color: #155724;
        }

        .status.pending {
          background: #fff3cd;
          color: #856404;
        }

        @media (max-width: 768px) {
          .cards-grid,
          .feature-cards {
            grid-template-columns: 1fr;
          }

          .navigation-tabs {
            overflow-x: auto;
            flex-wrap: nowrap;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

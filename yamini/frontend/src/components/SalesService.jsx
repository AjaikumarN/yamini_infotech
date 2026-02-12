import React, { useState, useEffect } from 'react'
import { useNotifications } from '../contexts/NotificationContext.jsx'
import { salesAPI } from '../utils/api'

export default function Salesman() {
  const { addNotification, templates } = useNotifications()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [salesmanName] = useState('Amit Singh') // Mock logged-in salesman
  const [loading, setLoading] = useState(true)
  
  const [dailyTarget] = useState(10) // Daily call target
  const [todayCalls, setTodayCalls] = useState([])
  const [attendance, setAttendance] = useState(null)
  const [shopVisits, setShopVisits] = useState([])
  
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  
  const [attendanceData, setAttendanceData] = useState({
    photo: null,
    location: '',
    time: '',
    photoPreview: null
  })
  
  const [visitData, setVisitData] = useState({
    shopName: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    requirement: '',
    expectedClosing: '',
    followUpDate: '',
    visitType: 'New',
    notes: ''
  })
  
  const [callData, setCallData] = useState({
    customerName: '',
    phone: '',
    callType: 'Follow-up',
    duration: '',
    outcome: '',
    notes: '',
    nextAction: ''
  })

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [callsData, attendanceData] = await Promise.all([
          salesAPI.getMyCalls(true),
          salesAPI.getMyAttendance(true)
        ])
        
        setTodayCalls(callsData || [])
        if (attendanceData && attendanceData.length > 0) {
          setAttendance(attendanceData[0])
        }
      } catch (error) {
        console.error('Error fetching sales data:', error)
        // Use mock data as fallback
        const today = new Date().toISOString().split('T')[0]
        setAttendance({
          date: today,
          time: '09:30 AM',
          location: 'Bangalore, Karnataka',
          status: 'Present'
        })
        setTodayCalls([
          { id: 1, customer_name: 'Rajesh Kumar', phone: '+91 98765 43210', call_time: '10:00 AM', outcome: 'Interested', next_action: 'Send quote' }
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Check if report submitted
  const isReportSubmitted = () => {
    const today = new Date().toISOString().split('T')[0]
    return attendance && attendance.date === today && shopVisits.some(v => v.date === today)
  }

  // Simulate notification to reception if not submitted
  useEffect(() => {
    const checkReportSubmission = () => {
      const currentHour = new Date().getHours()
      if (currentHour >= 18 && !isReportSubmitted()) {
        addNotification(templates.missedReport(salesmanName, 'daily activity'))
      }
    }
    checkReportSubmission()
  }, [attendance, shopVisits])

  // Monitor target progress
  useEffect(() => {
    const callProgress = (todayCalls.length / dailyTarget) * 100
    
    // Notifications for target milestones
    if (callProgress === 50 && todayCalls.length > 0) {
      addNotification(templates.salesTarget(salesmanName, '50'))
    } else if (callProgress === 100) {
      addNotification({
        type: 'success',
        title: '🎉 Target Achieved!',
        message: `${salesmanName} has achieved today's sales target (${todayCalls.length}/${dailyTarget} calls)`,
        priority: 'medium',
        module: 'Sales',
        actionUrl: '/employee/salesman'
      })
    }
  }, [todayCalls.length])

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Get current location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          const now = new Date()
          
          const attendancePayload = {
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            location: attendanceData.location || location,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            status: 'Present'
          }
          
          await salesAPI.markAttendance(attendancePayload)
          
          setAttendance({
            date: now.toISOString().split('T')[0],
            ...attendancePayload,
            photo: attendanceData.photoPreview
          })
          
          setShowAttendanceModal(false)
          setAttendanceData({ photo: null, location: '', time: '', photoPreview: null })
          addNotification({
            type: 'success',
            title: 'Attendance Marked',
            message: 'Your attendance has been recorded successfully',
            priority: 'low',
            module: 'Sales'
          })
          setLoading(false)
        },
        async (error) => {
          // Fallback if location not available
          const now = new Date()
          const attendancePayload = {
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            location: attendanceData.location || 'Location not available',
            status: 'Present'
          }
          
          await salesAPI.markAttendance(attendancePayload)
          
          setAttendance({
            date: now.toISOString().split('T')[0],
            ...attendancePayload,
            photo: attendanceData.photoPreview
          })
          setShowAttendanceModal(false)
          setAttendanceData({ photo: null, location: '', time: '', photoPreview: null })
          addNotification({
            type: 'success',
            title: 'Attendance Marked',
            message: 'Your attendance has been recorded successfully',
            priority: 'low',
            module: 'Sales'
          })
          alert('Attendance marked successfully!')
          setLoading(false)
        }
      )
    } catch (error) {
      console.error('Error marking attendance:', error)
      alert('Could not mark attendance. Please try again.')
      setLoading(false)
    }
  }

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAttendanceData({
          ...attendanceData,
          photo: file,
          photoPreview: reader.result
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCallSubmit = (e) => {
    e.preventDefault()
    const now = new Date()
    const newCall = {
      id: todayCalls.length + 1,
      customer: callData.customerName,
      phone: callData.phone,
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      outcome: callData.outcome,
      nextAction: callData.nextAction,
      callType: callData.callType,
      duration: callData.duration,
      notes: callData.notes
    }
    
    setTodayCalls([...todayCalls, newCall])
    setShowCallModal(false)
    setCallData({
      customerName: '',
      phone: '',
      callType: 'Follow-up',
      duration: '',
      outcome: '',
      notes: '',
      nextAction: ''
    })
    alert('Call logged successfully!')
  }

  const handleVisitSubmit = (e) => {
    e.preventDefault()
    const today = new Date().toISOString().split('T')[0]
    
    const newVisit = {
      id: shopVisits.length + 1,
      date: today,
      shopName: visitData.shopName,
      customerName: visitData.customerName,
      customerPhone: visitData.customerPhone,
      customerEmail: visitData.customerEmail,
      requirement: visitData.requirement,
      expectedClosing: visitData.expectedClosing,
      followUpDate: visitData.followUpDate,
      visitType: visitData.visitType,
      status: calculateStatus(visitData.expectedClosing),
      notes: visitData.notes
    }
    
    setShopVisits([...shopVisits, newVisit])
    setShowVisitModal(false)
    setVisitData({
      shopName: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      requirement: '',
      expectedClosing: '',
      followUpDate: '',
      visitType: 'New',
      notes: ''
    })
    addNotification({
      type: 'success',
      title: '✓ Report Submitted',
      message: `Shop visit report for ${visitData.customerName} submitted to Reception`,
      priority: 'medium',
      module: 'Sales',
      actionUrl: '/employee/salesman'
    })
  }

  const calculateStatus = (expectedClosing) => {
    const days = Math.ceil((new Date(expectedClosing) - new Date()) / (1000 * 60 * 60 * 24))
    if (days <= 7) return 'Hot'
    if (days <= 30) return 'Warm'
    return 'Cold'
  }

  const renderDashboard = () => {
    const callProgress = (todayCalls.length / dailyTarget) * 100
    const today = new Date().toISOString().split('T')[0]
    const todayVisits = shopVisits.filter(v => v.date === today).length

    return (
      <div className="dashboard">
        <div className="welcome-card">
          <h2>👋 Welcome, {salesmanName}!</h2>
          <p>Track your daily activities and achieve your targets</p>
        </div>

        {!attendance && (
          <div className="alert-card warning">
            <strong>⚠️ Attendance Not Marked!</strong>
            <p>Please mark your attendance to start the day</p>
            <button className="btn-primary" onClick={() => setShowAttendanceModal(true)}>
              Mark Attendance Now
            </button>
          </div>
        )}

        {!isReportSubmitted() && new Date().getHours() >= 17 && (
          <div className="alert-card danger">
            <strong>🔔 Report Submission Pending!</strong>
            <p>Please submit your daily report. Notification will be sent to reception if not submitted.</p>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📞</div>
            <div className="stat-content">
              <h3>Calls Today</h3>
              <div className="stat-number">{todayCalls.length}/{dailyTarget}</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${callProgress}%` }}></div>
              </div>
              <small>{callProgress.toFixed(0)}% of daily target</small>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">🏪</div>
            <div className="stat-content">
              <h3>Shop Visits</h3>
              <div className="stat-number">{todayVisits}</div>
              <small>Today's visits</small>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Attendance</h3>
              <div className="stat-number">{attendance ? 'Marked' : 'Pending'}</div>
              <small>{attendance ? attendance.time : 'Not marked yet'}</small>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>Follow-ups</h3>
              <div className="stat-number">
                {shopVisits.filter(v => new Date(v.followUpDate) <= new Date()).length}
              </div>
              <small>Pending today</small>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => setShowAttendanceModal(true)}>
              📸 Mark Attendance
            </button>
            <button className="action-btn" onClick={() => setShowCallModal(true)}>
              📞 Log Call
            </button>
            <button className="action-btn" onClick={() => setShowVisitModal(true)}>
              🏪 Add Shop Visit
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderCalls = () => {
    return (
      <div className="calls-section">
        <div className="section-header">
          <h2>📞 Today's Calls ({todayCalls.length}/{dailyTarget})</h2>
          <button className="btn-primary" onClick={() => setShowCallModal(true)}>
            + Log New Call
          </button>
        </div>

        {todayCalls.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Outcome</th>
                  <th>Next Action</th>
                </tr>
              </thead>
              <tbody>
                {todayCalls.map(call => (
                  <tr key={call.id}>
                    <td>{call.time}</td>
                    <td>{call.customer}</td>
                    <td>{call.phone}</td>
                    <td><span className="badge">{call.callType || 'Follow-up'}</span></td>
                    <td><span className={`badge outcome-${call.outcome.toLowerCase().replace(' ', '-')}`}>{call.outcome}</span></td>
                    <td>{call.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No calls logged yet today. Start making calls to reach your target!</p>
          </div>
        )}
      </div>
    )
  }

  const renderVisits = () => {
    return (
      <div className="visits-section">
        <div className="section-header">
          <h2>🏪 Shop Visit Reports</h2>
          <button className="btn-primary" onClick={() => setShowVisitModal(true)}>
            + Add Visit Report
          </button>
        </div>

        {shopVisits.length > 0 ? (
          <div className="visits-grid">
            {shopVisits.map(visit => (
              <div key={visit.id} className={`visit-card status-${visit.status.toLowerCase()}`}>
                <div className="visit-header">
                  <h3>{visit.shopName}</h3>
                  <span className={`status-badge ${visit.status.toLowerCase()}`}>{visit.status}</span>
                </div>
                <div className="visit-details">
                  <p><strong>Customer:</strong> {visit.customerName}</p>
                  <p><strong>Phone:</strong> {visit.customerPhone}</p>
                  <p><strong>Requirement:</strong> {visit.requirement}</p>
                  <p><strong>Expected Closing:</strong> {visit.expectedClosing}</p>
                  <p><strong>Follow-up Date:</strong> {visit.followUpDate}</p>
                  <p><strong>Visit Type:</strong> {visit.visitType}</p>
                  {visit.notes && <p><strong>Notes:</strong> {visit.notes}</p>}
                  <p className="visit-date"><small>Visited on: {visit.date}</small></p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No shop visits recorded yet.</p>
          </div>
        )}
      </div>
    )
  }

  const renderAttendance = () => {
    return (
      <div className="attendance-section">
        <div className="section-header">
          <h2>✅ Attendance</h2>
          {!attendance && (
            <button className="btn-primary" onClick={() => setShowAttendanceModal(true)}>
              Mark Attendance
            </button>
          )}
        </div>

        {attendance ? (
          <div className="attendance-card">
            <div className="attendance-photo">
              {attendance.photo ? (
                <img src={attendance.photo} alt="Attendance" />
              ) : (
                <div className="photo-placeholder">📸</div>
              )}
            </div>
            <div className="attendance-info">
              <h3>Attendance Marked ✓</h3>
              <div className="info-row">
                <strong>Date:</strong> {attendance.date}
              </div>
              <div className="info-row">
                <strong>Time:</strong> {attendance.time}
              </div>
              <div className="info-row">
                <strong>Location:</strong> {attendance.location}
              </div>
              <div className="info-row">
                <strong>Status:</strong> <span className="badge success">{attendance.status}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>⚠️ Attendance not marked for today</p>
            <button className="btn-primary" onClick={() => setShowAttendanceModal(true)}>
              Mark Attendance Now
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page-container salesman-module">
      <div className="content-wrapper">
        <div className="page-header">
          <div>
            <h1 className="page-title">👨‍💼 Salesman Dashboard</h1>
            <p className="page-subtitle">{salesmanName} - Daily Activity Tracker</p>
          </div>
          <div className="header-badge">
            {isReportSubmitted() ? (
              <span className="badge success">✓ Report Submitted</span>
            ) : (
              <span className="badge warning">⚠ Report Pending</span>
            )}
          </div>
        </div>

        <div className="tabs-navigation">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={activeTab === 'calls' ? 'active' : ''}
            onClick={() => setActiveTab('calls')}
          >
            📞 Calls ({todayCalls.length}/{dailyTarget})
          </button>
          <button 
            className={activeTab === 'visits' ? 'active' : ''}
            onClick={() => setActiveTab('visits')}
          >
            🏪 Shop Visits ({shopVisits.length})
          </button>
          <button 
            className={activeTab === 'attendance' ? 'active' : ''}
            onClick={() => setActiveTab('attendance')}
          >
            ✅ Attendance
          </button>
        </div>

        <div className="page-content">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'calls' && renderCalls()}
          {activeTab === 'visits' && renderVisits()}
          {activeTab === 'attendance' && renderAttendance()}
        </div>
      </div>

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="modal">
          <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>📸 Mark Attendance</h2>
              <button className="close-btn" onClick={() => setShowAttendanceModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAttendanceSubmit} className="modal-body">
              <div className="form-group">
                <label>Capture Photo *</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="user"
                  onChange={handlePhotoCapture}
                  required 
                />
                {attendanceData.photoPreview && (
                  <div className="photo-preview">
                    <img src={attendanceData.photoPreview} alt="Preview" />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Location (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Auto-detected or enter manually"
                  value={attendanceData.location}
                  onChange={(e) => setAttendanceData({...attendanceData, location: e.target.value})}
                />
                <small>Location will be auto-detected if available</small>
              </div>
              <button type="submit" className="btn-primary">Submit Attendance</button>
            </form>
          </div>
        </div>
      )}

      {/* Call Log Modal */}
      {showCallModal && (
        <div className="modal">
          <div className="modal-overlay" onClick={() => setShowCallModal(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>📞 Log Call</h2>
              <button className="close-btn" onClick={() => setShowCallModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCallSubmit} className="modal-body">
              <div className="form-group">
                <label>Customer Name *</label>
                <input 
                  type="text" 
                  value={callData.customerName}
                  onChange={(e) => setCallData({...callData, customerName: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input 
                  type="tel" 
                  value={callData.phone}
                  onChange={(e) => setCallData({...callData, phone: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Call Type *</label>
                <select 
                  value={callData.callType}
                  onChange={(e) => setCallData({...callData, callType: e.target.value})}
                >
                  <option value="Follow-up">Follow-up</option>
                  <option value="New Lead">New Lead</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Customer Service">Customer Service</option>
                </select>
              </div>
              <div className="form-group">
                <label>Call Duration (minutes)</label>
                <input 
                  type="number" 
                  value={callData.duration}
                  onChange={(e) => setCallData({...callData, duration: e.target.value})}
                  placeholder="5"
                />
              </div>
              <div className="form-group">
                <label>Outcome *</label>
                <select 
                  value={callData.outcome}
                  onChange={(e) => setCallData({...callData, outcome: e.target.value})}
                  required
                >
                  <option value="">Select outcome</option>
                  <option value="Interested">Interested</option>
                  <option value="Not interested">Not interested</option>
                  <option value="Meeting scheduled">Meeting scheduled</option>
                  <option value="Quote sent">Quote sent</option>
                  <option value="Follow-up required">Follow-up required</option>
                  <option value="No answer">No answer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Next Action *</label>
                <input 
                  type="text" 
                  value={callData.nextAction}
                  onChange={(e) => setCallData({...callData, nextAction: e.target.value})}
                  placeholder="e.g., Send quote, Schedule visit"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  value={callData.notes}
                  onChange={(e) => setCallData({...callData, notes: e.target.value})}
                  rows="3"
                  placeholder="Additional notes..."
                ></textarea>
              </div>
              <button type="submit" className="btn-primary">Log Call</button>
            </form>
          </div>
        </div>
      )}

      {/* Shop Visit Modal */}
      {showVisitModal && (
        <div className="modal">
          <div className="modal-overlay" onClick={() => setShowVisitModal(false)}></div>
          <div className="modal-content large">
            <div className="modal-header">
              <h2>🏪 Shop Visit Report</h2>
              <button className="close-btn" onClick={() => setShowVisitModal(false)}>✕</button>
            </div>
            <form onSubmit={handleVisitSubmit} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Shop Name *</label>
                  <input 
                    type="text" 
                    value={visitData.shopName}
                    onChange={(e) => setVisitData({...visitData, shopName: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Visit Type *</label>
                  <select 
                    value={visitData.visitType}
                    onChange={(e) => setVisitData({...visitData, visitType: e.target.value})}
                  >
                    <option value="New">New</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Service">Service</option>
                    <option value="Demo">Demo</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input 
                    type="text" 
                    value={visitData.customerName}
                    onChange={(e) => setVisitData({...visitData, customerName: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Customer Phone *</label>
                  <input 
                    type="tel" 
                    value={visitData.customerPhone}
                    onChange={(e) => setVisitData({...visitData, customerPhone: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Customer Email</label>
                <input 
                  type="email" 
                  value={visitData.customerEmail}
                  onChange={(e) => setVisitData({...visitData, customerEmail: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Requirement *</label>
                <textarea 
                  value={visitData.requirement}
                  onChange={(e) => setVisitData({...visitData, requirement: e.target.value})}
                  rows="3"
                  placeholder="Describe customer requirement..."
                  required
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expected Closing Date *</label>
                  <input 
                    type="date" 
                    value={visitData.expectedClosing}
                    onChange={(e) => setVisitData({...visitData, expectedClosing: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Follow-up Date *</label>
                  <input 
                    type="date" 
                    value={visitData.followUpDate}
                    onChange={(e) => setVisitData({...visitData, followUpDate: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea 
                  value={visitData.notes}
                  onChange={(e) => setVisitData({...visitData, notes: e.target.value})}
                  rows="3"
                  placeholder="Any additional information..."
                ></textarea>
              </div>

              <button type="submit" className="btn-primary">Submit Visit Report</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .salesman-module {
          min-height: 100vh;
          background: #f5f7fa;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .page-title {
          margin: 0;
          color: #2c3e50;
        }

        .page-subtitle {
          color: #7f8c8d;
          margin: 5px 0 0 0;
        }

        .header-badge {
          padding: 8px 0;
        }

        .tabs-navigation {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
          flex-wrap: wrap;
        }

        .tabs-navigation button {
          padding: 12px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
          font-weight: 500;
        }

        .tabs-navigation button:hover {
          background: #f0f0f0;
        }

        .tabs-navigation button.active {
          border-bottom-color: #3498db;
          color: #3498db;
        }

        .welcome-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .welcome-card h2 {
          margin: 0 0 10px 0;
        }

        .alert-card {
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid;
        }

        .alert-card.warning {
          background: #fff3cd;
          border-left-color: #ffc107;
          color: #856404;
        }

        .alert-card.danger {
          background: #f8d7da;
          border-left-color: #dc3545;
          color: #721c24;
        }

        .alert-card strong {
          display: block;
          margin-bottom: 8px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .stat-icon {
          font-size: 40px;
        }

        .stat-content {
          flex: 1;
        }

        .stat-content h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #7f8c8d;
          text-transform: uppercase;
        }

        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #ecf0f1;
          border-radius: 4px;
          overflow: hidden;
          margin: 10px 0;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3498db, #2ecc71);
          transition: width 0.3s;
        }

        .quick-actions {
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .quick-actions h3 {
          margin-top: 0;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .action-btn {
          flex: 1;
          min-width: 200px;
          padding: 20px;
          border: 2px solid #3498db;
          background: white;
          color: #3498db;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .action-btn:hover {
          background: #3498db;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .table-container {
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: #34495e;
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
        }

        .data-table td {
          padding: 15px;
          border-bottom: 1px solid #ecf0f1;
        }

        .data-table tbody tr:hover {
          background: #f8f9fa;
        }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge.success {
          background: #d4edda;
          color: #155724;
        }

        .badge.warning {
          background: #fff3cd;
          color: #856404;
        }

        .outcome-interested {
          background: #d4edda;
          color: #155724;
        }

        .outcome-not-interested {
          background: #f8d7da;
          color: #721c24;
        }

        .outcome-meeting-scheduled {
          background: #d1ecf1;
          color: #0c5460;
        }

        .visits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .visit-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-left: 4px solid;
        }

        .visit-card.status-hot {
          border-left-color: #e74c3c;
        }

        .visit-card.status-warm {
          border-left-color: #f39c12;
        }

        .visit-card.status-cold {
          border-left-color: #3498db;
        }

        .visit-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .visit-header h3 {
          margin: 0;
          color: #2c3e50;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.hot {
          background: #f8d7da;
          color: #721c24;
        }

        .status-badge.warm {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.cold {
          background: #d1ecf1;
          color: #0c5460;
        }

        .visit-details p {
          margin: 8px 0;
          font-size: 14px;
        }

        .visit-date {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #ecf0f1;
          color: #7f8c8d;
        }

        .attendance-card {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          gap: 30px;
          max-width: 600px;
        }

        .attendance-photo {
          flex-shrink: 0;
        }

        .attendance-photo img {
          width: 200px;
          height: 200px;
          object-fit: cover;
          border-radius: 10px;
          border: 3px solid #3498db;
        }

        .photo-placeholder {
          width: 200px;
          height: 200px;
          background: #ecf0f1;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 60px;
        }

        .attendance-info h3 {
          margin-top: 0;
          color: #27ae60;
        }

        .info-row {
          margin: 12px 0;
          font-size: 15px;
        }

        .empty-state {
          background: white;
          padding: 60px 20px;
          border-radius: 10px;
          text-align: center;
          color: #7f8c8d;
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
        }

        .modal-content {
          position: relative;
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }

        .modal-content.large {
          max-width: 700px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 25px;
          border-bottom: 2px solid #ecf0f1;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }

        .modal-header h2 {
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #7f8c8d;
          padding: 0;
          width: 30px;
          height: 30px;
        }

        .close-btn:hover {
          color: #e74c3c;
        }

        .modal-body {
          padding: 25px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group small {
          display: block;
          margin-top: 5px;
          color: #7f8c8d;
          font-size: 12px;
        }

        .photo-preview {
          margin-top: 15px;
        }

        .photo-preview img {
          width: 200px;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #3498db;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .btn-primary {
          width: 100%;
          padding: 14px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary:hover {
          background: #2980b9;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-btn {
            min-width: 100%;
          }

          .visits-grid {
            grid-template-columns: 1fr;
          }

          .attendance-card {
            flex-direction: column;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .tabs-navigation {
            overflow-x: auto;
            flex-wrap: nowrap;
          }
        }
      `}</style>
    </div>
  )
}

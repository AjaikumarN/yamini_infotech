import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getDashboardRoute } from '../utils/dashboardRoutes.js'

export default function ProtectedRoute({ children, allowedRoles, requireMIFAccess = false }) {
  const { isAuthenticated, user, hasRole, canAccessMIF, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
        
        <style>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 20px;
          }

          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access
  if (allowedRoles && !hasRole(allowedRoles)) {
    // Redirect to user's correct dashboard based on their role
    const userDashboard = getDashboardRoute(user?.role)
    return <Navigate to={userDashboard} replace />
  }

  // Check MIF access requirement
  if (requireMIFAccess && !canAccessMIF()) {
    return (
      <div className="access-denied">
        <div className="denied-card confidential">
          <div className="denied-icon">🔒</div>
          <h1>Restricted Access</h1>
          <p className="confidential-text">This data is confidential and restricted.</p>
          <div className="denied-info">
            <p><strong>MIF Access:</strong> Denied</p>
            <p><strong>Your Role:</strong> {user?.role}</p>
            <p className="warning">⚠️ MIF data is accessible ONLY to Admin and authorized Office Staff</p>
          </div>
          <button onClick={() => window.history.back()} className="btn-back">
            Go Back
          </button>
        </div>

        <style>{`
          .access-denied {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #c0392b 0%, #8e44ad 100%);
            padding: 20px;
          }

          .denied-card {
            background: white;
            padding: 50px 40px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
          }

          .denied-card.confidential {
            border: 3px solid #c0392b;
          }

          .denied-icon {
            font-size: 80px;
            margin-bottom: 20px;
          }

          .denied-card h1 {
            margin: 0 0 15px 0;
            color: #c0392b;
          }

          .confidential-text {
            color: #e74c3c;
            font-weight: 600;
          }

          .denied-card p {
            color: #7f8c8d;
            margin-bottom: 20px;
          }

          .denied-info {
            background: #fff5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border: 1px solid #fee;
          }

          .denied-info p {
            margin: 10px 0;
            color: #2c3e50;
          }

          .warning {
            color: #e74c3c;
            font-weight: 600;
            margin-top: 15px;
            font-size: 14px;
          }

          .btn-back {
            padding: 12px 30px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }

          .btn-back:hover {
            background: #2980b9;
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    )
  }

  return children
}

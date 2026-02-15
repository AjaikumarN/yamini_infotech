import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getPostLoginRedirect } from '../utils/dashboardRoutes.js'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(credentials.username, credentials.password)
      
      if (result.success) {
        // Save remember me preference
        if (keepMeLoggedIn) {
          localStorage.setItem('keepMeLoggedIn', 'true')
          localStorage.setItem('rememberedUser', credentials.username)
        } else {
          localStorage.removeItem('keepMeLoggedIn')
          localStorage.removeItem('rememberedUser')
        }
        
        const redirectPath = getPostLoginRedirect(result.user.role, from)
        navigate(redirectPath, { replace: true })
      } else {
        setError(result.error || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      {/* Left Panel - Company Details */}
      <div className="left-panel">
        <div className="left-content">
          <div className="company-logo">
            <div className="logo-box">
              <img 
                src="/assets/mainlogobgre.png" 
                alt="Yamini Infotech Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <h1 className="company-name">YAMINI INFOTECH</h1>
          </div>
          
          <div className="welcome-section">
            <h2 className="welcome-title">Welcome Back!</h2>
            <p className="welcome-subtitle">To keep connected with us please<br />login with your personal info</p>
          </div>
        </div>
        
        {/* Decorative shapes */}
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="right-panel">
        <div className="login-form-container">
          <h2 className="form-title">Account Login</h2>
          
          {error && (
            <div className="error-alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  placeholder="Username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper password-field">
                <span className="input-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                  <span className="toggle-text">{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>

            <div className="keep-logged-in">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={keepMeLoggedIn}
                  onChange={(e) => setKeepMeLoggedIn(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">Keep me logged in</span>
              </label>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-container {
          min-height: 100vh;
          display: flex;
          background: #f5f5f5;
          position: relative;
          overflow: hidden;
        }

        /* Left Panel - Company Info */
        .left-panel {
          flex: 1;
          background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .left-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: white;
          padding: 40px;
        }

        .company-logo {
          margin-bottom: 60px;
        }

        .logo-box {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .logo-box svg {
          width: 48px;
          height: 48px;
        }

        .company-name {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 2px;
          color: white;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .welcome-section {
          margin-bottom: 80px;
        }

        .welcome-title {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 20px;
          color: white;
        }

        .welcome-subtitle {
          font-size: 16px;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 400;
        }

        /* Decorative Shapes */
        .shape {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
        }

        .shape-1 {
          width: 200px;
          height: 200px;
          background: white;
          top: 10%;
          left: -50px;
          animation: float 6s ease-in-out infinite;
        }

        .shape-2 {
          width: 150px;
          height: 150px;
          background: white;
          bottom: 15%;
          right: -30px;
          animation: float 8s ease-in-out infinite;
          animation-delay: 1s;
        }

        .shape-3 {
          width: 100px;
          height: 100px;
          background: white;
          bottom: 40%;
          left: 15%;
          animation: float 7s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        /* Right Panel - Login Form */
        .right-panel {
          flex: 1;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .login-form-container {
          width: 100%;
          max-width: 450px;
        }

        .form-title {
          font-size: 48px;
          color: #4ecdc4;
          font-weight: 400;
          text-align: center;
          margin-bottom: 50px;
        }

        .error-alert {
          background: #fee;
          border-left: 4px solid #f44;
          color: #c33;
          padding: 14px 16px;
          margin-bottom: 24px;
          border-radius: 8px;
          font-size: 14px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          width: 100%;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 1;
        }

        .input-icon svg {
          width: 22px;
          height: 22px;
          stroke-width: 2;
        }

        .input-wrapper input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          border: none;
          background: #f0f0f0;
          border-radius: 8px;
          font-size: 15px;
          color: #333;
          transition: all 0.3s ease;
          outline: none;
        }

        .input-wrapper input::placeholder {
          color: #aaa;
        }

        .input-wrapper input:focus {
          background: #e8e8e8;
          box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.2);
        }

        .password-field {
          position: relative;
        }

        .toggle-password-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #4ecdc4;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 600;
        }

        .toggle-password-btn:hover {
          background: rgba(78, 205, 196, 0.1);
        }

        .toggle-password-btn svg {
          width: 18px;
          height: 18px;
        }

        .toggle-text {
          user-select: none;
        }

        .keep-logged-in {
          margin-top: 16px;
          margin-bottom: 8px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          position: relative;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .checkbox-label input[type="checkbox"]:checked ~ .checkbox-custom {
          background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
          border-color: #4ecdc4;
        }

        .checkbox-label input[type="checkbox"]:checked ~ .checkbox-custom::after {
          content: '';
          position: absolute;
          left: 6px;
          top: 2px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .checkbox-text {
          color: #333;
          font-size: 15px;
        }

        .submit-btn {
          margin-top: 20px;
          background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%) !important;
          color: white !important;
          border: none;
          padding: 16px;
          border-radius: 50px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          width: 100%;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(78, 205, 196, 0.4);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Responsive Design */
        @media (max-width: 968px) {
          .login-container {
            flex-direction: column;
          }

          .left-panel {
            min-height: 40vh;
          }

          .left-content {
            padding: 30px;
          }

          .welcome-title {
            font-size: 36px;
          }

          .company-name {
            font-size: 24px;
          }

          .welcome-section {
            margin-bottom: 40px;
          }

          .right-panel {
            padding: 30px 20px;
          }

          .form-title {
            font-size: 36px;
            margin-bottom: 30px;
          }

          .shape-1, .shape-2, .shape-3 {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .welcome-title {
            font-size: 28px;
          }

          .company-name {
            font-size: 20px;
          }

          .form-title {
            font-size: 28px;
          }

          .welcome-subtitle {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}

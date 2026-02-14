import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { API_BASE_URL } from '../../config';
import { FiUser, FiHash, FiBriefcase, FiLock, FiDollarSign, FiEye, FiEyeOff } from 'react-icons/fi';

export default function NewEmployee() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = !!editId;

  console.log('NewEmployee loaded - Search params:', searchParams.toString(), 'Edit ID:', editId, 'Is Edit:', isEdit);

  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dateOfBirth: '',
    mobileNumber: '',
    emailAddress: '',
    currentAddress: '',
    permanentAddress: '',
    employeeId: '',
    nationality: 'Indian',
    photograph: null,
    department: '',
    role: '',
    dateOfJoining: '',
    username: '',
    password: '',
    salary: '',
    bankName: '',
    accountNumber: ''
  });

  const [originalEmail, setOriginalEmail] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const u = await apiRequest(`/api/users/${editId}`);
          setOriginalEmail(u.email || '');
          setOriginalUsername(u.username || '');
          setFormData(prev => ({
            ...prev,
            fullName: u.full_name || prev.fullName,
            gender: u.gender || prev.gender,
            dateOfBirth: u.date_of_birth ? u.date_of_birth.split('T')[0] : prev.dateOfBirth,
            mobileNumber: u.phone || u.mobile || prev.mobileNumber,
            emailAddress: u.email || prev.emailAddress,
            currentAddress: u.current_address || u.address || prev.currentAddress,
            permanentAddress: u.permanent_address || prev.permanentAddress,
            employeeId: u.employee_id ? String(u.employee_id) : (u.id ? String(u.id) : prev.employeeId),
            nationality: u.nationality || prev.nationality,
            department: u.department || prev.department,
            role: u.role || prev.role,
            dateOfJoining: u.date_of_joining ? u.date_of_joining.split('T')[0] : (u.created_at ? u.created_at.split('T')[0] : prev.dateOfJoining),
            username: u.username || prev.username,
            salary: u.salary || u.monthly_pay || prev.salary,
            bankName: u.bank_name || u.bank || prev.bankName,
            accountNumber: u.account_number || u.bank_account || prev.accountNumber
          }));
        } catch (err) {
          console.error('Failed to fetch user for edit', err);
        }
      })();
    }
  }, [isEdit, editId]);

  const [loading, setLoading] = useState(false);
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);

  // Check username availability with debounce
  useEffect(() => {
    if (!formData.username || isEdit) {
      setUsernameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const users = await apiRequest('/api/users/');
        const exists = users.some(u => u.username === formData.username);
        setUsernameAvailable(!exists);
      } catch (error) {
        console.error('Failed to check username:', error);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, photograph: e.target.files[0] }));
  };

  const handleAddressCheckbox = (e) => {
    setSameAsCurrentAddress(e.target.checked);
    if (e.target.checked) {
      setFormData(prev => ({ ...prev, permanentAddress: prev.currentAddress }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('Edit mode:', isEdit, 'Edit ID:', editId);
    console.log('Username comparison:', formData.username, '!==', originalUsername);
    
    try {
      if (isEdit) {
        // First, upload photo if provided
        let photographPath = undefined;
        if (formData.photograph && formData.photograph instanceof File) {
          const photoFormData = new FormData();
          photoFormData.append('file', formData.photograph);
          
          try {
            // Get token from yamini_user object
            const user = JSON.parse(localStorage.getItem('yamini_user') || '{}');
            const token = user.token;
            
            const uploadResponse = await fetch(`${API_BASE_URL}/api/users/upload-photo`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: photoFormData
            });
            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json();
              photographPath = uploadData.file_path; // Use relative path, never absolute URL
            } else {
              console.error('Photo upload failed:', await uploadResponse.text());
            }
          } catch (uploadErr) {
            console.error('Photo upload failed:', uploadErr);
          }
        }

        // Map to backend expected fields - now including ALL fields
        const payload = {
          full_name: formData.fullName,
          role: formData.role,
          department: formData.department,
          // Only include email/username if they changed
          ...(formData.emailAddress !== originalEmail ? { email: formData.emailAddress } : {}),
          ...(formData.username !== originalUsername ? { username: formData.username } : {}),
          // Personal Information
          gender: formData.gender || undefined,
          date_of_birth: formData.dateOfBirth || undefined,
          phone: formData.mobileNumber || undefined,
          mobile: formData.mobileNumber || undefined,
          current_address: formData.currentAddress || undefined,
          permanent_address: formData.permanentAddress || undefined,
          // Identification / KYC
          employee_id: formData.employeeId ? String(formData.employeeId) : undefined,
          nationality: formData.nationality || undefined,
          photograph: photographPath,
          // Employment Details
          date_of_joining: formData.dateOfJoining || undefined,
          // Salary & Payroll
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
          monthly_pay: formData.salary ? parseFloat(formData.salary) : undefined,
          bank_name: formData.bankName || undefined,
          bank: formData.bankName || undefined,
          account_number: formData.accountNumber || undefined,
          bank_account: formData.accountNumber || undefined,
          // Only send password if changed
          ...(formData.password ? { password: formData.password } : {})
        };

        // Remove undefined values to avoid validation errors
        Object.keys(payload).forEach(key => {
          if (payload[key] === undefined) {
            delete payload[key];
          }
        });

        await apiRequest(`/api/users/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        alert('Employee updated successfully!');
        // Navigate to the employee's detail view
        const roleSegment = (formData.role || '').toUpperCase() === 'SERVICE_ENGINEER' ? 'engineers' : (formData.role || '').toUpperCase() === 'SALESMAN' ? 'salesmen' : (formData.role || '').toLowerCase();
        navigate(`/admin/employees/${roleSegment}/${editId}`);
      } else {
        // First, upload photo if provided
        let photographPath = undefined;
        if (formData.photograph && formData.photograph instanceof File) {
          const photoFormData = new FormData();
          photoFormData.append('file', formData.photograph);
          
          try {
            // Get token from yamini_user object
            const user = JSON.parse(localStorage.getItem('yamini_user') || '{}');
            const token = user.token;
            
            const uploadResponse = await fetch(`${API_BASE_URL}/api/users/upload-photo`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: photoFormData
            });
            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json();
              photographPath = uploadData.file_path; // Use relative path, never absolute URL
            } else {
              console.error('Photo upload failed:', await uploadResponse.text());
            }
          } catch (uploadErr) {
            console.error('Photo upload failed:', uploadErr);
          }
        }

        // For new employee, map all fields
        const payload = {
          username: formData.username,
          email: formData.emailAddress,
          full_name: formData.fullName,
          role: formData.role,
          department: formData.department,
          password: formData.password,
          // Personal Information
          gender: formData.gender || undefined,
          date_of_birth: formData.dateOfBirth || undefined,
          phone: formData.mobileNumber || undefined,
          mobile: formData.mobileNumber || undefined,
          current_address: formData.currentAddress || undefined,
          permanent_address: formData.permanentAddress || undefined,
          // Identification / KYC
          nationality: formData.nationality || undefined,
          photograph: photographPath,
          // Employment Details
          date_of_joining: formData.dateOfJoining || undefined,
          // Salary & Payroll
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
          monthly_pay: formData.salary ? parseFloat(formData.salary) : undefined,
          bank_name: formData.bankName || undefined,
          bank: formData.bankName || undefined,
          account_number: formData.accountNumber || undefined,
          bank_account: formData.accountNumber || undefined
        };
        
        // Remove undefined values to avoid validation errors
        Object.keys(payload).forEach(key => {
          if (payload[key] === undefined) {
            delete payload[key];
          }
        });
        
        await apiRequest('/api/users/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        alert('Employee created successfully!');
        navigate('/admin/employees/salesmen');
      }
    } catch (error) {
      console.error('Failed to save employee:', error);
      alert('Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const sectionStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '18px',
    marginBottom: '28px',
    border: '1px solid #e6eef0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
    paddingBottom: '12px',
    borderBottom: '1px solid #eef2f7'
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px'
  };

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '700',
    color: '#374151'
  };

  const inputStyle = {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header with Action Info */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        color: 'white',
        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <span className="material-icons" style={{ fontSize: '40px' }}>
            {isEdit ? 'edit' : 'person_add'}
          </span>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, marginBottom: '8px' }}>
              {isEdit ? 'Edit Employee' : 'Create New Employee'}
            </h1>
            <p style={{ fontSize: '16px', opacity: 0.95, margin: 0, fontWeight: '500' }}>
              {isEdit ? 'Update employee information and credentials' : 'Fill in the form below to add a new employee to the system'}
            </p>
          </div>
        </div>
        {!isEdit && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span className="material-icons" style={{ fontSize: '20px' }}>info</span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              All fields marked with * are required. The employee will receive login credentials after creation.
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* 1. Personal Information */}
        <div style={sectionStyle}>
          <div style={headerStyle}>
            <FiUser style={{ fontSize: 20, color: '#06B6D4' }} />
            <h2 style={titleStyle}>1. Personal Information</h2>
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="Enter full name"
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Mobile Number *</label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="+91 XXXXX XXXXX"
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email Address *</label>
              <input
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="email@example.com"
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Current Address *</label>
              <textarea
                name="currentAddress"
                value={formData.currentAddress}
                onChange={handleChange}
                required
                rows="3"
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Enter current address"
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  id="sameAddress"
                  checked={sameAsCurrentAddress}
                  onChange={handleAddressCheckbox}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="sameAddress" style={{ fontSize: '13px', color: '#6b7280', cursor: 'pointer' }}>
                  Same as current address
                </label>
              </div>
              <label style={labelStyle}>Permanent Address *</label>
              <textarea
                name="permanentAddress"
                value={formData.permanentAddress}
                onChange={handleChange}
                required
                rows="3"
                disabled={sameAsCurrentAddress}
                style={{ ...inputStyle, resize: 'vertical', opacity: sameAsCurrentAddress ? 0.6 : 1 }}
                placeholder="Enter permanent address"
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>
        </div>

        {/* 2. Identification / KYC Details */}
        <div style={sectionStyle}>
          <div style={headerStyle}>
            <FiHash style={{ fontSize: 20, color: '#06B6D4' }} />
            <h2 style={titleStyle}>2. Identification / KYC Details</h2>
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Employee ID</label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                style={{ ...inputStyle, background: '#f9fafb' }}
                placeholder="Auto-generated"
                readOnly
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Nationality *</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="Enter nationality"
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Photograph (Passport Size)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ ...inputStyle, padding: '8px 12px' }}
              />
            </div>
          </div>
        </div>

        {/* 3. Employment Details */}
        <div style={sectionStyle}>
          <div style={headerStyle}>
            <FiBriefcase style={{ fontSize: 20, color: '#06B6D4' }} />
            <h2 style={titleStyle}>3. Employment Details</h2>
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                <option value="">Select Department</option>
                <option value="Sales">Sales</option>
                <option value="Service">Service</option>
                <option value="Reception">Reception</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                <option value="">Select Role</option>
                <option value="SALESMAN">Salesman</option>
                <option value="SERVICE_ENGINEER">Service Engineer</option>
                <option value="RECEPTION">Reception</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Date of Joining *</label>
              <input
                type="date"
                name="dateOfJoining"
                value={formData.dateOfJoining}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>
        </div>

        {/* 4. Account & System Access */}
        <div style={sectionStyle}>
          <div style={headerStyle}>
            <FiLock style={{ fontSize: 20, color: '#06B6D4' }} />
            <h2 style={titleStyle}>4. Account & System Access</h2>
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Username / Employee Login ID *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                style={{
                  ...inputStyle,
                  borderColor: usernameAvailable === false ? '#ef4444' : usernameAvailable === true ? '#10b981' : '#d1d5db'
                }}
                placeholder="Enter username"
                onFocus={(e) => e.target.style.borderColor = usernameAvailable === false ? '#ef4444' : usernameAvailable === true ? '#10b981' : '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = usernameAvailable === false ? '#ef4444' : usernameAvailable === true ? '#10b981' : '#d1d5db'}
              />
              {!isEdit && formData.username && (
                <div style={{ marginTop: '6px', fontSize: '13px' }}>
                  {checkingUsername ? (
                    <span style={{ color: '#6b7280' }}>⏳ Checking availability...</span>
                  ) : usernameAvailable === true ? (
                    <span style={{ color: '#10b981' }}>✓ Username is available</span>
                  ) : usernameAvailable === false ? (
                    <span style={{ color: '#ef4444' }}>✗ Username already exists. Please choose another.</span>
                  ) : null}
                </div>
              )}
            </div>
            {!isEdit ? (
              <div style={fieldStyle}>
                <label style={labelStyle}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={{...inputStyle, paddingRight: '40px'}}
                    placeholder="Enter password"
                    onFocus={(e) => e.target.style.borderColor = '#06B6D4'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
            ) : (
              <div style={fieldStyle}>
                <label style={labelStyle}>New Password (leave blank to keep current)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={{...inputStyle, paddingRight: '40px'}}
                    placeholder="Enter new password to change"
                    onFocus={(e) => e.target.style.borderColor = '#06B6D4'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Only fill this if you want to change the password
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. Salary & Payroll Information */}
        <div style={sectionStyle}>
          <div style={headerStyle}>
            <FiDollarSign style={{ fontSize: 20, color: '#06B6D4' }} />
            <h2 style={titleStyle}>5. Salary & Payroll Information</h2>
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Salary *</label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="Enter monthly salary"
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Bank Name *</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="Enter bank name"
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Account Number *</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="Enter account number"
                onFocus={(e) => e.target.style.borderColor = '#667EEA'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'flex-end',
          marginTop: '40px',
          paddingTop: '24px',
          borderTop: '2px solid #e5e7eb'
        }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              ...buttonStyle,
              background: 'white',
              color: '#6b7280',
              border: '2px solid #d1d5db',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f9fafb';
              e.target.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px', marginRight: '8px' }}>close</span>
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              fontWeight: '700',
              fontSize: '16px',
              padding: '14px 32px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              border: 'none',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)')}
            onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)')}
          >
            {loading ? (
              <>
                <span className="material-icons" style={{ fontSize: '18px', marginRight: '8px', animation: 'spin 1s linear infinite' }}>refresh</span>
                {isEdit ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>
                <span className="material-icons" style={{ fontSize: '18px', marginRight: '8px' }}>{isEdit ? 'save' : 'person_add'}</span>
                {isEdit ? 'Save Changes' : 'Create Employee'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

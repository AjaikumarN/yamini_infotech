import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/api'

export default function EmployeeDetail() {
  const { role, userId } = useParams()
  const id = parseInt(userId)
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [operationLoading, setOperationLoading] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [id])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const data = await apiRequest(`/api/users/${id}`)
      setUser(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load user', err)
      setError('Failed to load user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return '-'
    try {
      return new Date(d).toLocaleDateString()
    } catch {
      return d
    }
  }

  const genPassword = (len = 10) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()'
    let out = ''
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
    return out
  }




  const handleDelete = async () => {
    if (!user) return
    const ok = window.confirm('Are you sure you want to delete this user? This action cannot be undone.')
    if (!ok) return

    try {
      setOperationLoading(true)
      await apiRequest(`/api/users/${id}`, { method: 'DELETE' })
      alert('User deleted')
      navigate(`/admin/employees/${role || 'salesmen'}`)
    } catch (err) {
      console.error('Failed to delete', err)
      alert('Failed to delete user')
    } finally {
      setOperationLoading(false)
    }
  }

  const handleEdit = () => {
    // Re-use NewEmployee page for edit by navigating and passing id in query param
    navigate(`/admin/new-employee?id=${id}`)
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>
  if (!user) return <div style={{ padding: 24 }}>No user found</div>

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0 }}>{user.full_name || user.username}</h1>
          <div style={{ color: '#666', marginTop: 6 }}>{user.role} • ID: {user.id}</div>
        </div>
      </div>

      {/* 1. Quick Overview */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, marginBottom: 16, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            {user.photo || user.avatar ? (
              <img src={user.photo || user.avatar} alt="photo" style={{ width: 96, height: 96, borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 96, height: 96, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777', fontWeight: 700, fontSize: 20 }}>{(user.full_name || user.username || 'U').split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div><strong>Department</strong><div style={{ color: '#555' }}>{user.department || '-'}</div></div>
              <div><strong>Date of Joining</strong><div style={{ color: '#555' }}>{formatDate(user.created_at)}</div></div>
              <div><strong>Status</strong><div style={{ color: '#555' }}>{user.is_active ? 'Active' : 'Inactive'}</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Personal Information */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0 }}>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><small>Full Name</small><div style={{ color: '#333' }}>{user.full_name || '-'}</div></div>
            <div><small>Gender</small><div style={{ color: '#333' }}>{user.gender || '-'}</div></div>
            <div><small>Date of Birth</small><div style={{ color: '#333' }}>{formatDate(user.date_of_birth)}</div></div>
            <div><small>Mobile Number</small><div style={{ color: '#333' }}>{user.phone || user.mobile || user.mobile_number || '-'}</div></div>
            <div style={{ gridColumn: '1 / -1' }}><small>Email Address</small><div style={{ color: '#333' }}>{user.email || '-'}</div></div>
            <div style={{ gridColumn: '1 / -1' }}><small>Current Address</small><div style={{ color: '#333' }}>{user.current_address || user.address || '-'}</div></div>
            <div style={{ gridColumn: '1 / -1' }}><small>Permanent Address</small><div style={{ color: '#333' }}>{user.permanent_address || '-'}</div></div>
          </div>
        </div>

        {/* 3. Identification / KYC Details */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0 }}>Identification / KYC</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <div><small>Employee ID</small><div style={{ color: '#333' }}>{user.employee_id || user.id}</div></div>
            <div><small>Nationality</small><div style={{ color: '#333' }}>{user.nationality || '-'}</div></div>
            <div><small>Photograph</small>
              <div style={{ marginTop: 8 }}>{user.photograph || user.photo || user.avatar ? (
                <img src={user.photograph || user.photo || user.avatar} alt="photo" style={{ width: 120, height: 120, borderRadius: 8, objectFit: 'cover' }} />
              ) : <div style={{ width: 120, height: 120, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No Photo</div>}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Employment Details */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, marginTop: 16, border: '1px solid #e5e7eb' }}>
        <h3 style={{ marginTop: 0 }}>Employment Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><small>Department</small><div style={{ color: '#333' }}>{user.department || '-'}</div></div>
          <div><small>Date of Joining</small><div style={{ color: '#333' }}>{formatDate(user.created_at)}</div></div>
        </div>
      </div>

      {/* 5. Account & System Access */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, marginTop: 16, border: '1px solid #e5e7eb' }}>
        <h3 style={{ marginTop: 0 }}>Account & System Access</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
          <div>
            <small>Username / Employee Login ID</small>
            <div style={{ color: '#333' }}>{user.username || '-'}</div>
          </div>
          <div>
            <small>Password</small>
            <div style={{ color: '#333' }}>••••••••••</div>
          </div>
          <div><small>Account Created</small><div style={{ color: '#333' }}>{formatDate(user.created_at)}</div></div>
        </div>
      </div>

      {/* 6. Salary & Payroll */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, marginTop: 16, border: '1px solid #e5e7eb' }}>
        <h3 style={{ marginTop: 0 }}>Salary & Payroll Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div><small>Salary</small><div style={{ color: '#333' }}>{user.salary || user.monthly_pay || '-'}</div></div>
          <div><small>Bank Name</small><div style={{ color: '#333' }}>{user.bank_name || user.bank || '-'}</div></div>
          <div><small>Account Number</small><div style={{ color: '#333' }}>{user.account_number || user.bank_account || '-'}</div></div>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
        <button onClick={handleEdit} style={{ padding: '10px 14px', borderRadius: 8, background: '#06b6d4', color: '#fff', border: 'none' }}>Edit Employee</button>
        <button onClick={handleDelete} style={{ padding: '10px 14px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none' }}>Delete Employee</button>
      </div>
    </div>
  )
}

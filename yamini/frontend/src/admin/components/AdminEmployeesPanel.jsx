import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/api'

export default function AdminEmployeesPanel({ onClose }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const users = await apiRequest('/api/users/')
      setEmployees(users || [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch employees', err)
      setError('Failed to load employees')
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role) => {
    if (!role) return 'Unknown'
    return role.replace('_', ' ').toUpperCase()
  }

  const formatDate = (d) => {
    if (!d) return '-'
    try {
      return new Date(d).toLocaleDateString()
    } catch (e) {
      return d
    }
  }

  const handleViewDetail = (employee) => {
    const mapRole = (r) => {
      if (!r) return 'salesmen'
      switch (r.toUpperCase()) {
        case 'SALESMAN': return 'salesmen'
        case 'SERVICE_ENGINEER': return 'engineers'
        case 'RECEPTION': return 'reception'
        default: return 'employees'
      }
    }

    const roleSegment = mapRole(employee.role)
    if (employee.id) {
      // Navigate to the detailed employee view
      navigate(`/admin/employees/${roleSegment}/${employee.id}`)
      // Close the inline panel so the new route (detail page) can render immediately
      if (typeof onClose === 'function') onClose()
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 6px 18px rgba(2,6,23,0.06)', marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Employee Overview</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ color: '#666' }}>{employees.length} employees</div>
        </div>
      </div>

      <div style={{ overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
        ) : error ? (
          <div style={{ padding: 30, color: 'red' }}>{error}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px' }}>Employee ID</th>
                <th style={{ padding: '8px' }}>Photograph</th>
                <th style={{ padding: '8px' }}>Full Name</th>
                <th style={{ padding: '8px' }}>Department</th>
                <th style={{ padding: '8px' }}>Date of Joining</th>
                <th style={{ padding: '8px' }}>Status</th>
                <th style={{ padding: '8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.employee_id || emp.id} style={{ borderBottom: '1px solid #fafafa' }}>
                  <td style={{ padding: '10px 8px' }}>{emp.employee_id || emp.id || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>
                    {emp.photo || emp.profile_picture || emp.avatar ? (
                      <img src={emp.photo || emp.profile_picture || emp.avatar} alt="photo" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 6, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
                        {(emp.full_name || emp.username || 'U').split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 8px' }}>{emp.full_name || emp.username || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>{getRoleLabel(emp.role)}</td>
                  <td style={{ padding: '10px 8px' }}>{formatDate(emp.created_at || emp.joined_on || emp.date_joined)}</td>
                  <td style={{ padding: '10px 8px' }}>{emp.is_active ? 'Active' : 'Inactive'}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <button onClick={() => handleViewDetail(emp)} style={{ padding: '6px 10px', background: 'linear-gradient(90deg,#06b6d4,#06a7e5)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>View Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
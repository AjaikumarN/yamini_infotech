import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/api'

export default function AdminEmployeesOverview({ open, onClose }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) fetchEmployees()
  }, [open])

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
    // Map backend role to front-end path segment
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
      navigate(`/admin/employees/${roleSegment}/${employee.id}`)
      onClose()
    }
  }

  if (!open) return null

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0 }}>Employee Overview</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ color: '#666' }}>{employees.length} employees</div>
          </div>
        </div>

        <div style={{ padding: '12px 18px', overflow: 'auto', maxHeight: '60vh' }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
          ) : error ? (
            <div style={{ padding: 30, color: 'red' }}>{error}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                  <th style={thStyle}>Employee ID</th>
                  <th style={thStyle}>Photograph</th>
                  <th style={thStyle}>Full Name</th>
                  <th style={thStyle}>Department</th>
                  <th style={thStyle}>Date of Joining</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.employee_id || emp.id} style={{ borderBottom: '1px solid #fafafa' }}>
                    <td style={tdStyle}>{emp.employee_id || emp.id || '-'}</td>
                    <td style={tdStyle}>
                      {emp.photo || emp.profile_picture || emp.avatar ? (
                        <img src={emp.photo || emp.profile_picture || emp.avatar} alt="photo" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: 6, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
                          {(emp.full_name || emp.username || 'U').split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>{emp.full_name || emp.username || '-'}</td>
                    <td style={tdStyle}>{getRoleLabel(emp.role)}</td>
                    <td style={tdStyle}>{formatDate(emp.created_at || emp.joined_on || emp.date_joined)}</td>
                    <td style={tdStyle}>{emp.is_active ? 'Active' : 'Inactive'}</td>
                    <td style={tdStyle}>
                      <button onClick={() => handleViewDetail(emp)} style={detailBtnStyle}>View Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center'
}

const modalStyle = {
  width: '900px', maxWidth: '94%', background: '#fff', borderRadius: 8, boxShadow: '0 8px 40px rgba(2,6,23,0.2)', overflow: 'hidden'
}

const modalHeaderStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #eee' }
const closeBtnStyle = { all: 'unset', cursor: 'pointer', padding: 8, borderRadius: 6, background: '#f3f4f6' }
const thStyle = { padding: '10px 8px', fontSize: 13, color: '#374151' }
const tdStyle = { padding: '10px 8px', verticalAlign: 'middle', fontSize: 14, color: '#111827' }
const detailBtnStyle = { padding: '6px 10px', background: 'linear-gradient(90deg,#06b6d4,#06a7e5)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }
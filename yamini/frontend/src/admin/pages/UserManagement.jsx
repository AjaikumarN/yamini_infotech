import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

/**
 * UserManagement - Single page for all employee management
 * Replaces separate Salesmen/Engineers/Reception/Admin pages
 */
export default function UserManagement({ role = 'all' }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(role);

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    try {
      const response = await apiRequest('/api/users');
      const filtered = filter === 'all' 
        ? response 
        : response.filter(u => u.role === filter);
      setUsers(filtered);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    const icons = {
      'SALESMAN': '👔',
      'SERVICE_ENGINEER': '🔧',
      'RECEPTION': '🏢',
      'ADMIN': '⚡'
    };
    return icons[role] || '👤';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'SALESMAN': 'Salesman',
      'SERVICE_ENGINEER': 'Service Engineer',
      'RECEPTION': 'Reception',
      'ADMIN': 'Admin'
    };
    return labels[role] || role;
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>⏳ Loading users...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>
          {filter === 'all' ? 'All Employees' : `${getRoleLabel(filter)}s`}
        </h1>
        <p style={{ color: '#6B7280', marginBottom: '20px' }}>
          Manage employee accounts and view their activity
        </p>

        {/* Role Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {['all', 'SALESMAN', 'SERVICE_ENGINEER', 'RECEPTION', 'ADMIN'].map(r => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: filter === r ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                background: filter === r ? '#EFF6FF' : 'white',
                color: filter === r ? '#3B82F6' : '#6B7280',
                fontWeight: filter === r ? '600' : '500',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {r === 'all' ? 'All' : getRoleLabel(r)}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        border: '1px solid #E5E7EB',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Employee
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Role
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Email
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Status
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{getRoleIcon(user.role)}</span>
                      <span style={{ fontWeight: '500', color: '#1F2937' }}>{user.full_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6B7280' }}>
                    {getRoleLabel(user.role)}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6B7280' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: user.is_active ? '#DEF7EC' : '#FEE2E2',
                      color: user.is_active ? '#03543F' : '#991B1B'
                    }}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => navigate(`/admin/employees/${user.id}`)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #E5E7EB',
                        background: 'white',
                        color: '#3B82F6',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

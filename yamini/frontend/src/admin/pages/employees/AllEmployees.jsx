import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../../utils/api';
import DataCard from '../../../components/shared/dashboard/DataCard';
import SimpleTable from '../../../components/shared/dashboard/SimpleTable';
import StatusBadge from '../../../components/shared/dashboard/StatusBadge';
import ActionButton from '../../../components/shared/dashboard/ActionButton';

/**
 * ALL EMPLOYEES PAGE - Able Pro Style
 * Complete employee list with role filtering
 * NO AdminLayout wrapper - layout handled by route-level DashboardLayout
 */
export default function AllEmployees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await apiRequest('/api/users/');
      // Filter out inactive (deleted) users
      const activeUsers = data.filter(user => user.is_active !== false);
      setEmployees(activeUsers);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (!confirm(`Are you sure you want to delete ${employeeName}?`)) return;
    
    try {
      await apiRequest(`/api/users/${employeeId}`, {
        method: 'DELETE'
      });
      alert('✅ Employee deleted successfully');
      fetchEmployees(); // Reload the list
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('❌ Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesRole = filterRole === 'all' || emp.role === filterRole;
    const matchesSearch = searchQuery === '' || 
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const isActive = emp.is_active !== false;
    return matchesRole && matchesSearch && isActive;
  });

  const columns = [
    {
      label: 'Employee',
      key: 'name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#eef2ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {row.photograph || row.photo ? (
              <img 
                src={row.photograph || row.photo} 
                alt={row.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#6366f1' }}>
                {row.name?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {row.name}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      label: 'Role',
      key: 'role',
      render: (row) => {
        const roleColors = {
          'ADMIN': { bg: '#fef3c7', color: '#92400e' },
          'SALESMAN': { bg: '#dbeafe', color: '#1e40af' },
          'SERVICENGINEER': { bg: '#d1fae5', color: '#065f46' },
          'RECEPTION': { bg: '#fce7f3', color: '#9f1239' }
        };
        const color = roleColors[row.role] || { bg: '#f3f4f6', color: '#374151' };
        return (
          <span style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            background: color.bg,
            color: color.color
          }}>
            {row.role?.replace('SERVICENGINEER', 'SERVICE ENGINEER')}
          </span>
        );
      }
    },
    {
      label: 'Phone',
      key: 'phone',
      render: (row) => row.phone || '-'
    },
    {
      label: 'Status',
      key: 'is_active',
      render: (row) => (
        <StatusBadge
          status={row.is_active ? 'Active' : 'Inactive'}
          variant={row.is_active ? 'success' : 'danger'}
          size="sm"
          dot
        />
      )
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionButton
            variant="secondary"
            size="sm"
            icon="visibility"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/employees/${row.id}`);
            }}
          >
            View
          </ActionButton>
          <ActionButton
            variant="secondary"
            size="sm"
            icon="edit"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Edit button clicked - Row:', row, 'ID:', row.id);
              navigate(`/admin/new-employee?id=${row.id}`);
            }}
          >
            Edit
          </ActionButton>
          <ActionButton
            variant="danger"
            size="sm"
            icon="delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id, row.name);
            }}
          >
            Delete
          </ActionButton>
        </div>
      )
    }
  ];

  const roleStats = {
    all: employees.length,
    ADMIN: employees.filter(e => e.role === 'ADMIN').length,
    SALESMAN: employees.filter(e => e.role === 'SALESMAN').length,
    SERVICE_ENGINEER: employees.filter(e => e.role === 'SERVICE_ENGINEER').length,
    RECEPTION: employees.filter(e => e.role === 'RECEPTION').length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
            All Employees
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
            Manage your team members
          </p>
        </div>
        <ActionButton
          variant="primary"
          icon="person_add"
          onClick={() => navigate('/admin/new-employee')}
        >
          Add Employee
        </ActionButton>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        {[
          { label: 'Total', count: roleStats.all, color: '#6366f1', icon: 'people' },
            { label: 'Salesmen', count: roleStats.SALESMAN, color: '#3b82f6', icon: 'support_agent' },
            { label: 'Engineers', count: roleStats.SERVICE_ENGINEER, color: '#10b981', icon: 'engineering' },
            { label: 'Reception', count: roleStats.RECEPTION, color: '#ec4899', icon: 'desk' }
          ].map((stat, idx) => (
            <div key={idx} style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => setFilterRole(stat.label === 'Total' ? 'all' : stat.label.toUpperCase().replace('RECEPTION', 'RECEPTION').replace('SALESMEN', 'SALESMAN').replace('ENGINEERS', 'SERVICENGINEER'))}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>
                    {stat.count}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginTop: '4px' }}>
                    {stat.label}
                  </div>
                </div>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span className="material-icons" style={{ fontSize: '24px', color: stat.color }}>
                    {stat.icon}
                  </span>
                </div>
              </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <DataCard>
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'ADMIN', 'SALESMAN', 'SERVICE_ENGINEER', 'RECEPTION'].map(role => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: filterRole === role ? '#6366f1' : '#ffffff',
                    color: filterRole === role ? '#ffffff' : '#374151',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {role === 'all' ? 'All' : role.replace('SERVICE_ENGINEER', 'Engineers')}
                </button>
              ))}
            </div>
          </div>
        </DataCard>

      {/* Employees Table */}
      <DataCard
          title={`Employees (${filteredEmployees.length})`}
          subtitle={`Showing ${filterRole === 'all' ? 'all roles' : filterRole.toLowerCase()}`}
          noPadding
        >
          <SimpleTable
            columns={columns}
            data={filteredEmployees}
            loading={loading}
            emptyText="No employees found"
            onRowClick={(row) => navigate(`/admin/employees/${row.id}`)}
          />
      </DataCard>
    </div>
  );
}

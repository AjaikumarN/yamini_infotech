import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { FiSearch, FiArrowRight, FiUsers, FiTool, FiHeadphones, FiMail, FiPhone, FiCalendar } from 'react-icons/fi';
import '../styles/employee-list.css';

const ROLE_CONFIG = {
  'salesmen': {
    apiRole: 'SALESMAN',
    title: 'Sales Team',
    subtitle: 'Manage your sales representatives',
    icon: FiUsers,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    lightBg: '#f0f4ff',
    accentColor: '#667eea'
  },
  'engineers': {
    apiRole: 'SERVICE_ENGINEER',
    title: 'Engineering Team',
    subtitle: 'Manage your service engineers',
    icon: FiTool,
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    lightBg: '#ecfdf5',
    accentColor: '#10b981'
  },
  'reception': {
    apiRole: 'RECEPTION',
    title: 'Reception Team',
    subtitle: 'Manage your reception staff',
    icon: FiHeadphones,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    lightBg: '#fdf2f8',
    accentColor: '#ec4899'
  }
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
];

export default function EmployeeList() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);

  const config = ROLE_CONFIG[role] || ROLE_CONFIG['salesmen'];
  const IconComponent = config.icon;

  useEffect(() => {
    loadEmployees();
  }, [role]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const users = await apiRequest('/api/users/');
      const filtered = users.filter(u => u.role === config.apiRole && u.is_active);
      setEmployees(filtered);
    } catch (error) {
      console.error('Failed to load employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDashboard = (employee) => {
    navigate(`/admin/employees/${role}/${employee.id}/dashboard`);
  };

  const getAvatarGradient = (index) => AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

  if (loading) {
    return (
      <div className="emp-loading-container">
        <div className="emp-loading-spinner"></div>
        <p className="emp-loading-text">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="emp-page-container">
      {/* Hero Header */}
      <div className="emp-hero-header" style={{ background: config.gradient }}>
        <div className="emp-hero-content">
          <div className="emp-hero-icon-wrap">
            <IconComponent size={32} />
          </div>
          <div className="emp-hero-text">
            <h1 className="emp-hero-title">{config.title}</h1>
            <p className="emp-hero-subtitle">{config.subtitle}</p>
          </div>
        </div>
        <div className="emp-hero-stats">
          <div className="emp-stat-card">
            <span className="emp-stat-number">{employees.length}</span>
            <span className="emp-stat-label">Total Members</span>
          </div>
          <div className="emp-stat-card">
            <span className="emp-stat-number">{employees.filter(e => e.is_active).length}</span>
            <span className="emp-stat-label">Active</span>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="emp-search-section">
        <div className="emp-search-box">
          <FiSearch className="emp-search-icon" />
          <input
            type="text"
            className="emp-search-input"
            placeholder="Search team members by name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="emp-search-clear"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
        <div className="emp-results-count">
          Showing <strong>{filteredEmployees.length}</strong> of <strong>{employees.length}</strong> members
        </div>
      </div>

      {/* Employee Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="emp-empty-state">
          <div className="emp-empty-icon">
            <FiUsers size={48} />
          </div>
          <h3 className="emp-empty-title">No team members found</h3>
          <p className="emp-empty-text">
            {searchTerm 
              ? `No results matching "${searchTerm}"` 
              : `No ${config.title.toLowerCase()} have been added yet`}
          </p>
        </div>
      ) : (
        <div className="emp-grid">
          {filteredEmployees.map((employee, index) => {
            const name = employee.full_name || employee.username;
            const initials = name
              .split(' ')
              .map(part => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            const isHovered = hoveredCard === employee.id;

            return (
              <div
                key={employee.id}
                className={`emp-card ${isHovered ? 'emp-card-hovered' : ''}`}
                onMouseEnter={() => setHoveredCard(employee.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleViewDashboard(employee)}
              >
                <div className="emp-card-header">
                  <div 
                    className="emp-avatar"
                    style={{ background: getAvatarGradient(index) }}
                  >
                    {initials}
                  </div>
                  <div className="emp-status-badge emp-status-active">
                    Active
                  </div>
                </div>
                
                <div className="emp-card-body">
                  <h3 className="emp-name">{name}</h3>
                  <p className="emp-username">@{employee.username}</p>
                  
                  <div className="emp-info-row">
                    <div className="emp-info-item">
                      <FiMail className="emp-info-icon" />
                      <span>{employee.email || 'No email'}</span>
                    </div>
                  </div>
                  
                  <div className="emp-role-badge" style={{ 
                    background: config.lightBg,
                    color: config.accentColor 
                  }}>
                    {config.title.replace(' Team', '')}
                  </div>
                </div>
                
                <div className="emp-card-footer">
                  <button 
                    className="emp-view-btn"
                    style={{ 
                      '--btn-gradient': config.gradient,
                      '--btn-color': config.accentColor 
                    }}
                  >
                    <span>View Dashboard</span>
                    <FiArrowRight className="emp-btn-arrow" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

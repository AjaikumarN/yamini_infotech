import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEmployeePhotoUrl as getPhotoUrl } from '../../config';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const styles = {
    container: {
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      padding: '40px',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      marginBottom: '40px',
      paddingBottom: '24px',
      borderBottom: '1px solid #e5e7eb',
    },
    avatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      fontWeight: '600',
      color: 'white',
      overflow: 'hidden',
      flexShrink: 0,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    headerInfo: {
      flex: 1,
    },
    name: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1f2937',
      margin: '0 0 4px 0',
    },
    email: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0,
    },
    infoGrid: {
      display: 'grid',
      gap: '24px',
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 0',
      borderBottom: '1px solid #f3f4f6',
    },
    infoLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#6b7280',
    },
    infoValue: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#1f2937',
      textAlign: 'right',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background: '#dbeafe',
      color: '#1e40af',
    },
  };

  const getRoleBadgeColor = (role) => {
    const roleUpper = role?.toUpperCase();
    switch (roleUpper) {
      case 'ADMIN':
        return { background: '#dbeafe', color: '#1e40af' };
      case 'RECEPTION':
        return { background: '#dcfce7', color: '#166534' };
      case 'SALESMAN':
        return { background: '#fef3c7', color: '#92400e' };
      case 'SERVICE_ENGINEER':
        return { background: '#f3e8ff', color: '#6b21a8' };
      default:
        return { background: '#e5e7eb', color: '#374151' };
    }
  };

  const formatRole = (role) => {
    if (!role) return 'User';
    const roleMap = {
      ADMIN: 'Admin',
      RECEPTION: 'Reception',
      SALESMAN: 'Salesman',
      SERVICE_ENGINEER: 'Service Engineer',
    };
    return roleMap[role.toUpperCase()] || role;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleBack = () => {
    const roleUpper = user?.role?.toUpperCase();
    const basePath = roleUpper === 'ADMIN' ? '/admin' :
                    roleUpper === 'SALESMAN' ? '/salesman' :
                    roleUpper === 'RECEPTION' ? '/reception' :
                    roleUpper === 'SERVICE_ENGINEER' ? '/engineer' : '/admin';
    navigate(`${basePath}/dashboard`);
  };

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <button
        onClick={handleBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          marginBottom: '20px',
          background: 'transparent',
          border: 'none',
          color: '#6b7280',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#1f2937'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Back to Dashboard</span>
      </button>

      <div style={styles.card}>
        {/* Header with Avatar */}
        <div style={styles.header}>
          <div style={styles.avatar}>
            {getPhotoUrl(user?.photo || user?.photograph) ? (
              <img 
                src={getPhotoUrl(user.photo || user.photograph)} 
                alt={user?.full_name || 'User'} 
                style={styles.avatarImage}
              />
            ) : (
              getInitials(user?.full_name)
            )}
          </div>
          <div style={styles.headerInfo}>
            <h1 style={styles.name}>{user?.full_name || 'Your name'}</h1>
            <p style={styles.email}>{user?.email || 'yourname@gmail.com'}</p>
          </div>
        </div>

        {/* Information Grid */}
        <div style={styles.infoGrid}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Name</span>
            <span style={styles.infoValue}>{user?.full_name || 'your name'}</span>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Email account</span>
            <span style={styles.infoValue}>{user?.email || 'yourname@gmail.com'}</span>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Mobile number</span>
            <span style={styles.infoValue}>{user?.phone || 'Add number'}</span>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Role</span>
            <span style={{...styles.badge, ...getRoleBadgeColor(user?.role)}}>
              {formatRole(user?.role)}
            </span>
          </div>

          {user?.department && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Department</span>
              <span style={styles.infoValue}>{user.department}</span>
            </div>
          )}

          {user?.employee_id && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Employee ID</span>
              <span style={styles.infoValue}>{user.employee_id}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

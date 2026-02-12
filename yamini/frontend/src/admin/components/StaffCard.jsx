import React, { useState } from 'react';
import { colors, spacing, shadows, transitions } from '../styles/tokens';

/**
 * StaffCard - Employee card with hover effects
 * Used in employee listing for admin to select and view dashboards
 */
export default function StaffCard({ 
  employee, 
  onClick,
  showStatus = true 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getRoleBadgeColor = (role) => {
    const roleColors = {
      SALESMAN: colors.primary,
      SERVICE_ENGINEER: colors.warning,
      RECEPTION: colors.success,
      ADMIN: colors.danger
    };
    return roleColors[role] || colors.neutral;
  };

  const cardStyles = {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: spacing.lg,
    boxShadow: isHovered ? shadows.cardHover : shadows.card,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
    transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
    border: `2px solid ${isHovered ? getRoleBadgeColor(employee.role) : colors.border}`,
    position: 'relative',
    overflow: 'hidden',
    minHeight: '200px'
  };

  const avatarStyles = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${getRoleBadgeColor(employee.role)}20, ${getRoleBadgeColor(employee.role)}40)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '700',
    color: getRoleBadgeColor(employee.role),
    marginBottom: spacing.md,
    transition: `all ${transitions.normal}`,
    transform: isHovered ? 'scale(1.15) rotate(5deg)' : 'scale(1) rotate(0deg)',
    boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.15)' : '0 4px 10px rgba(0,0,0,0.1)'
  };

  const nameStyles = {
    fontSize: '20px',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center'
  };

  const roleStyles = {
    fontSize: '13px',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontWeight: '500'
  };

  const badgeStyles = {
    display: 'inline-block',
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    background: `linear-gradient(135deg, ${getRoleBadgeColor(employee.role)}25, ${getRoleBadgeColor(employee.role)}15)`,
    color: getRoleBadgeColor(employee.role),
    border: `1.5px solid ${getRoleBadgeColor(employee.role)}40`,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const statsContainerStyles = {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    gap: spacing.md
  };

  const statStyles = {
    flex: 1,
    textAlign: 'center'
  };

  const statValueStyles = {
    fontSize: '20px',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  };

  const statLabelStyles = {
    fontSize: '12px',
    color: colors.textTertiary
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div 
      style={cardStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={avatarStyles}>
          {getInitials(employee.name)}
        </div>
        
        <div style={nameStyles}>{employee.name}</div>
        <div style={roleStyles}>{employee.email}</div>
        
        <div style={badgeStyles}>
          {employee.role.replace('_', ' ')}
        </div>

        {showStatus && employee.stats && (
          <div style={statsContainerStyles}>
            {employee.stats.map((stat, idx) => (
              <div key={idx} style={statStyles}>
                <div style={statValueStyles}>{stat.value}</div>
                <div style={statLabelStyles}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hover accent line */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, transparent, ${getRoleBadgeColor(employee.role)}, transparent)`,
        transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
        transition: `transform ${transitions.normal}`,
        boxShadow: `0 0 10px ${getRoleBadgeColor(employee.role)}50`
      }} />
    </div>
  );
}

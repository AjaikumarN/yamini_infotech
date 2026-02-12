import React from 'react';
import { theme } from '../styles/designSystem';

/**
 * AdminViewBanner - Shows when admin is viewing staff dashboard
 * Calm, informative, non-intrusive
 */
export default function AdminViewBanner({ staffName, onExit }) {
  return (
    <div style={{
      backgroundColor: theme.colors.info.bg,
      borderBottom: `2px solid ${theme.colors.info.main}`,
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      flexWrap: 'wrap'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md
      }}>
        <span style={{ fontSize: theme.typography.fontSize.xl }}>👁️</span>
        <div>
          <p style={{
            margin: 0,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.info.dark
          }}>
            Viewing {staffName}'s Dashboard
          </p>
          <p style={{
            margin: 0,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.secondary,
            marginTop: '2px'
          }}>
            Read-only mode • Monitor activity and verify data
          </p>
        </div>
      </div>

      <button
        onClick={onExit}
        style={{
          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${theme.colors.info.main}`,
          backgroundColor: theme.colors.neutral.white,
          color: theme.colors.info.dark,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          cursor: 'pointer',
          transition: theme.transitions.fast,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.info.light;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.neutral.white;
        }}
      >
        <span>←</span>
        <span>Exit View</span>
      </button>
    </div>
  );
}

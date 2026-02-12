/**
 * Design Tokens - Enterprise Grade Design System
 * Yamini Infotech Admin Portal
 */

export const colors = {
  // Background - Calm, neutral
  background: '#F6F7F9',
  cardBg: '#FFFFFF',
  
  // Brand - Muted, professional
  primary: '#4F7396',        // Muted corporate blue
  primaryHover: '#3D5A75',
  primaryLight: '#E8EDF3',
  primaryDark: '#2A4159',
  
  // Status - Muted, not flashy
  success: '#3D7556',        // Muted green
  successLight: '#E6F3EC',
  warning: '#B8860B',        // Muted amber/gold
  warningLight: '#FFF8E6',
  critical: '#B85450',       // Muted red
  criticalLight: '#FCEEED',
  info: '#4F7396',           // Same as primary
  infoLight: '#E8EDF3',
  
  // Text - Professional hierarchy
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textDisabled: '#D1D5DB',
  
  // Border - Subtle
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Interactive - Calm
  hover: '#F9FAFB',
  active: '#F3F4F6',
  focus: '#4F7396',
  
  // Special - Only for admin view banner
  adminPurple: '#7C3AED',
  adminPurpleLight: '#EDE9FE',
  adminGradientStart: '#667eea',
  adminGradientEnd: '#764ba2',
  
  // Legacy compatibility (map to muted versions)
  white: '#FFFFFF',
  black: '#000000'
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px'
};

export const shadows = {
  card: '0 2px 6px rgba(0, 0, 0, 0.06)',
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.10)',
  modal: '0 10px 25px rgba(0, 0, 0, 0.15)',
  button: '0 1px 3px rgba(0, 0, 0, 0.12)',
  dropdown: '0 4px 6px rgba(0, 0, 0, 0.07)'
};

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)'
};

export const typography = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: {
    xs: '11px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    xxl: '20px',
    xxxl: '24px',
    display: '28px'
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7
  }
};

export const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px'
};

export const zIndex = {
  base: 1,
  dropdown: 1000,
  sticky: 1020,
  modal: 1050,
  popover: 1060,
  tooltip: 1070
};

export const layout = {
  sidebarWidth: '280px',
  sidebarCollapsedWidth: '72px',
  topbarHeight: '64px',
  maxContentWidth: '1600px'
};

export const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
};

/**
 * Enterprise Design System - Mission Control
 * Complete design tokens for Admin Portal
 */

export const theme = {
  // === COLORS ===
  colors: {
    // Primary (Corporate Blue)
    primary: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1E40AF',
      bg: '#EFF6FF',
      text: '#1E40AF'
    },
    
    // Status Colors
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
      bg: '#D1FAE5',
      text: '#065F46'
    },
    
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
      bg: '#FEF3C7',
      text: '#92400E'
    },
    
    danger: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
      bg: '#FEE2E2',
      text: '#991B1B'
    },
    
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
      bg: '#DBEAFE',
      text: '#1E40AF'
    },
    
    // Neutrals
    neutral: {
      white: '#FFFFFF',
      bg: '#F9FAFB',
      bgDark: '#F3F4F6',
      bgDarker: '#E5E7EB',
      border: '#E5E7EB',
      borderDark: '#D1D5DB',
      text: '#6B7280',
      textLight: '#9CA3AF',
      textDisabled: '#D1D5DB'
    },
    
    // Text
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      disabled: '#D1D5DB',
      inverse: '#FFFFFF'
    }
  },
  
  // === SPACING ===
  spacing: {
    0: '0',
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px'
  },
  
  // === TYPOGRAPHY ===
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
      xxxl: '32px',
      xxxxl: '40px'
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  // === LAYOUT ===
  layout: {
    topbarHeight: '64px',
    sidebarWidth: '260px',
    sidebarCollapsed: '64px',
    maxContentWidth: '1600px',
    
    breakpoints: {
      mobile: 640,
      tablet: 768,
      laptop: 1024,
      desktop: 1280,
      wide: 1536
    }
  },
  
  // === BORDERS ===
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    xxl: '24px',
    full: '9999px'
  },
  
  borderWidth: {
    thin: '1px',
    medium: '2px',
    thick: '3px'
  },
  
  // === SHADOWS ===
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  
  // === TRANSITIONS ===
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  // === Z-INDEX ===
  zIndex: {
    base: 1,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    sidebar: 1100
  },
  
  // === STATUS BADGE MAPPING ===
  // Use these functions to get consistent badge styling
  getStatusColor: (status) => {
    const upperStatus = (status || '').toUpperCase().replace(/[_-]/g, '');
    
    // Success statuses
    if (['PAID', 'APPROVED', 'COMPLETED', 'ACTIVE', 'SUCCESS', 'DONE'].includes(upperStatus)) {
      return { bg: '#D1FAE5', color: '#059669' };
    }
    // Warning statuses
    if (['PENDING', 'INPROGRESS', 'ASSIGNED', 'PROCESSING', 'WAITING'].includes(upperStatus)) {
      return { bg: '#FEF3C7', color: '#D97706' };
    }
    // Danger statuses
    if (['FAILED', 'REJECTED', 'OVERDUE', 'CANCELLED', 'ERROR', 'EXPIRED', 'CLOSED'].includes(upperStatus)) {
      return { bg: '#FEE2E2', color: '#DC2626' };
    }
    // Info statuses
    if (['NEW', 'OPEN', 'INFO', 'SCHEDULED'].includes(upperStatus)) {
      return { bg: '#DBEAFE', color: '#2563EB' };
    }
    // Default neutral
    return { bg: '#F3F4F6', color: '#6B7280' };
  }
};

// Helper functions
export const isMobile = () => window.innerWidth < theme.layout.breakpoints.tablet;
export const isTablet = () => window.innerWidth >= theme.layout.breakpoints.tablet && window.innerWidth < theme.layout.breakpoints.laptop;
export const isDesktop = () => window.innerWidth >= theme.layout.breakpoints.laptop;

export const getResponsiveValue = (mobile, tablet, desktop) => {
  if (isMobile()) return mobile;
  if (isTablet()) return tablet;
  return desktop;
};

export default theme;

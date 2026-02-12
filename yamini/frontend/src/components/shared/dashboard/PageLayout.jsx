import React from 'react';

/**
 * Page Layout Component - Able Pro Style
 * Provides consistent page structure for dashboard pages
 * 
 * ⚠️ THIS IS A PAGE CONTENT WRAPPER, NOT A ROUTE LAYOUT
 * Use for page title + actions + content grid
 * DO NOT CONFUSE with /layouts/DashboardLayout (which renders headers/sidebars)
 */
export default function PageLayout({ 
  title, 
  subtitle,
  actions,
  children 
}) {
  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <div style={styles.headerText}>
          <h1 style={styles.title}>{title}</h1>
          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && (
          <div style={styles.actions}>
            {actions}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
}

/**
 * KPI Grid Component
 * Responsive grid for KPI cards
 */
export function KpiGrid({ children, columns = 4 }) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{
      ...styles.grid,
      gridTemplateColumns: isMobile ? '1fr' : `repeat(auto-fit, minmax(${columns === 5 ? '200px' : '240px'}, 1fr))`
    }}>
      {children}
    </div>
  );
}

/**
 * Content Grid Component
 * Flexible grid for dashboard content
 */
export function ContentGrid({ children, columns = '2fr 1fr' }) {
  const [isTablet, setIsTablet] = React.useState(false);

  React.useEffect(() => {
    const checkTablet = () => setIsTablet(window.innerWidth < 1024);
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  return (
    <div style={{
      ...styles.contentGrid,
      gridTemplateColumns: isTablet ? '1fr' : columns
    }}>
      {children}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '100%',
    margin: '0 auto',
    minHeight: 'calc(100vh - 64px)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerText: {
    flex: 1,
    minWidth: '200px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  grid: {
    display: 'grid',
    gap: '20px'
  },
  contentGrid: {
    display: 'grid',
    gap: '24px'
  }
};

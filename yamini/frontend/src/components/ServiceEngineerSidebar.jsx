import React from 'react';
import ModernSidebar from './shared/ModernSidebar';

/**
 * Material Icon Component
 */
const MaterialIcon = ({ name }) => (
  <span 
    className="material-icons"
    style={{
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFeatureSettings: '"liga" 1'
    }}
  >
    {name}
  </span>
);

const ServiceEngineerSidebar = ({ isOpen = true, onClose }) => {
  const config = {
    icon: <MaterialIcon name="engineering" />,
    title: 'Service Engineer',
    subtitle: 'Field Operations',
    theme: 'teal',
    accentColor: '#06B6D4',
    gradientStart: '#06B6D4',
    gradientEnd: '#0EA5A4',
    sections: [
      {
        title: 'Main',
        items: [
          { path: '/engineer/dashboard', icon: <MaterialIcon name="dashboard" />, label: 'Dashboard' },
          { path: '/engineer/attendance', icon: <MaterialIcon name="access_time" />, label: 'Daily Check-in' },
        ]
      },
      {
        title: 'Work Management',
        items: [
          { path: '/engineer/jobs', icon: <MaterialIcon name="assignment" />, label: 'Assigned Work' },
          { path: '/engineer/history', icon: <MaterialIcon name="history" />, label: 'Service Log' },
          { path: '/engineer/sla-tracker', icon: <MaterialIcon name="trending_up" />, label: 'SLA Tracker' },
        ]
      },
      {
        title: 'Reports & Feedback',
        items: [
          { path: '/engineer/feedback', icon: <MaterialIcon name="star" />, label: 'Customer Feedback' },
          { path: '/engineer/daily-report', icon: <MaterialIcon name="bar_chart" />, label: 'Daily Report' },
        ]
      }
    ]
  };

  return <ModernSidebar isOpen={isOpen} onClose={onClose} config={config} />;
};

export default ServiceEngineerSidebar;

import React from 'react';
import '../styles/salesman.css';

/**
 * Compliance Page - Discipline and compliance rules
 * Read-only information display
 */
export default function Compliance() {
  const rules = [
    {
      category: 'Attendance',
      icon: '🕘',
      items: [
        'Mark attendance daily for better tracking (optional but recommended)',
        'Attendance includes photo verification and GPS location',
        'Check-in before 10:00 AM for on-time tracking',
      ],
    },
    {
      category: 'Communication',
      icon: '📞',
      items: [
        'Respond to customer enquiries within 24 hours',
        'Log all customer calls in the system',
        'Update enquiry status after each interaction',
        'Professional communication at all times',
      ],
    },
    {
      category: 'Reporting',
      icon: '📝',
      items: [
        'Submit daily report at end of day',
        'Include accurate call counts and meeting details',
        'Report challenges and achievements honestly',
        'Plan for next day activities',
      ],
    },
    {
      category: 'Follow-Ups',
      icon: '🔁',
      items: [
        'Follow up with interested leads within 2 days',
        'Schedule callbacks as promised',
        'Track all follow-up activities in the system',
        'Convert qualified leads to orders',
      ],
    },
    {
      category: 'Customer Service',
      icon: '🤝',
      items: [
        'Maintain professional behavior with all customers',
        'Provide accurate product information',
        'Handle customer complaints promptly',
        'Seek manager assistance when needed',
      ],
    },
    {
      category: 'Data Management',
      icon: '📊',
      items: [
        'Keep customer data confidential',
        'Update CRM with accurate information',
        'Do not share login credentials',
        'Report any system issues immediately',
      ],
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Discipline & Compliance</h2>
        <p className="page-description">Guidelines and best practices for salesman</p>
      </div>

      <div className="compliance-intro">
        <p>
          These guidelines ensure professionalism, accountability, and consistent customer service. 
          Following these rules helps you succeed and builds trust with customers and management.
        </p>
      </div>

      {rules.map((rule, index) => (
        <div key={index} className="compliance-section">
          <div className="compliance-header">
            <span className="compliance-icon">{rule.icon}</span>
            <h3 className="compliance-title">{rule.category}</h3>
          </div>
          <ul className="compliance-list">
            {rule.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      <div className="compliance-footer">
        <div className="compliance-footer-card">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h3 style={{ marginBottom: '8px' }}>Commitment to Excellence</h3>
          <p style={{ color: '#64748B' }}>
            Following these guidelines ensures we deliver the best service to our customers and 
            maintain high professional standards across the team.
          </p>
        </div>
      </div>
    </div>
  );
}

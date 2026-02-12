import React, { useState, useEffect } from 'react';
import { getMyCalls, markCallCompleted } from '../hooks/useSalesmanApi';
import { showToast } from '../components/ToastNotification';
import EmptyState from '../components/EmptyState';
import ActionButton from '../../components/shared/dashboard/ActionButton';
import DataCard from '../../components/shared/dashboard/DataCard';
import StatusBadge from '../../components/shared/dashboard/StatusBadge';
import '../styles/salesman.css';

/**
 * FollowUps Page - View calls that need follow-up
 * Filters calls where outcome is "callback"
 */
export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowUps();
  }, []);

  const loadFollowUps = async () => {
    try {
      const allCalls = await getMyCalls(false);
      // Filter for calls that need follow-up and sort by date
      const pending = allCalls
        .filter(call => call.outcome === 'callback' || call.outcome === 'interested')
        .map(call => {
          const callDate = new Date(call.created_at);
          const today = new Date();
          const daysSince = Math.floor((today - callDate) / (1000 * 60 * 60 * 24));
          
          // Determine priority and status
          let priority = 'medium';
          let status = 'pending';
          
          if (daysSince > 3) {
            priority = 'high';
            status = 'overdue';
          } else if (daysSince > 1) {
            priority = 'medium';
          } else {
            priority = 'low';
          }
          
          return { ...call, priority, status, daysSince };
        })
        .sort((a, b) => {
          // Sort: overdue first, then by days since contact
          if (a.status === 'overdue' && b.status !== 'overdue') return -1;
          if (a.status !== 'overdue' && b.status === 'overdue') return 1;
          return b.daysSince - a.daysSince;
        });
        
      setFollowUps(pending);
    } catch (error) {
      console.error('Failed to load follow-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (call) => {
    if (!confirm(`Mark follow-up with ${call.customer_name} as completed?`)) {
      return;
    }

    try {
      await markCallCompleted(call.id);
      showToast && showToast('✅ Follow-up marked as completed!', 'success');
      loadFollowUps(); // Refresh the list
    } catch (error) {
      console.error('Failed to mark as completed:', error);
      showToast && showToast('Failed to mark as completed. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#6B7280' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
            Follow-Ups
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            {followUps.length} pending follow-ups • Keep your pipeline active
          </p>
        </div>
        <ActionButton 
          variant="primary" 
          icon="phone"
          onClick={() => window.location.href = '/salesman/calls'}
        >
          View All Calls
        </ActionButton>
      </div>      {followUps.length === 0 ? (
        <EmptyState 
          icon="✅" 
          message="No pending follow-ups. Great job staying on top of your calls!" 
        />
      ) : (
        <DataCard
          title={`Follow-Ups (${followUps.length})`}
          subtitle="Customers awaiting your callback"
          noPadding
        >
          {/* Follow-ups Table */}
          <div style={{ overflowX: 'auto' }}>
            <div>
              {followUps.map((call, index) => (
                <div 
                  key={call.id} 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 2fr 1fr 1.5fr',
                    gap: '16px',
                    padding: '16px 20px',
                    borderBottom: index < followUps.length - 1 ? '1px solid #F3F4F6' : 'none',
                    alignItems: 'center',
                    transition: 'background-color 0.15s',
                    background: call.status === 'overdue' ? '#FEF2F2' : '#FFFFFF',
                    minWidth: '800px'
                  }}
                  onMouseEnter={(e) => {
                    if (call.status !== 'overdue') {
                      e.currentTarget.style.background = '#F9FAFB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (call.status !== 'overdue') {
                      e.currentTarget.style.background = '#FFFFFF';
                    }
                  }}
                >
                  {/* Customer Name + Priority */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 600, 
                        color: '#111827'
                      }}>
                        {call.customer_name}
                      </div>
                      {/* Priority Badge */}
                      <StatusBadge 
                        status={call.priority?.toUpperCase() || 'MEDIUM'}
                        variant={call.priority?.toLowerCase() || 'medium'}
                        size="sm"
                        dot
                      />
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6B7280'
                    }}>
                      ☎️ {call.phone}
                    </div>
                  </div>

                  {/* Last Contact */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Last Contact
                    </div>
                    <div style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>
                      {call.daysSince === 0 ? 'Today' :
                       call.daysSince === 1 ? 'Yesterday' :
                       `${call.daysSince}d ago`}
                    </div>
                  </div>

                  {/* Notes */}
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#6B7280'
                  }}>
                    {call.notes || 'No notes'}
                  </div>

                  {/* Status Badge */}
                  <div>
                    <StatusBadge 
                      status={call.status === 'overdue' ? 'OVERDUE' : 'PENDING'}
                      variant={call.status === 'overdue' ? 'danger' : 'warning'}
                      size="sm"
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Call Button */}
                    <a 
                      href={`tel:${call.phone}`}
                      title="Call customer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#1E40AF';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#2563EB';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      ☎️
                    </a>
                    
                    {/* Complete Button */}
                    <button 
                      onClick={() => handleMarkCompleted(call)}
                      title="Mark as completed"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: '#F3F4F6',
                        color: '#374151',
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#10B981';
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F3F4F6';
                        e.currentTarget.style.color = '#374151';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DataCard>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getCallStats } from '../../services/callService';

/**
 * CallTrackerWidget - Shows today's call progress
 * 
 * @param {number} targetCalls - Daily call target (default: 40)
 * @param {Object} externalStats - Optional pre-fetched stats to avoid duplicate API calls
 * @param {Function} onRefresh - Optional callback when refresh is triggered
 */
export default function CallTrackerWidget({ 
  targetCalls = 40, 
  externalStats = null,
  onRefresh = null 
}) {
  const [callStats, setCallStats] = useState({
    total: 0,
    purchased: 0,
    interested: 0,
    notInterested: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If external stats provided, use them
    if (externalStats) {
      setCallStats({
        total: externalStats.todayCalls ?? externalStats.today_calls ?? 0,
        purchased: externalStats.purchasedCount ?? externalStats.purchased_count ?? 0,
        interested: externalStats.interestedBuyLaterCount ?? externalStats.interested_buy_later_count ?? 0,
        notInterested: externalStats.notInterestedCount ?? externalStats.not_interested_count ?? 0
      });
      setLoading(false);
      return;
    }
    
    fetchCallStats();
    // Refresh every 2 minutes
    const interval = setInterval(fetchCallStats, 120000);
    return () => clearInterval(interval);
  }, [externalStats]);

  const fetchCallStats = async () => {
    try {
      // Use centralized call service
      const stats = await getCallStats();
      setCallStats({
        total: stats.todayCalls || 0,
        purchased: stats.purchasedCount || 0,
        interested: stats.interestedBuyLaterCount || 0,
        notInterested: stats.notInterestedCount || 0
      });
    } catch (error) {
      console.warn('Call stats API error:', error);
      setCallStats({
        total: 0,
        purchased: 0,
        interested: 0,
        notInterested: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      fetchCallStats();
    }
  };

  const progress = (callStats.total / targetCalls) * 100;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '24px',
      color: 'white',
      boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '800',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📞 Calls Made Today
        </h3>
        <button
          onClick={handleRefresh}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
        >
          🔄
        </button>
      </div>

      {/* MAIN COUNT */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '12px'
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: '900',
          lineHeight: 1
        }}>
          {loading ? '—' : callStats.total}
        </div>
        <div style={{
          fontSize: '20px',
          opacity: 0.9,
          fontWeight: '600'
        }}>
          / {targetCalls}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{
        width: '100%',
        height: '12px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '999px',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(progress, 100)}%`,
          background: progress >= 100 
            ? 'linear-gradient(90deg, #10b981, #059669)' 
            : 'linear-gradient(90deg, #fff, rgba(255,255,255,0.8))',
          borderRadius: '999px',
          transition: 'width 0.5s ease',
          boxShadow: '0 0 10px rgba(255,255,255,0.5)'
        }} />
      </div>

      {/* CALL OUTCOME CATEGORIES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginTop: 'auto'
      }}>
        {[
          { label: 'Purchased', count: callStats.purchased, icon: '✅', color: '#10b981' },
          { label: 'Buy Later', count: callStats.interested, icon: '📅', color: '#f59e0b' },
          { label: 'Not Interested', count: callStats.notInterested, icon: '❌', color: '#ef4444' }
        ].map(category => (
          <div key={category.label} style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>
              {category.icon}
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '900',
              marginBottom: '2px'
            }}>
              {loading ? '—' : category.count}
            </div>
            <div style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '700',
              opacity: 0.9
            }}>
              {category.label}
            </div>
          </div>
        ))}
      </div>

      {/* TARGET MESSAGE */}
      <div style={{
        fontSize: '12px',
        textAlign: 'center',
        opacity: 0.85,
        fontWeight: '600',
        padding: '8px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px'
      }}>
        {progress >= 100 
          ? '🎉 Target achieved! Great work!' 
          : `${Math.round(progress)}% of daily target`
        }
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import '../styles/salesman.css';

/**
 * AdvancedAnalytics - Performance charts and metrics
 * Shows trends, comparisons, and insights
 */
export default function AdvancedAnalytics({ data }) {
  const [timeframe, setTimeframe] = useState('week'); // week, month, year
  const [chartType, setChartType] = useState('line'); // line, bar, pie

  // Calculate trends
  const calculateTrend = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Mock data - replace with real API data
  const metrics = {
    callsThisWeek: data?.callsThisWeek || 42,
    callsLastWeek: data?.callsLastWeek || 35,
    conversionRate: data?.conversionRate || 23.5,
    avgCallDuration: data?.avgCallDuration || 8.5,
    topPerformingDay: data?.topPerformingDay || 'Monday',
  };

  const callsTrend = calculateTrend(metrics.callsThisWeek, metrics.callsLastWeek);

  return (
    <div className="advanced-analytics">
      {/* Header */}
      <div className="analytics-header">
        <h3 className="section-title">Performance Analytics</h3>
        <div className="analytics-controls">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="form-control form-control-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="form-control form-control-sm"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>
      </div>

      {/* Key Metrics with Trends */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">📞</span>
            <span className="metric-label">Total Calls</span>
          </div>
          <div className="metric-value">{metrics.callsThisWeek}</div>
          <div className={`metric-trend ${callsTrend >= 0 ? 'positive' : 'negative'}`}>
            {callsTrend >= 0 ? '↑' : '↓'} {Math.abs(callsTrend)}% vs last {timeframe}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🎯</span>
            <span className="metric-label">Conversion Rate</span>
          </div>
          <div className="metric-value">{metrics.conversionRate}%</div>
          <div className="metric-trend positive">↑ 2.3% vs last {timeframe}</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">⏱️</span>
            <span className="metric-label">Avg Call Duration</span>
          </div>
          <div className="metric-value">{metrics.avgCallDuration} min</div>
          <div className="metric-trend neutral">→ Same as last {timeframe}</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">⭐</span>
            <span className="metric-label">Best Day</span>
          </div>
          <div className="metric-value">{metrics.topPerformingDay}</div>
          <div className="metric-subtitle">Peak performance</div>
        </div>
      </div>

      {/* Simple Bar Chart (ASCII-style for simplicity) */}
      <div className="chart-container">
        <h4 className="chart-title">Calls by Day</h4>
        <div className="ascii-chart">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
            const value = [8, 12, 6, 15, 10, 4, 3][idx];
            const maxValue = 15;
            const percentage = (value / maxValue) * 100;
            
            return (
              <div key={day} className="chart-bar-row">
                <span className="chart-label">{day}</span>
                <div className="chart-bar-container">
                  <div 
                    className="chart-bar" 
                    style={{ width: `${percentage}%` }}
                    title={`${value} calls`}
                  >
                    <span className="chart-value">{value}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="insights-section">
        <h4 className="section-title">💡 Insights & Recommendations</h4>
        <div className="insights-list">
          <div className="insight-card success">
            <span className="insight-icon">✅</span>
            <div className="insight-content">
              <strong>Great Progress!</strong>
              <p>You've increased your call volume by {Math.abs(callsTrend)}% this week.</p>
            </div>
          </div>
          <div className="insight-card warning">
            <span className="insight-icon">⚠️</span>
            <div className="insight-content">
              <strong>Weekend Opportunity</strong>
              <p>Your weekend call volume is low. Consider scheduling follow-ups.</p>
            </div>
          </div>
          <div className="insight-card info">
            <span className="insight-icon">💡</span>
            <div className="insight-content">
              <strong>Best Time to Call</strong>
              <p>Your highest conversion rate is between 10 AM - 12 PM.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Position */}
      <div className="leaderboard-card">
        <h4 className="section-title">🏆 Your Ranking</h4>
        <div className="leaderboard-position">
          <div className="rank-badge">#3</div>
          <div className="rank-info">
            <p>You're ranked <strong>3rd</strong> out of 12 salespeople</p>
            <p className="rank-subtitle">Just 5 calls away from #2!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

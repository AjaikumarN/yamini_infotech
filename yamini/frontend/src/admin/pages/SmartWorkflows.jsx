import React, { useState, useEffect } from 'react';
import { Zap, Play, Pause, Clock, Bell, AlertTriangle, CheckCircle, Settings, Plus, Trash2 } from 'lucide-react';
import workflowService from '../../services/workflowService';

/**
 * Smart Workflows Admin Panel
 * Configure and monitor automated business processes
 */
export default function SmartWorkflows() {
  const [workflows, setWorkflows] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Load current workflow rules from service
    const rules = workflowService.getRules();
    setWorkflows(rules.map((rule, index) => ({
      id: index + 1,
      ...rule,
      enabled: true,
      lastTriggered: null,
      triggerCount: 0
    })));

    // Subscribe to workflow events
    workflowService.onRuleTriggered = (ruleId, result) => {
      setRecentEvents(prev => [{
        id: Date.now(),
        ruleId,
        ...result,
        timestamp: new Date()
      }, ...prev.slice(0, 19)]); // Keep last 20 events

      // Update trigger count
      setWorkflows(prev => prev.map(w => 
        w.id === ruleId 
          ? { ...w, lastTriggered: new Date(), triggerCount: (w.triggerCount || 0) + 1 }
          : w
      ));
    };

    // Clean up
    return () => {
      workflowService.onRuleTriggered = null;
    };
  }, []);

  const toggleWorkflow = (id) => {
    setWorkflows(prev => prev.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'notification': return <Bell size={16} />;
      case 'alert': return <AlertTriangle size={16} />;
      case 'auto_action': return <Zap size={16} />;
      default: return <Settings size={16} />;
    }
  };

  const getTriggerTypeLabel = (trigger) => {
    switch (trigger?.type) {
      case 'time': return `⏰ Time: ${trigger.time}`;
      case 'event': return `📍 Event: ${trigger.event}`;
      case 'condition': return `📊 Condition-based`;
      default: return '🔄 Manual';
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>⚡ Smart Workflows</h2>
          <p style={styles.subtitle}>Automate repetitive tasks and reduce manual work</p>
        </div>
        <button onClick={() => setShowAddForm(true)} style={styles.addBtn}>
          <Plus size={18} />
          New Workflow
        </button>
      </div>

      {/* Stats Overview */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <Zap size={24} color="#4F46E5" />
          <div>
            <div style={styles.statCount}>{workflows.length}</div>
            <div style={styles.statLabel}>Active Workflows</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <CheckCircle size={24} color="#10b981" />
          <div>
            <div style={styles.statCount}>
              {workflows.reduce((sum, w) => sum + (w.triggerCount || 0), 0)}
            </div>
            <div style={styles.statLabel}>Total Executions</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <Clock size={24} color="#f59e0b" />
          <div>
            <div style={styles.statCount}>
              {workflows.filter(w => w.trigger?.type === 'time').length}
            </div>
            <div style={styles.statLabel}>Scheduled</div>
          </div>
        </div>
      </div>

      {/* Workflows Grid */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Configured Workflows</h3>
        <div style={styles.workflowGrid}>
          {workflows.map(workflow => (
            <div 
              key={workflow.id} 
              style={{
                ...styles.workflowCard,
                opacity: workflow.enabled ? 1 : 0.6
              }}
            >
              <div style={styles.workflowHeader}>
                <div style={styles.workflowIcon}>
                  {getActionIcon(workflow.action)}
                </div>
                <div style={styles.workflowInfo}>
                  <div style={styles.workflowName}>{workflow.name}</div>
                  <div style={styles.workflowTrigger}>
                    {getTriggerTypeLabel(workflow.trigger)}
                  </div>
                </div>
                <button 
                  onClick={() => toggleWorkflow(workflow.id)}
                  style={{
                    ...styles.toggleBtn,
                    background: workflow.enabled ? '#4F46E5' : '#9ca3af'
                  }}
                >
                  {workflow.enabled ? <Play size={14} /> : <Pause size={14} />}
                </button>
              </div>
              
              <p style={styles.workflowDesc}>{workflow.description}</p>
              
              <div style={styles.workflowMeta}>
                <span>Runs: {workflow.triggerCount || 0}</span>
                <span>Last: {workflow.lastTriggered ? formatTime(workflow.lastTriggered) : 'Never'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Recent Workflow Events</h3>
        {recentEvents.length === 0 ? (
          <div style={styles.noEvents}>
            <Clock size={48} color="#d1d5db" />
            <p>No workflow events yet today</p>
            <span>Events will appear here as workflows are triggered</span>
          </div>
        ) : (
          <div style={styles.eventsList}>
            {recentEvents.map(event => (
              <div key={event.id} style={styles.eventCard}>
                <div style={{
                  ...styles.eventIcon,
                  background: event.success ? '#dcfce7' : '#fef2f2'
                }}>
                  {event.success ? <CheckCircle size={16} color="#16a34a" /> : <AlertTriangle size={16} color="#dc2626" />}
                </div>
                <div style={styles.eventContent}>
                  <div style={styles.eventName}>{event.rule}</div>
                  <div style={styles.eventMessage}>{event.message}</div>
                </div>
                <div style={styles.eventTime}>
                  {formatTime(event.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workflow Types Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Available Automation Types</h3>
        <div style={styles.typesGrid}>
          <div style={styles.typeCard}>
            <div style={{ ...styles.typeIcon, background: '#ede9fe' }}>
              <Clock size={20} color="#7c3aed" />
            </div>
            <h4>Time-Based</h4>
            <p>Trigger at specific times (9AM attendance reminder, 6PM checkout)</p>
          </div>
          <div style={styles.typeCard}>
            <div style={{ ...styles.typeIcon, background: '#dbeafe' }}>
              <Bell size={20} color="#2563eb" />
            </div>
            <h4>Event-Based</h4>
            <p>React to events (SLA breach, geofence entry/exit)</p>
          </div>
          <div style={styles.typeCard}>
            <div style={{ ...styles.typeIcon, background: '#dcfce7' }}>
              <Zap size={20} color="#16a34a" />
            </div>
            <h4>Auto-Actions</h4>
            <p>Automatic task assignment, report generation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0'
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '32px'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  statCount: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1f2937'
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px'
  },
  workflowGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px'
  },
  workflowCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 0.2s'
  },
  workflowHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px'
  },
  workflowIcon: {
    padding: '10px',
    background: '#f3f4f6',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  workflowInfo: {
    flex: 1
  },
  workflowName: {
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '2px'
  },
  workflowTrigger: {
    fontSize: '12px',
    color: '#6b7280'
  },
  toggleBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: 'none',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  workflowDesc: {
    fontSize: '13px',
    color: '#4b5563',
    marginBottom: '12px',
    lineHeight: '1.5'
  },
  workflowMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#9ca3af',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6'
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  noEvents: {
    textAlign: 'center',
    padding: '40px',
    background: '#f9fafb',
    borderRadius: '12px',
    color: '#6b7280'
  },
  eventCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  },
  eventIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  eventContent: {
    flex: 1
  },
  eventName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1f2937'
  },
  eventMessage: {
    fontSize: '12px',
    color: '#6b7280'
  },
  eventTime: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  typesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px'
  },
  typeCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    textAlign: 'center'
  },
  typeIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px'
  }
};

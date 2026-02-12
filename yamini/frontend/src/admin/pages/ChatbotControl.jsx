import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

export default function ChatbotControl() {
  const [activeTab, setActiveTab] = useState('knowledge');
  const [knowledge, setKnowledge] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [handoffs, setHandoffs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'knowledge') {
        const data = await apiRequest('/api/chatbot/knowledge');
        setKnowledge(data);
      } else if (activeTab === 'sessions') {
        const data = await apiRequest('/api/chatbot/sessions?limit=50');
        setSessions(data);
      } else if (activeTab === 'handoffs') {
        const data = await apiRequest('/api/chatbot/handoffs?status=pending');
        setHandoffs(data);
      } else if (activeTab === 'analytics') {
        const data = await apiRequest('/api/chatbot/analytics/dashboard?days=7');
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const rebuildIndex = async () => {
    if (!confirm('Rebuild FAISS vector index? This may take a moment.')) return;
    try {
      await apiRequest('/api/chatbot/knowledge/rebuild-index', { method: 'POST' });
      alert('✅ Vector index rebuilt successfully');
    } catch (error) {
      alert('❌ Failed to rebuild index');
    }
  };

  const deleteKnowledge = async (id) => {
    if (!confirm('Delete this knowledge document?')) return;
    try {
      await apiRequest(`/api/chatbot/knowledge/${id}`, { method: 'DELETE' });
      loadData();
      alert('✅ Deleted successfully');
    } catch (error) {
      alert('❌ Failed to delete');
    }
  };

  const toggleKnowledgeActive = async (id, isActive) => {
    try {
      await apiRequest(`/api/chatbot/knowledge/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !isActive })
      });
      loadData();
    } catch (error) {
      alert('❌ Failed to update');
    }
  };

  const assignHandoff = async (id) => {
    try {
      await apiRequest(`/api/chatbot/handoffs/${id}/assign`, { method: 'PUT' });
      alert('✅ Handoff assigned to you');
      loadData();
    } catch (error) {
      alert('❌ Failed to assign');
    }
  };

  const ui = {
    shell: {
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f7f9fc 0%, #eef2f9 100%)',
      padding: '26px'
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px'
    },
    hero: {
      borderRadius: '18px',
      padding: '24px',
      background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      color: 'white',
      boxShadow: '0 18px 38px rgba(6,182,212,0.25)'
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginTop: '16px'
    },
    tab: (active) => ({
      padding: '10px 20px',
      borderRadius: '12px',
      background: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)',
      color: active ? '#0891b2' : 'white',
      border: 'none',
      fontWeight: active ? 700 : 500,
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s'
    }),
    section: {
      background: 'rgba(255,255,255,0.95)',
      borderRadius: '16px',
      border: '1px solid #e4e7ef',
      boxShadow: '0 14px 26px rgba(15,23,42,0.08)',
      padding: '24px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginTop: '20px'
    },
    statCard: {
      padding: '20px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      border: '1px solid #bae6fd'
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 8px'
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      color: '#64748b',
      fontSize: '13px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    td: {
      padding: '14px 12px',
      background: 'white',
      borderTop: '1px solid #f1f5f9',
      borderBottom: '1px solid #f1f5f9'
    },
    badge: (color) => ({
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 600,
      background: color === 'green' ? '#dcfce7' : color === 'red' ? '#fee2e2' : '#e0e7ff',
      color: color === 'green' ? '#166534' : color === 'red' ? '#991b1b' : '#4338ca'
    }),
    btn: (variant = 'primary') => ({
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: 600,
      fontSize: '13px',
      cursor: 'pointer',
      background: variant === 'primary' ? 'linear-gradient(135deg,#06b6d4,#0891b2)' : 
                  variant === 'danger' ? '#ef4444' : '#94a3b8',
      color: 'white',
      boxShadow: '0 4px 12px rgba(6,182,212,0.3)',
      transition: 'transform 0.15s'
    }),
    input: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid #d5d9e3',
      fontSize: '14px',
      background: '#f8fafc',
      marginBottom: '12px'
    },
    textarea: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid #d5d9e3',
      fontSize: '14px',
      background: '#f8fafc',
      minHeight: '100px',
      fontFamily: 'inherit',
      marginBottom: '12px',
      resize: 'vertical'
    }
  };

  return (
    <div style={ui.shell}>
      <div style={ui.container}>
        {/* Hero */}
        <div style={ui.hero}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>🤖</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>AI Chatbot Control Panel</h1>
              <p style={{ margin: '6px 0 0 0', opacity: 0.9 }}>
                Manage customer support chatbot • English + Tamil • ERP-integrated
              </p>
            </div>
          </div>
          
          <div style={ui.tabs}>
            <button style={ui.tab(activeTab === 'knowledge')} onClick={() => setActiveTab('knowledge')}>
              📚 Knowledge Base
            </button>
            <button style={ui.tab(activeTab === 'sessions')} onClick={() => setActiveTab('sessions')}>
              💬 Live Chats
            </button>
            <button style={ui.tab(activeTab === 'handoffs')} onClick={() => setActiveTab('handoffs')}>
              🤝 Handoff Queue {handoffs.length > 0 && `(${handoffs.length})`}
            </button>
            <button style={ui.tab(activeTab === 'analytics')} onClick={() => setActiveTab('analytics')}>
              📊 Analytics
            </button>
          </div>
        </div>

        {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
          <div style={ui.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Knowledge Base Management</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={ui.btn('secondary')} onClick={rebuildIndex}>
                  🔄 Rebuild Vector Index
                </button>
                <button style={ui.btn('primary')} onClick={() => setShowAddKnowledge(true)}>
                  + Add Knowledge
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</div>
            ) : (
              <table style={ui.table}>
                <thead>
                  <tr>
                    <th style={ui.th}>Title</th>
                    <th style={ui.th}>Category</th>
                    <th style={ui.th}>Language</th>
                    <th style={ui.th}>Usage</th>
                    <th style={ui.th}>Status</th>
                    <th style={ui.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {knowledge.map(kb => (
                    <tr key={kb.id}>
                      <td style={{ ...ui.td, fontWeight: 600 }}>{kb.title}</td>
                      <td style={ui.td}>
                        <span style={ui.badge('blue')}>{kb.category}</span>
                      </td>
                      <td style={ui.td}>
                        {kb.content_en && '🇬🇧'} {kb.content_ta && '🇮🇳'}
                      </td>
                      <td style={ui.td}>{kb.usage_count || 0} times</td>
                      <td style={ui.td}>
                        <span style={ui.badge(kb.is_active ? 'green' : 'red')}>
                          {kb.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={ui.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            style={{ ...ui.btn('secondary'), padding: '6px 12px' }}
                            onClick={() => toggleKnowledgeActive(kb.id, kb.is_active)}
                          >
                            {kb.is_active ? '⏸️ Disable' : '▶️ Enable'}
                          </button>
                          <button 
                            style={{ ...ui.btn('danger'), padding: '6px 12px' }}
                            onClick={() => deleteKnowledge(kb.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Live Chats Tab */}
        {activeTab === 'sessions' && (
          <div style={ui.section}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 800 }}>Recent Chat Sessions</h2>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</div>
            ) : (
              <table style={ui.table}>
                <thead>
                  <tr>
                    <th style={ui.th}>Customer</th>
                    <th style={ui.th}>Language</th>
                    <th style={ui.th}>Messages</th>
                    <th style={ui.th}>Status</th>
                    <th style={ui.th}>Started</th>
                    <th style={ui.th}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => (
                    <tr key={session.session_id}>
                      <td style={{ ...ui.td, fontWeight: 600 }}>
                        {session.customer_name || 'Anonymous'}
                        {session.customer_phone && <div style={{ fontSize: '12px', color: '#64748b' }}>{session.customer_phone}</div>}
                      </td>
                      <td style={ui.td}>{session.language === 'en' ? '🇬🇧 English' : '🇮🇳 Tamil'}</td>
                      <td style={ui.td}>{session.message_count}</td>
                      <td style={ui.td}>
                        <span style={ui.badge(
                          session.status === 'active' ? 'green' : 
                          session.status === 'handed_off' ? 'blue' : 'gray'
                        )}>
                          {session.status}
                        </span>
                      </td>
                      <td style={ui.td}>{new Date(session.started_at).toLocaleString()}</td>
                      <td style={ui.td}>
                        {session.avg_confidence ? `${(session.avg_confidence * 100).toFixed(0)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Handoffs Tab */}
        {activeTab === 'handoffs' && (
          <div style={ui.section}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 800 }}>Handoff Queue - Needs Human Help</h2>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</div>
            ) : handoffs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                🎉 No pending handoffs - Chatbot is handling everything!
              </div>
            ) : (
              <table style={ui.table}>
                <thead>
                  <tr>
                    <th style={ui.th}>Customer</th>
                    <th style={ui.th}>Reason</th>
                    <th style={ui.th}>Priority</th>
                    <th style={ui.th}>Summary</th>
                    <th style={ui.th}>Time</th>
                    <th style={ui.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {handoffs.map(handoff => (
                    <tr key={handoff.id}>
                      <td style={{ ...ui.td, fontWeight: 600 }}>
                        {handoff.customer_name || 'Anonymous'}
                        {handoff.customer_phone && <div style={{ fontSize: '12px', color: '#64748b' }}>{handoff.customer_phone}</div>}
                      </td>
                      <td style={ui.td}>{handoff.reason}</td>
                      <td style={ui.td}>
                        <span style={ui.badge(handoff.priority === 'urgent' ? 'red' : 'blue')}>
                          {handoff.priority}
                        </span>
                      </td>
                      <td style={ui.td}>{handoff.summary}</td>
                      <td style={ui.td}>{new Date(handoff.created_at).toLocaleString()}</td>
                      <td style={ui.td}>
                        <button 
                          style={ui.btn('primary')}
                          onClick={() => assignHandoff(handoff.id)}
                        >
                          👤 Assign to Me
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div style={ui.section}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 800 }}>
              Performance Analytics (Last {analytics.period_days} Days)
            </h2>
            
            <div style={ui.statsGrid}>
              <div style={ui.statCard}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>TOTAL SESSIONS</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#0891b2' }}>{analytics.sessions.total}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {analytics.sessions.avg_per_day}/day avg
                </div>
              </div>

              <div style={ui.statCard}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>ENQUIRIES CREATED</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#0891b2' }}>{analytics.enquiries_created}</div>
                <div style={{ fontSize: '13px', color: '#10b981', marginTop: '4px' }}>
                  {analytics.conversion_rate}% conversion rate
                </div>
              </div>

              <div style={ui.statCard}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>AVG CONFIDENCE</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#0891b2' }}>
                  {(analytics.avg_confidence * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Bot certainty</div>
              </div>

              <div style={ui.statCard}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>HANDOFF RATE</div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#0891b2' }}>{analytics.handoffs.rate}%</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {analytics.handoffs.pending} pending
                </div>
              </div>
            </div>

            {/* Language Distribution */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Language Distribution</h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                {Object.entries(analytics.language_distribution).map(([lang, count]) => (
                  <div key={lang} style={{ flex: 1, padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '6px' }}>
                      {lang === 'en' ? '🇬🇧 English' : '🇮🇳 Tamil'}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>{count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Intents */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Top Customer Intents</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analytics.top_intents.map(item => (
                  <div key={item.intent} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span style={{ ...ui.badge('blue'), minWidth: '100px' }}>{item.intent}</span>
                    <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${(item.count / analytics.sessions.total) * 100}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #06b6d4, #0891b2)' 
                      }} />
                    </div>
                    <span style={{ fontWeight: 700, minWidth: '60px', textAlign: 'right' }}>{item.count} times</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Knowledge Modal */}
      {showAddKnowledge && <AddKnowledgeModal onClose={() => { setShowAddKnowledge(false); loadData(); }} />}
    </div>
  );
}

function AddKnowledgeModal({ onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    content_en: '',
    content_ta: '',
    category: 'faq',
    keywords: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/chatbot/knowledge', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      alert('✅ Knowledge added successfully');
      onClose();
    } catch (error) {
      alert('❌ Failed to add knowledge');
    }
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  };

  const formStyle = {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto'
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={formStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 800 }}>Add Knowledge Document</h2>
        
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9e3', marginBottom: '16px' }}
          />

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9e3', marginBottom: '16px' }}
          >
            <option value="faq">FAQ</option>
            <option value="product">Product</option>
            <option value="service">Service</option>
            <option value="amc">AMC</option>
            <option value="policy">Policy</option>
            <option value="warranty">Warranty</option>
            <option value="complaint">Complaint Resolution</option>
          </select>

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Content (English)</label>
          <textarea
            value={formData.content_en}
            onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9e3', minHeight: '100px', marginBottom: '16px', fontFamily: 'inherit' }}
          />

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Content (Tamil) - Optional</label>
          <textarea
            value={formData.content_ta}
            onChange={(e) => setFormData({ ...formData, content_ta: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9e3', minHeight: '100px', marginBottom: '16px', fontFamily: 'inherit' }}
          />

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Keywords (comma-separated)</label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            placeholder="printer, installation, setup"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9e3', marginBottom: '20px' }}
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d5d9e3', background: 'white', fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
              Add Knowledge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

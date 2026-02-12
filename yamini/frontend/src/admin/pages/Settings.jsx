import React, { useState } from 'react';
import { apiRequest } from '../../utils/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    company_name: 'Yamini Infotech',
    email: 'info@yamini-infotech.com',
    phone: '+91 1234567890',
    address: 'Business Address',
    sla_normal_hours: 24,
    sla_urgent_hours: 6,
    sla_critical_hours: 2,
    attendance_cutoff_time: '09:30',
    ai_model_enabled: true,
    ai_model_name: 'Claude Haiku 4.5'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      alert('✅ Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const ui = {
    shell: {
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f7f9fc 0%, #eef2f9 100%)',
      padding: '26px'
    },
    container: {
      maxWidth: '1120px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px'
    },
    hero: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '18px',
      padding: '20px',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)',
      color: 'white',
      boxShadow: '0 18px 38px rgba(79,70,229,0.25)'
    },
    heroOverlay: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.18), transparent 36%), radial-gradient(circle at 82% 0%, rgba(255,255,255,0.16), transparent 30%)'
    },
    heroContent: { position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px' },
    pill: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '999px',
      background: 'rgba(255,255,255,0.16)',
      border: '1px solid rgba(255,255,255,0.3)',
      fontWeight: 700,
      letterSpacing: '0.3px'
    },
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '10px',
      marginTop: '6px'
    },
    statCard: (accent) => ({
      borderRadius: '14px',
      padding: '14px',
      background: accent,
      color: '#0f172a',
      border: '1px solid rgba(255,255,255,0.35)',
      boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
      backdropFilter: 'blur(10px)'
    }),
    section: {
      background: 'rgba(255,255,255,0.95)',
      borderRadius: '16px',
      border: '1px solid #e4e7ef',
      boxShadow: '0 14px 26px rgba(15,23,42,0.08)',
      padding: '20px'
    },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
    label: { display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' },
    input: {
      width: '100%',
      padding: '11px 12px',
      borderRadius: '10px',
      border: '1px solid #d5d9e3',
      fontSize: '14px',
      background: '#f8fafc',
      color: '#0f172a',
      boxShadow: '0 6px 14px rgba(15,23,42,0.06) inset'
    },
    gridTwo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' },
    saveBar: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' },
    primaryBtn: (disabled) => ({
      padding: '12px 22px',
      borderRadius: '12px',
      border: '1px solid #4338ca',
      background: disabled ? 'linear-gradient(135deg,#c7d2fe,#e0e7ff)' : 'linear-gradient(135deg,#6366f1,#7c3aed)',
      color: disabled ? '#4338ca' : 'white',
      fontWeight: 700,
      fontSize: '14px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: '0 14px 24px rgba(99,102,241,0.28)',
      opacity: disabled ? 0.72 : 1,
      transition: 'transform 0.15s ease',
    }),
    note: {
      background: '#fff7ed',
      border: '1px solid #fdba74',
      borderRadius: '14px',
      padding: '14px',
      color: '#9a3412',
      boxShadow: '0 8px 18px rgba(250,204,21,0.15)'
    }
  };

  return (
    <div style={ui.shell}>
      <div style={ui.container}>
        <div style={ui.hero}>
          <div style={ui.heroOverlay} />
          <div style={ui.heroContent}>
            <div style={ui.pill}>
              <span>🎛️</span>
              System Settings
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h1 style={{ margin: 0, fontSize: '30px', fontWeight: 800 }}>Configure system preferences</h1>
              <p style={{ margin: 0, maxWidth: '720px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
                Control business details, SLA thresholds, and attendance rules in one place.
              </p>
            </div>
            <div style={ui.statsRow}>
              {[ 
                { label: 'Company Profile', value: 'Complete', accent: 'linear-gradient(135deg,#e0f2fe,#dbeafe)' },
                { label: 'SLA Bands', value: `${settings.sla_normal_hours}/${settings.sla_urgent_hours}/${settings.sla_critical_hours} hrs`, accent: 'linear-gradient(135deg,#dcfce7,#bbf7d0)' },
                { label: 'Attendance Cutoff', value: settings.attendance_cutoff_time, accent: 'linear-gradient(135deg,#fef3c7,#fde68a)' },
                { label: 'AI Model', value: settings.ai_model_enabled ? '✅ Enabled' : '❌ Disabled', accent: settings.ai_model_enabled ? 'linear-gradient(135deg,#f3e8ff,#e9d5ff)' : 'linear-gradient(135deg,#fee2e2,#fecaca)' }
              ].map((item) => (
                <div key={item.label} style={ui.statCard(item.accent)}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#475569', fontWeight: 800 }}>{item.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, marginTop: '6px' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={ui.section}>
          <div style={ui.sectionHeader}>
            <span style={{ fontSize: '18px' }}>🏢</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>Company Information</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>Keep your organization profile up to date.</div>
            </div>
          </div>
          <div style={ui.gridTwo}>
            <div>
              <label style={ui.label}>Company Name</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                style={ui.input}
              />
            </div>
            <div>
              <label style={ui.label}>Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                style={ui.input}
              />
            </div>
            <div>
              <label style={ui.label}>Phone</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                style={ui.input}
              />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <label style={ui.label}>Address</label>
            <textarea
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              rows={3}
              style={{
                ...ui.input,
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '96px'
              }}
            />
          </div>
        </div>

        <div style={ui.section}>
          <div style={ui.sectionHeader}>
            <span style={{ fontSize: '18px' }}>⏱️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>SLA Configuration (Hours)</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>Define response targets per priority.</div>
            </div>
          </div>
          <div style={ui.gridTwo}>
            <div>
              <label style={ui.label}>Normal Priority</label>
              <input
                type="number"
                value={settings.sla_normal_hours}
                onChange={(e) => setSettings({ ...settings, sla_normal_hours: parseInt(e.target.value) })}
                style={ui.input}
              />
            </div>
            <div>
              <label style={ui.label}>Urgent Priority</label>
              <input
                type="number"
                value={settings.sla_urgent_hours}
                onChange={(e) => setSettings({ ...settings, sla_urgent_hours: parseInt(e.target.value) })}
                style={ui.input}
              />
            </div>
            <div>
              <label style={ui.label}>Critical Priority</label>
              <input
                type="number"
                value={settings.sla_critical_hours}
                onChange={(e) => setSettings({ ...settings, sla_critical_hours: parseInt(e.target.value) })}
                style={ui.input}
              />
            </div>
          </div>
        </div>

        <div style={ui.section}>
          <div style={ui.sectionHeader}>
            <span style={{ fontSize: '18px' }}>🕐</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>Attendance Configuration</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>Late cut-off applies to all check-ins.</div>
            </div>
          </div>
          <div style={{ maxWidth: '320px' }}>
            <label style={ui.label}>Late Cutoff Time (HH:MM)</label>
            <input
              type="time"
              value={settings.attendance_cutoff_time}
              onChange={(e) => setSettings({ ...settings, attendance_cutoff_time: e.target.value })}
              style={ui.input}
            />
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
              Employees checking in after this time will be marked as "Late".
            </div>
          </div>
        </div>

        <div style={ui.section}>
          <div style={ui.sectionHeader}>
            <span style={{ fontSize: '18px' }}>🤖</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>AI Model Configuration</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>Configure AI assistant for enhanced features.</div>
            </div>
          </div>
          <div style={ui.gridTwo}>
            <div>
              <label style={ui.label}>AI Model Name</label>
              <input
                type="text"
                value={settings.ai_model_name}
                onChange={(e) => setSettings({ ...settings, ai_model_name: e.target.value })}
                style={ui.input}
                disabled
              />
            </div>
            <div>
              <label style={ui.label}>Enable for All Clients</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.ai_model_enabled}
                    onChange={(e) => setSettings({ ...settings, ai_model_enabled: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                  <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: 600 }}>
                    {settings.ai_model_enabled ? '✅ Enabled' : '❌ Disabled'}
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div style={{ 
            marginTop: '14px', 
            background: settings.ai_model_enabled ? '#f0fdf4' : '#fef2f2', 
            border: settings.ai_model_enabled ? '1px solid #86efac' : '1px solid #fca5a5',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '13px',
            color: settings.ai_model_enabled ? '#166534' : '#991b1b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{settings.ai_model_enabled ? '✨' : '⚠️'}</span>
              <div>
                <strong>{settings.ai_model_enabled ? 'AI Model Active' : 'AI Model Inactive'}</strong>
                <div style={{ marginTop: '4px' }}>
                  {settings.ai_model_enabled 
                    ? `${settings.ai_model_name} is now enabled for all clients. Enhanced AI features are active.`
                    : 'AI features are disabled. Enable to use intelligent assistance capabilities.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={ui.saveBar}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={ui.primaryBtn(saving)}
          >
            {saving ? '💾 Saving...' : '💾 Save Settings'}
          </button>
        </div>

        <div style={ui.note}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 800, marginBottom: '4px' }}>Admin Only</div>
              <div style={{ fontSize: '13px' }}>
                Changes impact all users and are audit-logged. Review before saving.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

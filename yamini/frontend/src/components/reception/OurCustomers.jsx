import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

/*
 * OurCustomers — Customer Hub 360° View
 * Merges customers from Enquiry, Service, Outstanding, MIF
 * List view with search + filter, click to expand full detail
 */

export default function OurCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', address: '', company: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [detailTab, setDetailTab] = useState('overview');

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/customer-hub/customers');
      setCustomers(data);
    } catch (e) {
      console.error('Failed to load customers:', e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (customer) => {
    setSelectedCustomer(customer);
    setDetailTab('overview');
    try {
      setDetailLoading(true);
      const data = await apiRequest(`/api/customer-hub/customers/${encodeURIComponent(customer.key)}/detail`);
      setDetail(data);
    } catch (e) {
      console.error('Failed to load detail:', e);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/customer-hub/customers/create', {
        method: 'POST',
        body: JSON.stringify(createForm)
      });
      alert('Customer created successfully');
      setShowCreate(false);
      setCreateForm({ name: '', phone: '', email: '', address: '', company: '' });
      loadCustomers();
    } catch (err) {
      alert('Failed: ' + (err.message || 'Unknown error'));
    }
  };

  const formatINR = (v) => {
    const n = parseFloat(v || 0);
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Filtered customers
  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q);
    const matchSource = sourceFilter === 'ALL' || (c.sources || []).includes(sourceFilter);
    return matchSearch && matchSource;
  });

  // Stats
  const totalCustomers = customers.length;
  const totalWithEnq = customers.filter(c => c.enquiry_count > 0).length;
  const totalWithService = customers.filter(c => c.complaint_count > 0).length;
  const totalWithMIF = customers.filter(c => c.mif_count > 0).length;
  const totalOutstanding = customers.reduce((s, c) => s + (c.total_outstanding || 0), 0);

  // ─── DETAIL VIEW ──────────────────────────────
  if (selectedCustomer) {
    return (
      <div style={{ padding: isMobile ? '16px' : '32px' }}>
        {/* Back button + header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button onClick={() => { setSelectedCustomer(null); setDetail(null); }}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-icons" style={{ fontSize: '18px' }}>arrow_back</span> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              {selectedCustomer.name}
            </h1>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
              {selectedCustomer.phone && <span style={{ fontSize: '14px', color: '#6b7280' }}>📞 {selectedCustomer.phone}</span>}
              {selectedCustomer.email && <span style={{ fontSize: '14px', color: '#6b7280' }}>✉️ {selectedCustomer.email}</span>}
            </div>
          </div>
        </div>

        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading customer details...</div>
        ) : detail ? (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Enquiries', value: detail.total_enquiries, icon: 'contact_mail', color: '#3B82F6', bg: '#EFF6FF' },
                { label: 'Services', value: detail.total_complaints, icon: 'build', color: '#F59E0B', bg: '#FFFBEB' },
                { label: 'Machines', value: detail.total_machines, icon: 'print', color: '#8B5CF6', bg: '#F5F3FF' },
                { label: 'Outstanding', value: formatINR(detail.total_balance), icon: 'account_balance', color: '#EF4444', bg: '#FEF2F2' },
              ].map((card, i) => (
                <div key={i} style={{ background: card.bg, borderRadius: '12px', padding: '16px', border: `1px solid ${card.color}22` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="material-icons" style={{ fontSize: '20px', color: card.color }}>{card.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{card.label}</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: card.color }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Customer Info Card */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-icons" style={{ fontSize: '20px', color: '#6366F1' }}>person</span> Customer Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Phone', value: detail.phone || '-' },
                  { label: 'Email', value: detail.email || '-' },
                  { label: 'Company', value: detail.company || '-' },
                  { label: 'Address', value: detail.address || '-' },
                  { label: 'Total Billed', value: formatINR(detail.total_outstanding_amount) },
                  { label: 'Total Paid', value: formatINR(detail.total_paid_amount) },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { key: 'overview', label: 'Overview', icon: 'dashboard' },
                { key: 'enquiries', label: `Enquiries (${detail.total_enquiries})`, icon: 'contact_mail' },
                { key: 'services', label: `Services (${detail.total_complaints})`, icon: 'build' },
                { key: 'machines', label: `Machines (${detail.total_machines})`, icon: 'print' },
                { key: 'outstanding', label: `Outstanding (${detail.outstandings?.length || 0})`, icon: 'receipt_long' },
                { key: 'followups', label: `Follow-ups (${detail.total_followups})`, icon: 'event_note' },
                { key: 'feedbacks', label: `Feedbacks (${detail.total_feedbacks})`, icon: 'star' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setDetailTab(tab.key)}
                  style={{
                    padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: detailTab === tab.key ? '#6366F1' : '#f3f4f6',
                    color: detailTab === tab.key ? 'white' : '#374151',
                    transition: 'all 0.2s'
                  }}>
                  <span className="material-icons" style={{ fontSize: '16px' }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              {/* Overview */}
              {detailTab === 'overview' && (
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>Activity Timeline</h3>
                  {(() => {
                    const allItems = [
                      ...detail.enquiries.map(e => ({ type: 'Enquiry', desc: `${e.product_interest || 'General'} — ${e.status}`, date: e.created_at, priority: e.priority })),
                      ...detail.complaints.map(c => ({ type: 'Service', desc: `${c.machine_model || 'N/A'} — ${c.fault_description?.substring(0, 60) || ''}`, date: c.created_at, priority: c.priority })),
                      ...detail.outstandings.map(o => ({ type: 'Invoice', desc: `${o.invoice_no} — ${formatINR(o.balance)} balance`, date: o.invoice_date, priority: o.status === 'OVERDUE' ? 'URGENT' : 'NORMAL' })),
                      ...detail.followups.map(f => ({ type: 'Follow-up', desc: `${f.note_type || 'follow_up'}: ${f.note?.substring(0, 60) || ''}`, date: f.created_at, priority: null })),
                      ...detail.mif_records.map(m => ({ type: 'MIF', desc: `${m.machine_model} — S/N: ${m.serial_number}`, date: m.installation_date, priority: null })),
                    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

                    if (allItems.length === 0) return <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No activity found</div>;

                    const colors = { Enquiry: '#3B82F6', Service: '#F59E0B', Invoice: '#EF4444', 'Follow-up': '#10B981', MIF: '#8B5CF6' };
                    const icons = { Enquiry: 'contact_mail', Service: 'build', Invoice: 'receipt_long', 'Follow-up': 'event_note', MIF: 'print' };

                    return allItems.slice(0, 30).map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: i < allItems.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${colors[item.type]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span className="material-icons" style={{ fontSize: '18px', color: colors[item.type] }}>{icons[item.type]}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: colors[item.type], padding: '2px 8px', borderRadius: '6px', background: `${colors[item.type]}15` }}>{item.type}</span>
                            {item.priority && <span style={{ fontSize: '11px', fontWeight: '600', color: item.priority === 'HOT' || item.priority === 'URGENT' || item.priority === 'CRITICAL' ? '#DC2626' : '#6b7280' }}>{item.priority}</span>}
                            <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>{formatDate(item.date)}</span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* Enquiries Tab */}
              {detailTab === 'enquiries' && (
                <div style={{ overflow: 'auto' }}>
                  {detail.enquiries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No enquiries found</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          {['ID', 'Product', 'Priority', 'Status', 'Source', 'Next Follow-up', 'Created'].map(h => (
                            <th key={h} style={_th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.enquiries.map(enq => (
                          <tr key={enq.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={_td}><span style={{ fontWeight: '600', color: '#3B82F6' }}>{enq.enquiry_id}</span></td>
                            <td style={_td}>{enq.product_interest || '-'}</td>
                            <td style={_td}>{_badge(enq.priority, { HOT: '#EF4444', WARM: '#F59E0B', COLD: '#3B82F6' })}</td>
                            <td style={_td}>{_badge(enq.status, { NEW: '#3B82F6', CONTACTED: '#F59E0B', CONVERTED: '#10B981', CLOSED: '#6b7280' })}</td>
                            <td style={_td}>{enq.source || '-'}</td>
                            <td style={_td}>{formatDate(enq.next_follow_up)}</td>
                            <td style={_td}>{formatDate(enq.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Services Tab */}
              {detailTab === 'services' && (
                <div style={{ overflow: 'auto' }}>
                  {detail.complaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No service requests found</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          {['Ticket', 'Machine', 'Fault', 'Priority', 'Status', 'Completed', 'Created'].map(h => (
                            <th key={h} style={_th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.complaints.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={_td}><span style={{ fontWeight: '600', color: '#F59E0B' }}>{c.ticket_no}</span></td>
                            <td style={_td}>{c.machine_model || '-'}</td>
                            <td style={{ ..._td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.fault_description || '-'}</td>
                            <td style={_td}>{_badge(c.priority, { CRITICAL: '#EF4444', URGENT: '#F59E0B', NORMAL: '#6b7280' })}</td>
                            <td style={_td}>{_badge(c.status, { COMPLETED: '#10B981', IN_PROGRESS: '#3B82F6', ASSIGNED: '#F59E0B', ON_HOLD: '#6b7280' })}</td>
                            <td style={_td}>{formatDate(c.completed_at)}</td>
                            <td style={_td}>{formatDate(c.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Machines Tab */}
              {detailTab === 'machines' && (
                <div style={{ overflow: 'auto' }}>
                  {detail.mif_records.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No machines found</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          {['MIF ID', 'Model', 'Serial', 'Installed', 'Warranty', 'Value', 'AMC', 'Status'].map(h => (
                            <th key={h} style={_th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.mif_records.map(m => {
                          let warrantyBadge = null;
                          if (m.warranty_months && m.installation_date) {
                            const exp = new Date(m.installation_date);
                            exp.setMonth(exp.getMonth() + m.warranty_months);
                            const daysLeft = Math.ceil((exp - new Date()) / 86400000);
                            const isExp = daysLeft <= 0;
                            const isSoon = daysLeft > 0 && daysLeft <= 30;
                            warrantyBadge = (
                              <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                                background: isExp ? '#FEE2E2' : isSoon ? '#FEF3C7' : '#ECFDF5',
                                color: isExp ? '#991B1B' : isSoon ? '#92400E' : '#065F46' }}>
                                {isExp ? 'Expired' : isSoon ? `${daysLeft}d left` : `${m.warranty_months}mo`}
                              </span>
                            );
                          }
                          return (
                            <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={_td}><span style={{ fontWeight: '600', color: '#8B5CF6' }}>{m.mif_id}</span></td>
                              <td style={{ ..._td, fontWeight: '600' }}>{m.machine_model || '-'}</td>
                              <td style={_td}>{m.serial_number || '-'}</td>
                              <td style={_td}>{formatDate(m.installation_date)}</td>
                              <td style={_td}>{warrantyBadge || '-'}</td>
                              <td style={_td}>{formatINR(m.machine_value)}</td>
                              <td style={_td}>{_badge(m.amc_status, { ACTIVE: '#10B981', EXPIRED: '#EF4444', INACTIVE: '#6b7280' })}</td>
                              <td style={_td}>{m.status || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Outstanding Tab */}
              {detailTab === 'outstanding' && (
                <div style={{ overflow: 'auto' }}>
                  {detail.outstandings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No outstanding invoices</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          {['Invoice', 'Total', 'Paid', 'Balance', 'Status', 'Due Date'].map(h => (
                            <th key={h} style={_th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.outstandings.map(o => (
                          <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={_td}><span style={{ fontWeight: '600' }}>{o.invoice_no}</span></td>
                            <td style={_td}>{formatINR(o.total_amount)}</td>
                            <td style={_td}>{formatINR(o.paid_amount)}</td>
                            <td style={{ ..._td, fontWeight: '700', color: '#EF4444' }}>{formatINR(o.balance)}</td>
                            <td style={_td}>{_badge(o.status, { PAID: '#10B981', PARTIAL: '#F59E0B', PENDING: '#6b7280', OVERDUE: '#EF4444' })}</td>
                            <td style={_td}>{formatDate(o.due_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                          <td style={{ ..._td, fontWeight: '700' }}>Total</td>
                          <td style={{ ..._td, fontWeight: '700' }}>{formatINR(detail.total_outstanding_amount)}</td>
                          <td style={{ ..._td, fontWeight: '700', color: '#10B981' }}>{formatINR(detail.total_paid_amount)}</td>
                          <td style={{ ..._td, fontWeight: '700', color: '#EF4444' }}>{formatINR(detail.total_balance)}</td>
                          <td style={_td}></td>
                          <td style={_td}></td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              )}

              {/* Follow-ups Tab */}
              {detailTab === 'followups' && (
                <div style={{ padding: '20px' }}>
                  {detail.followups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No follow-ups found</div>
                  ) : (
                    detail.followups.map((f, i) => (
                      <div key={f.id} style={{ padding: '14px 0', borderBottom: i < detail.followups.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span className="material-icons" style={{ fontSize: '16px', color: '#10B981' }}>event_note</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#10B981', textTransform: 'uppercase' }}>{f.note_type || 'follow_up'}</span>
                            {f.status && _badge(f.status, { Completed: '#10B981', Pending: '#F59E0B' })}
                            {f.outcome && <span style={{ fontSize: '12px', color: '#6b7280' }}>• {f.outcome}</span>}
                            <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>{formatDate(f.followup_date)}</span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>{f.note || '-'}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Feedbacks Tab */}
              {detailTab === 'feedbacks' && (
                <div style={{ padding: '20px' }}>
                  {detail.feedbacks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No feedbacks found</div>
                  ) : (
                    detail.feedbacks.map((fb, i) => (
                      <div key={fb.id} style={{ padding: '14px 0', borderBottom: i < detail.feedbacks.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: fb.is_negative ? '#FEF2F2' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span className="material-icons" style={{ fontSize: '16px', color: fb.is_negative ? '#EF4444' : '#F59E0B' }}>{fb.is_negative ? 'sentiment_dissatisfied' : 'star'}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>{'★'.repeat(fb.rating || 0)}{'☆'.repeat(5 - (fb.rating || 0))}</span>
                            <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>{formatDate(fb.created_at)}</span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>{fb.comment || '-'}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Failed to load customer details</div>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ──────────────────────────────
  return (
    <div style={{ padding: isMobile ? '16px' : '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
            Our Customers
          </h1>
          <p style={{ fontSize: '15px', color: '#6b7280' }}>360° view — Enquiries, Services, Machines & Outstanding merged</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{
            padding: '12px 24px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white',
            border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)', transition: 'all 0.3s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'; }}>
          <span className="material-icons" style={{ fontSize: '20px' }}>person_add</span> Add Customer
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Customers', value: totalCustomers, icon: 'groups', color: '#6366F1' },
          { label: 'With Enquiries', value: totalWithEnq, icon: 'contact_mail', color: '#3B82F6' },
          { label: 'With Services', value: totalWithService, icon: 'build', color: '#F59E0B' },
          { label: 'With Machines', value: totalWithMIF, icon: 'print', color: '#8B5CF6' },
          { label: 'Total Outstanding', value: formatINR(totalOutstanding), icon: 'account_balance', color: '#EF4444' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-icons" style={{ fontSize: '22px', color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <span className="material-icons" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '20px' }}>search</span>
          <input type="text" placeholder="Search by name, phone, email or company..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 40px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', background: 'white' }} />
        </div>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
          style={{ padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', background: 'white', fontWeight: '600' }}>
          <option value="ALL">All Sources</option>
          <option value="Enquiry">Enquiry</option>
          <option value="Service">Service</option>
          <option value="Outstanding">Outstanding</option>
          <option value="MIF">MIF</option>
          <option value="Customers">Customers DB</option>
        </select>
      </div>

      {/* Customer List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading customers...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', padding: '60px', borderRadius: '12px', textAlign: 'center', color: '#9ca3af', border: '1px solid #e5e7eb' }}>
          No customers found
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {!isMobile ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Customer', 'Phone', 'Enquiries', 'Services', 'Machines', 'Outstanding', 'Sources', 'Last Activity'].map(h => (
                    <th key={h} style={_th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.key} onClick={() => loadDetail(c)}
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}>
                    <td style={_td}>
                      <div style={{ fontWeight: '700', color: '#1f2937' }}>{c.name}</div>
                      {c.company && <div style={{ fontSize: '12px', color: '#6b7280' }}>{c.company}</div>}
                    </td>
                    <td style={_td}>{c.phone || '-'}</td>
                    <td style={{ ..._td, textAlign: 'center' }}>
                      {c.enquiry_count > 0 ? <span style={{ padding: '2px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', background: '#EFF6FF', color: '#3B82F6' }}>{c.enquiry_count}</span> : <span style={{ color: '#d1d5db' }}>0</span>}
                    </td>
                    <td style={{ ..._td, textAlign: 'center' }}>
                      {c.complaint_count > 0 ? <span style={{ padding: '2px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', background: '#FFFBEB', color: '#F59E0B' }}>{c.complaint_count}</span> : <span style={{ color: '#d1d5db' }}>0</span>}
                    </td>
                    <td style={{ ..._td, textAlign: 'center' }}>
                      {c.mif_count > 0 ? <span style={{ padding: '2px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', background: '#F5F3FF', color: '#8B5CF6' }}>{c.mif_count}</span> : <span style={{ color: '#d1d5db' }}>0</span>}
                    </td>
                    <td style={{ ..._td, fontWeight: '600', color: c.total_outstanding > 0 ? '#EF4444' : '#6b7280' }}>
                      {c.total_outstanding > 0 ? formatINR(c.total_outstanding) : '-'}
                    </td>
                    <td style={_td}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(c.sources || []).map(s => (
                          <span key={s} style={{ fontSize: '11px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px',
                            background: s === 'Enquiry' ? '#EFF6FF' : s === 'Service' ? '#FFFBEB' : s === 'MIF' ? '#F5F3FF' : s === 'Outstanding' ? '#FEF2F2' : '#f3f4f6',
                            color: s === 'Enquiry' ? '#3B82F6' : s === 'Service' ? '#F59E0B' : s === 'MIF' ? '#8B5CF6' : s === 'Outstanding' ? '#EF4444' : '#6b7280'
                          }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ ..._td, fontSize: '13px', color: '#6b7280' }}>
                      {c.latest_activity ? formatDate(c.latest_activity) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Mobile Cards */
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.map((c) => (
                <div key={c.key} onClick={() => loadDetail(c)}
                  style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#1f2937' }}>{c.name}</div>
                      {c.phone && <div style={{ fontSize: '13px', color: '#6b7280' }}>{c.phone}</div>}
                    </div>
                    <span className="material-icons" style={{ fontSize: '18px', color: '#9ca3af' }}>chevron_right</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {c.enquiry_count > 0 && <span style={{ fontSize: '12px', color: '#3B82F6', fontWeight: '600' }}>{c.enquiry_count} Enquiry</span>}
                    {c.complaint_count > 0 && <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '600' }}>{c.complaint_count} Service</span>}
                    {c.mif_count > 0 && <span style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: '600' }}>{c.mif_count} Machine</span>}
                    {c.total_outstanding > 0 && <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: '600' }}>{formatINR(c.total_outstanding)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: '12px 20px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
            Showing {filtered.length} of {customers.length} customers
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: isMobile ? '16px 16px 0 0' : '12px', padding: '24px', width: isMobile ? '100%' : '480px', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Add New Customer</h2>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'name', label: 'Customer Name *', type: 'text', required: true },
                  { key: 'phone', label: 'Phone', type: 'tel' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'company', label: 'Company', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{f.label}</label>
                    <input type={f.type} required={f.required} value={createForm[f.key]}
                      onChange={(e) => setCreateForm({ ...createForm, [f.key]: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Address</label>
                  <textarea value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', minHeight: '60px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreate(false)}
                  style={{ padding: '10px 20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: '10px 20px', background: '#6366F1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Style helpers ──────────────────────────────────────
const _th = { padding: '14px 18px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' };
const _td = { padding: '12px 18px', fontSize: '14px', color: '#374151' };

function _badge(val, colorMap) {
  const c = colorMap[val] || '#6b7280';
  return (
    <span style={{ padding: '2px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: `${c}15`, color: c, border: `1px solid ${c}30` }}>
      {val || '-'}
    </span>
  );
}

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

export default function StockManagement() {
 const [movements, setMovements] = useState([]);
 const [loading, setLoading] = useState(true);
 const [filter, setFilter] = useState('all');
 const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
 const [showReportMenu, setShowReportMenu] = useState(false);
 const [reportDateFrom, setReportDateFrom] = useState('');
 const [reportDateTo, setReportDateTo] = useState('');

 useEffect(() => {
 const handleResize = () => setIsMobile(window.innerWidth < 640);
 window.addEventListener('resize', handleResize);
 return () => window.removeEventListener('resize', handleResize);
 }, []);

 useEffect(() => {
 loadMovements();
 }, [filter]);

 const loadMovements = async () => {
 try {
 setLoading(true);
 const endpoint = filter === 'today'? '/api/stock-movements/?today=true': '/api/stock-movements/';
 const data = await apiRequest(endpoint);
 setMovements(data);
 } catch (error) {
 console.error('Failed to load stock movements:', error);
 setMovements([]);
 } finally {
 setLoading(false);
 }
 };

 const getTypeBadge = (type) => {
 const isIn = type === 'IN';
 return (
 <span style={{
 padding: '4px 12px',
 borderRadius: '12px',
 fontSize: '13px',
 fontWeight: '600',
 background: isIn ? '#DEF7EC': '#FEE2E2',
 color: isIn ? '#03543F': '#991B1B',
 border: `1px solid ${isIn ? '#84E1BC': '#FCA5A5'}`
 }}>
 {type}
</span>
 );
 };

 const getPaymentBadge = (status) => {
 const isPaid = status === 'PAID';
 const isPending = status === 'PENDING';
 return (
 <span style={{
 padding: '4px 12px',
 borderRadius: '12px',
 fontSize: '13px',
 fontWeight: '600',
 background: isPaid ? '#DEF7EC': isPending ? '#FEF3C7': '#F3F4F6',
 color: isPaid ? '#03543F': isPending ? '#92400E': '#6B7280',
 border: `1px solid ${isPaid ? '#84E1BC': isPending ? '#FCD34D': '#D1D5DB'}`
 }}>
 {isPaid ? 'PAID': isPending ? 'PENDING': status || 'N/A'}
</span>
 );
 };

 const formatDate = (dateStr) => {
 const date = new Date(dateStr);
 const day = String(date.getDate()).padStart(2, '0');
 const month = String(date.getMonth() + 1).padStart(2, '0');
 const year = date.getFullYear();
 return `${day}/${month}/${year}`;
 };

 const handleDelete = async (movementId) => {
 if (!confirm('Are you sure you want to delete this stock movement?')) return;
 try {
 await apiRequest(`/api/stock-movements/${movementId}`, { method: 'DELETE'});
 alert('Stock movement deleted successfully');
 loadMovements();
 } catch (error) {
 console.error('Failed to delete stock movement:', error);
 alert('Failed to delete: '+ (error.message || 'Unknown error'));
 }
 };

 const downloadStockCSV = (type) => {
 const now = new Date();
 const dateStr = `${now.getDate().toString().padStart(2,'0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}`;
 let data = movements;
 if (type === 'in') data = movements.filter(m => m.movement_type === 'IN');
 if (type === 'out') data = movements.filter(m => m.movement_type === 'OUT');
 if (type === 'pending') data = movements.filter(m => m.payment_status === 'PENDING');
 
 const headers = ['Date', 'Type', 'Category', 'Item Name', 'Quantity', 'Engineer', 'Service ID', 'Payment Status', 'Total Cost', 'Paid Amount', 'Notes'];
 const rows = data.map(m => [
 formatDate(m.date),
 m.movement_type,
 m.category || 'N/A',
 m.item_name,
 m.quantity,
 m.engineer_name || 'N/A',
 m.service_id || 'N/A',
 m.payment_status || 'N/A',
 m.total_cost || 0,
 m.paid_amount || 0,
 (m.notes || '').replace(/,/g, ' ')
 ]);
 
 const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `Stock_${type}_Report_${dateStr}.csv`;
 a.click();
 URL.revokeObjectURL(url);
 setShowReportMenu(false);
 };

 const downloadInventoryCSV = async () => {
 try {
 const response = await apiRequest('/api/stock-movements/inventory');
 const inventory = response.items || response || [];
 const now = new Date();
 const dateStr = `${now.getDate().toString().padStart(2,'0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}`;
 const headers = ['Item Name', 'Category', 'Current Stock', 'Total IN', 'Total OUT'];
 const rows = inventory.map(item => [
 item.item_name,
 item.category || 'N/A',
 item.balance || item.stock || 0,
 item.total_in || 0,
 item.total_out || 0
 ]);
 const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `Inventory_Report_${dateStr}.csv`;
 a.click();
 URL.revokeObjectURL(url);
 } catch (e) {
 alert('Failed to download inventory report');
 }
 setShowReportMenu(false);
 };

 const downloadStockPDF = (type) => {
 const now = new Date();
 const dateStr = `${now.getDate().toString().padStart(2,'0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}`;
 let data = movements;
 let title = 'All Stock Movements Report';
 if (type === 'in') { data = movements.filter(m => m.movement_type === 'IN'); title = 'Stock IN Report'; }
 if (type === 'out') { data = movements.filter(m => m.movement_type === 'OUT'); title = 'Stock OUT Report'; }
 if (type === 'pending') { data = movements.filter(m => m.payment_status === 'PENDING'); title = 'Payment Pending Report'; }

 const totalValue = data.reduce((sum, m) => sum + (m.total_cost || 0), 0);
 const totalPaid = data.reduce((sum, m) => sum + (m.paid_amount || 0), 0);

 const html = `<!DOCTYPE html><html><head><title>${title}</title><style>
 @page { size: A4 landscape; margin: 15mm; }
 body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; }
 .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; }
 .header h1 { margin: 0; color: #4f46e5; font-size: 22px; }
 .header p { margin: 5px 0 0; color: #666; font-size: 12px; }
 .summary { display: flex; gap: 15px; margin-bottom: 20px; }
 .summary-card { flex: 1; padding: 12px; border-radius: 8px; text-align: center; }
 table { width: 100%; border-collapse: collapse; margin-top: 10px; }
 th { background: #4f46e5; color: white; padding: 10px 8px; text-align: left; font-size: 11px; }
 td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
 tr:nth-child(even) { background: #f9fafb; }
 .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 10px; }
 .badge { padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
 .badge-in { background: #DEF7EC; color: #03543F; }
 .badge-out { background: #FEE2E2; color: #991B1B; }
 .badge-paid { background: #DEF7EC; color: #03543F; }
 .badge-pending { background: #FEF3C7; color: #92400E; }
 </style></head><body>
 <div class="header"><h1>Yamini Infotech</h1><h2>${title}</h2><p>Generated: ${dateStr} | Total Records: ${data.length} | Total Value: Rs.${totalValue.toLocaleString()} | Paid: Rs.${totalPaid.toLocaleString()}</p></div>
 <table><thead><tr><th>S.No</th><th>Date</th><th>Type</th><th>Category</th><th>Item</th><th>Qty</th><th>Engineer</th><th>Service ID</th><th>Payment</th><th>Cost</th><th>Paid</th></tr></thead><tbody>
 ${data.map((m, i) => `<tr><td>${i+1}</td><td>${formatDate(m.date)}</td><td><span class="badge badge-${m.movement_type.toLowerCase()}">${m.movement_type}</span></td><td>${m.category || '-'}</td><td>${m.item_name}</td><td>${m.quantity}</td><td>${m.engineer_name || '-'}</td><td>${m.service_id || '-'}</td><td><span class="badge badge-${(m.payment_status||'').toLowerCase()}">${m.payment_status || '-'}</span></td><td>${m.total_cost || 0}</td><td>${m.paid_amount || 0}</td></tr>`).join('')}
 </tbody></table>
 <div class="footer">Yamini Infotech - Stock Management Report | Confidential</div></body></html>`;

 const win = window.open('', '_blank');
 win.document.write(html);
 win.document.close();
 setTimeout(() => { win.print(); }, 500);
 setShowReportMenu(false);
 };

 if (loading) {
 return <div style={{ padding: '24px'}}> Loading stock movements...</div>;
 }

 return (
 <div style={{ minHeight: '100vh', background: '#f9fafb'}}>
 {/* Header Section */}
 <div style={{ padding: '32px 20px', background: 'white', borderBottom: '1px solid #e5e7eb'}}>
 <div style={{ maxWidth: '1200px', margin: '0 auto'}}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px'}}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px'}}>
 <span style={{ fontSize: '32px'}}></span>
 <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#111827'}}>Stock Management</h1>
 </div>
 <div style={{ position: 'relative'}}>
 <button
 onClick={() => setShowReportMenu(!showReportMenu)}
 style={{
 padding: '12px 20px',
 borderRadius: '12px',
 border: '2px solid #4f46e5',
 background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
 color: 'white',
 fontWeight: '700',
 fontSize: '14px',
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 gap: '8px',
 boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
 transition: 'all 0.2s'
 }}
 >
 <span className="material-icons" style={{ fontSize: '18px'}}>download</span>
 Download Reports
 </button>
 {showReportMenu && (
 <div style={{
 position: 'absolute',
 top: '100%',
 right: 0,
 marginTop: '8px',
 background: 'white',
 borderRadius: '16px',
 boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
 border: '1px solid #e5e7eb',
 padding: '8px',
 zIndex: 1000,
 minWidth: '280px',
 animation: 'fadeIn 0.2s ease'
 }}>
 <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6'}}>
 <div style={{ fontSize: '13px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>CSV Reports</div>
 </div>
 {[
 { label: 'All Movements', desc: 'Complete stock movement history', action: () => downloadStockCSV('all'), icon: 'list_alt' },
 { label: 'Stock IN Report', desc: 'All incoming stock entries', action: () => downloadStockCSV('in'), icon: 'arrow_downward' },
 { label: 'Stock OUT Report', desc: 'All outgoing stock entries', action: () => downloadStockCSV('out'), icon: 'arrow_upward' },
 { label: 'Payment Pending', desc: 'Unpaid stock movements', action: () => downloadStockCSV('pending'), icon: 'pending_actions' },
 { label: 'Current Inventory', desc: 'Live stock balances per item', action: () => downloadInventoryCSV(), icon: 'inventory' },
 ].map((item, i) => (
 <button key={i} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '10px', transition: 'background 0.2s', textAlign: 'left' }}
 onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
 >
 <span className="material-icons" style={{ fontSize: '20px', color: '#4f46e5'}}>{item.icon}</span>
 <div>
 <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937'}}>{item.label}</div>
 <div style={{ fontSize: '12px', color: '#6b7280'}}>{item.desc}</div>
 </div>
 </button>
 ))}
 <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', marginTop: '4px'}}>
 <div style={{ fontSize: '13px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>PDF Reports (Print)</div>
 </div>
 {[
 { label: 'All Movements PDF', desc: 'Printable full report', action: () => downloadStockPDF('all'), icon: 'print' },
 { label: 'Stock IN PDF', desc: 'Print incoming stock', action: () => downloadStockPDF('in'), icon: 'print' },
 { label: 'Stock OUT PDF', desc: 'Print outgoing stock', action: () => downloadStockPDF('out'), icon: 'print' },
 { label: 'Payment Pending PDF', desc: 'Print pending payments', action: () => downloadStockPDF('pending'), icon: 'print' },
 ].map((item, i) => (
 <button key={i} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '10px', transition: 'background 0.2s', textAlign: 'left' }}
 onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
 >
 <span className="material-icons" style={{ fontSize: '20px', color: '#7c3aed'}}>{item.icon}</span>
 <div>
 <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937'}}>{item.label}</div>
 <div style={{ fontSize: '12px', color: '#6b7280'}}>{item.desc}</div>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
</div>
 <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#6b7280', lineHeight: '1.6'}}>
 Track inventory movements and stock changes with real-time updates
</p>
</div>
</div>

 {/* Filter Section */}
 <div style={{ padding: '24px 20px', background: 'white', borderBottom: '1px solid #e5e7eb'}}>
 <div style={{ maxWidth: '1200px', margin: '0 auto'}}>
 <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
 <button
 onClick={() => setFilter('all')}
 style={{
 padding: '10px 18px',
 border: `2px solid ${filter === 'all'? '#667eea': '#e5e7eb'}`,
 background: filter === 'all'? '#667eea': 'white',
 color: filter === 'all'? 'white': '#374151',
 borderRadius: '20px',
 fontWeight: '600',
 fontSize: '14px',
 cursor: 'pointer',
 transition: 'all 0.3s ease',
 boxShadow: filter === 'all'? '0 4px 12px rgba(102, 126, 234, 0.3)': 'none'
 }}
 >
 All Movements
</button>
 <button
 onClick={() => setFilter('today')}
 style={{
 padding: '10px 18px',
 border: `2px solid ${filter === 'today'? '#667eea': '#e5e7eb'}`,
 background: filter === 'today'? '#667eea': 'white',
 color: filter === 'today'? 'white': '#374151',
 borderRadius: '20px',
 fontWeight: '600',
 fontSize: '14px',
 cursor: 'pointer',
 transition: 'all 0.3s ease',
 boxShadow: filter === 'today'? '0 4px 12px rgba(102, 126, 234, 0.3)': 'none'
 }}
 >
 Today
</button>
</div>
</div>
</div>

 {/* Content Section */}
 <div style={{ padding: '24px 20px'}}>
 <div style={{ maxWidth: '1200px', margin: '0 auto'}}>

 {/* Stock Movements Table - Desktop & Mobile */}
 {!isMobile ? (
 <div style={{ 
 background: 'white', 
 borderRadius: '12px', 
 border: '1px solid #e5e7eb',
 overflow: 'auto',
 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
 }}>
 <table style={{ width: '100%', borderCollapse: 'collapse'}}>
 <thead>
 <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb'}}>
 <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Date</th>
 <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Refresh Type</th>
 <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Item</th>
 <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Quantity</th>
 <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Reference</th>
 <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Payment</th>
 <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Actions</th>
</tr>
</thead>
 <tbody>
 {movements.length === 0 ? (
 <tr>
 <td colSpan="6" style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '15px'}}>
 No stock movements found
</td>
</tr>
 ) : (
 movements.map((movement) => (
 <tr key={movement.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s'}} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
 <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151'}}>
 {formatDate(movement.date)}
</td>
 <td style={{ padding: '14px 20px'}}>{getTypeBadge(movement.movement_type)}</td>
 <td style={{ padding: '14px 20px', fontSize: '14px', color: '#1f2937', fontWeight: '600'}}>
 {movement.item_name}
</td>
 <td style={{ padding: '14px 20px', fontSize: '14px', color: '#1f2937', fontWeight: '600'}}>{movement.quantity}</td>
 <td style={{ padding: '14px 20px', fontSize: '14px', color: '#6b7280'}}>
 {movement.reference || movement.reference_id || 'N/A'}
</td>
 <td style={{ padding: '14px 20px'}}>
 {getPaymentBadge(movement.payment_status)}
</td>
 <td style={{ padding: '14px 20px'}}>
 <button
 onClick={() => handleDelete(movement.id)}
 style={{
 padding: '6px 12px',
 borderRadius: '8px',
 border: '1.5px solid #ef4444',
 background: 'white',
 color: '#ef4444',
 fontSize: '13px',
 cursor: 'pointer',
 fontWeight: '600',
 transition: 'all 0.2s'
 }}
 onMouseOver={(e) => { e.target.style.background = '#fef2f2'; }}
 onMouseOut={(e) => { e.target.style.background = 'white'; }}
 title="Delete movement"
 >
 Delete
</button>
</td>
</tr>
 ))
 )}
</tbody>
</table>
</div>
 ) : (
 /* Mobile Card View */
 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px'}}>
 {movements.length === 0 ? (
 <div style={{ 
 background: 'white', 
 padding: '60px 20px', 
 borderRadius: '12px', 
 textAlign: 'center',
 color: '#9ca3af',
 fontSize: '15px',
 border: '1px solid #e5e7eb'
 }}>
 No stock movements found
</div>
 ) : (
 movements.map((movement) => (
 <div
 key={movement.id}
 style={{
 background: 'white',
 borderRadius: '12px',
 border: '1px solid #e5e7eb',
 padding: '16px',
 boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
 }}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
 <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937'}}>
 {movement.item_name}
</div>
 {getTypeBadge(movement.movement_type)}
</div>
 
 <div style={{ 
 display: 'grid', 
 gridTemplateColumns: '1fr 1fr', 
 gap: '12px',
 marginTop: '12px',
 paddingTop: '12px',
 borderTop: '1px solid #e5e7eb'
 }}>
 <div>
 <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase'}}>Date</div>
 <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937'}}>
 {formatDate(movement.date)}
</div>
</div>
 <div>
 <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase'}}>Quantity</div>
 <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937'}}>{movement.quantity}</div>
</div>
 <div>
 <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase'}}>Reference</div>
 <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937'}}>
 {movement.reference || movement.reference_id || 'N/A'}
</div>
</div>
 <div>
 <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase'}}>Payment</div>
 <div>{getPaymentBadge(movement.payment_status)}</div>
</div>
 <div style={{ gridColumn: '1 / -1', marginTop: '8px'}}>
 <button
 onClick={() => handleDelete(movement.id)}
 style={{
 padding: '10px',
 borderRadius: '8px',
 border: '1.5px solid #ef4444',
 background: 'white',
 color: '#ef4444',
 fontSize: '14px',
 cursor: 'pointer',
 fontWeight: '600',
 width: '100%',
 transition: 'all 0.2s'
 }}
 onMouseOver={(e) => { e.target.style.background = '#fef2f2'; }}
 onMouseOut={(e) => { e.target.style.background = 'white'; }}
 >
 Delete Movement
</button>
</div>
</div>
</div>
 ))
 )}
</div>
 )}
</div>
</div>
</div>
 );
}

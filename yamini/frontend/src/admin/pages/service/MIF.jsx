import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../../utils/api';

export default function MIF() {
 const [mifs, setMifs] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
 const [formData, setFormData] = useState({
 customer_name: '',
 machine_model: '',
 serial_number: '',
 installation_date: new Date().toISOString(),
 warranty_months: 12,
 location: '',
 machine_value: 0,
 amc_status: 'INACTIVE',
 amc_expiry: null,
 engineer_name: ''
 });

 useEffect(() => {
 const handleResize = () => setIsMobile(window.innerWidth < 640);
 window.addEventListener('resize', handleResize);
 return () => window.removeEventListener('resize', handleResize);
 }, []);

 useEffect(() => {
 loadMIFs();
 }, []);

 const loadMIFs = async () => {
 try {
 setLoading(true);
 const data = await apiRequest('/api/mif');
 setMifs(data);
 } catch (error) {
 console.error('Failed to load MIFs:', error);
 setMifs([]);
 } finally {
 setLoading(false);
 }
 };

 const generatePDF = (mif) => {
 const html = `
<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8" />
 <title>Machine In Field (MIF)</title>
 <style>
 @page {
 size: A4;
 margin: 20mm;
 }
 body {
 font-family: Arial, Helvetica, sans-serif;
 font-size: 12px;
 color: #000;
 }
 h1, h2, h3 {
 margin: 0;
 padding: 0;
 }
 .header {
 text-align: center;
 border-bottom: 2px solid #000;
 padding-bottom: 10px;
 margin-bottom: 15px;
 }
 .company-name {
 font-size: 18px;
 font-weight: bold;
 }
 .subtitle {
 font-size: 13px;
 margin-top: 4px;
 }
 .section {
 margin-bottom: 14px;
 }
 .section-title {
 font-weight: bold;
 background: #f2f2f2;
 padding: 6px;
 border: 1px solid #000;
 margin-bottom: 6px;
 }
 table {
 width: 100%;
 border-collapse: collapse;
 }
 td, th {
 border: 1px solid #000;
 padding: 6px;
 vertical-align: top;
 }
 .label {
 font-weight: bold;
 width: 30%;
 background: #fafafa;
 }
 .remarks-box {
 height: 80px;
 }
 .signature-table td {
 height: 60px;
 }
 .confidential {
 font-size: 10px;
 font-style: italic;
 border-top: 1px dashed #000;
 padding-top: 6px;
 margin-top: 10px;
 }
</style>
</head>
<body>
 <div class="header">
 <div class="company-name">Yamini Infotech</div>
 <div class="subtitle">Machine In Field (MIF) – Confidential</div>
</div>

 <div class="section">
 <div class="section-title">Installation & Customer Information</div>
 <table>
 <tr>
 <td class="label">Date</td>
 <td>${new Date(mif.installation_date).toLocaleDateString()}</td>
 <td class="label">Customer</td>
 <td>${mif.customer_name}</td>
</tr>
 <tr>
 <td class="label">Machine Model</td>
 <td>${mif.machine_model}</td>
 <td class="label">Serial Number</td>
 <td>${mif.serial_number}</td>
</tr>
 <tr>
 <td class="label">Installed By</td>
 <td>${mif.engineer_name || 'N/A'}</td>
 <td class="label">Status</td>
 <td>${mif.status}</td>
</tr>
 <tr>
 <td class="label">Location</td>
 <td colspan="3">${mif.location || 'N/A'}</td>
</tr>
</table>
</div>

 <div class="section">
 <div class="section-title">Machine Classification</div>
 <table>
 <tr>
 <td> New Installation</td>
 <td> Existing Customer</td>
 <td> Replacement / Exchange</td>
 <td> Demo Machine</td>
</tr>
</table>
</div>

 <div class="section">
 <div class="section-title">Service / AMC Details</div>
 <table>
 <tr>
 <td class="label">AMC Date</td>
 <td>${mif.amc_expiry ? new Date(mif.amc_expiry).toLocaleDateString() : 'N/A'}</td>
 <td class="label">AMC Status</td>
 <td>${mif.amc_status}</td>
</tr>
 <tr>
 <td class="label">Warranty Period</td>
 <td>${mif.warranty_months ? mif.warranty_months + ' months' : 'N/A'}</td>
 <td class="label">Warranty Expiry</td>
 <td>${mif.warranty_months && mif.installation_date ? (() => { const d = new Date(mif.installation_date); d.setMonth(d.getMonth() + mif.warranty_months); return d.toLocaleDateString(); })() : 'N/A'}</td>
</tr>
 <tr>
 <td class="label">Machine Value</td>
 <td colspan="3">₹${parseFloat(mif.machine_value || 0).toLocaleString()}</td>
</tr>
</table>
</div>

 <div class="section">
 <div class="section-title">Remarks / Notes (Reception Use)</div>
 <table>
 <tr>
 <td class="remarks-box">${mif.notes || ''}</td>
</tr>
</table>
</div>

 <div class="section">
 <div class="section-title">Verification</div>
 <table class="signature-table">
 <tr>
 <td>
 Reception / Office Staff<br /><br />
 Name: ____________<br />
 Signature: ____________
</td>
 <td>
 Admin Verification<br /><br />
 Name: ____________<br />
 Signature: ____________
</td>
</tr>
</table>
</div>

 <div class="confidential">
 This document contains confidential operational data. Unauthorized access or sharing is strictly prohibited.
</div>
</body>
</html>
 `;

 const newWindow = window.open('', '_blank');
 newWindow.document.write(html);
 newWindow.document.close();
 
 // Wait for content to load, then trigger print dialog
 setTimeout(() => {
 newWindow.print();
 }, 500);
 };

 const handleDelete = async (mifId) => {
 if (!confirm('Are you sure you want to delete this MIF record? This cannot be undone.')) return;
 try {
 await apiRequest(`/api/mif/${mifId}`, { method: 'DELETE'});
 alert('MIF record deleted successfully');
 loadMIFs();
 } catch (error) {
 console.error('Failed to delete MIF:', error);
 alert('Failed to delete: '+ (error.message || 'Unknown error'));
 }
 };

 const handleCreate = async (e) => {
 e.preventDefault();
 try {
 const payload = {
 ...formData,
 installation_date: new Date(formData.installation_date).toISOString(),
 amc_expiry: formData.amc_expiry ? new Date(formData.amc_expiry).toISOString() : null,
 machine_value: parseFloat(formData.machine_value),
 warranty_months: parseInt(formData.warranty_months) || 0
 };
 await apiRequest('/api/mif/', {
 method: 'POST',
 body: JSON.stringify(payload)
 });
 alert('MIF created successfully');
 setShowCreateModal(false);
 setFormData({
 customer_name: '',
 machine_model: '',
 serial_number: '',
 installation_date: new Date().toISOString(),
 warranty_months: 12,
 location: '',
 machine_value: 0,
 amc_status: 'INACTIVE',
 amc_expiry: null,
 engineer_name: ''
 });
 loadMIFs();
 } catch (error) {
 console.error('Failed to create MIF:', error);
 alert(''+ (error.message || 'Failed to create MIF'));
 }
 };

 const getStatusBadge = (status) => {
 const styles = {
 'COMPLETED': { bg: '#DEF7EC', color: '#03543F', border: '#84E1BC'},
 'PENDING': { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D'},
 'IN_PROGRESS': { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD'}
 };
 const style = styles[status] || styles['PENDING'];
 
 return (
 <span style={{
 padding: '4px 12px',
 borderRadius: '12px',
 fontSize: '13px',
 fontWeight: '600',
 background: style.bg,
 color: style.color,
 border: `1px solid ${style.border}`
 }}>
 {status}
</span>
 );
 };

 if (loading) {
 return <div style={{ padding: '24px'}}> Loading MIF records...</div>;
 }

 return (
 <div>
 {/* Modern Purple Gradient Banner */}
 <div style={{ padding: isMobile ? '20px': '32px'}}>
 {/* Header Section */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '32px', flexWrap: 'wrap'}}>
 <div>
 <h1 style={{ fontSize: isMobile ? '24px': '32px', fontWeight: '800', color: '#0f172a', marginBottom: '8px'}}>
 Installation Records
</h1>
 <p style={{ fontSize: isMobile ? '14px': '16px', color: '#6b7280'}}>
 Track and manage all machine installations
</p>
</div>
 <button
 onClick={() => setShowCreateModal(true)}
 style={{
 padding: '12px 24px',
 background: 'linear-gradient(135deg, #a78bfa, #c084fc)',
 color: 'white',
 border: 'none',
 borderRadius: '12px',
 fontWeight: '700',
 fontSize: '15px',
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 gap: '8px',
 whiteSpace: 'nowrap',
 boxShadow: '0 4px 12px rgba(167, 139, 250, 0.3)',
 transition: 'all 0.3s',
 transform: 'translateY(0)',
 }}
 onMouseOver={(e) => {
 e.target.style.transform = 'translateY(-2px)';
 e.target.style.boxShadow = '0 8px 16px rgba(167, 139, 250, 0.4)';
 }}
 onMouseOut={(e) => {
 e.target.style.transform = 'translateY(0)';
 e.target.style.boxShadow = '0 4px 12px rgba(167, 139, 250, 0.3)';
 }}
 >
 + Create MIF
</button>
</div>

 {/* MIF Table - Desktop */}
 {!isMobile ? (
 <div style={{ 
 background: 'white', 
 borderRadius: '14px', 
 border: '1px solid #e5e7eb',
 overflow: 'auto',
 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
 }}>
 <table style={{ width: '100%', borderCollapse: 'collapse'}}>
 <thead>
 <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb'}}>
 <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Date</th>
 <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Customer</th>
 <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Machine Model</th>
 <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Serial Number</th>
 <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Installed By</th>
 <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Warranty</th>
 <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Status</th>
 <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}> Actions</th>
</tr>
</thead>
 <tbody>
 {mifs.length === 0 ? (
 <tr>
 <td colSpan="8" style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '15px', borderBottom: '1px solid #e5e7eb'}}>
 No MIF records found
</td>
</tr>
 ) : (
 mifs.map((mif) => (
 <tr key={mif.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s', cursor: 'pointer'}}
 onMouseOver={(e) => e.target.parentElement.style.background = '#f9fafb'}
 onMouseOut={(e) => e.target.parentElement.style.background = 'white'}
 >
 <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151', fontWeight: '600'}}>
 {new Date(mif.installation_date).toLocaleDateString()}
</td>
 <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151'}}>
 <div style={{ fontWeight: '600'}}>{mif.customer_name}</div>
 <div style={{ fontSize: '12px', color: '#6b7280'}}>{mif.location}</div>
</td>
 <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151', fontWeight: '600'}}>
 {mif.machine_model}
</td>
 <td style={{ padding: '14px 20px', fontSize: '14px', color: '#6b7280'}}>
 {mif.serial_number}
</td>
 <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151'}}>
 {mif.engineer_name}
</td>
 <td style={{ padding: '14px 20px', fontSize: '13px'}}>
 {(() => {
 if (!mif.warranty_months || !mif.installation_date) return <span style={{ color: '#9ca3af' }}>N/A</span>;
 const inst = new Date(mif.installation_date);
 const exp = new Date(inst);
 exp.setMonth(exp.getMonth() + mif.warranty_months);
 const days = Math.ceil((exp - new Date()) / 86400000);
 const isExp = days <= 0;
 const isSoon = days > 0 && days <= 30;
 return (
 <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600',
 background: isExp ? '#FEE2E2' : isSoon ? '#FEF3C7' : '#ECFDF5',
 color: isExp ? '#991B1B' : isSoon ? '#92400E' : '#065F46',
 border: `1px solid ${isExp ? '#FECACA' : isSoon ? '#FCD34D' : '#A7F3D0'}`
 }}>
 {isExp ? 'Expired' : isSoon ? `${days}d left` : `${mif.warranty_months}mo`}
 </span>
 );
 })()}
</td>
 <td style={{ padding: '14px 20px'}}>
 {getStatusBadge(mif.status)}
</td>
 <td style={{ padding: '14px 20px'}}>
 <div style={{ display: 'flex', gap: '8px'}}>
 <button
 onClick={() => generatePDF(mif)}
 style={{
 padding: '6px 12px',
 borderRadius: '8px',
 border: '1.5px solid #a78bfa',
 background: 'white',
 color: '#a78bfa',
 fontSize: '13px',
 cursor: 'pointer',
 fontWeight: '600',
 transition: 'all 0.2s'
 }}
 onMouseOver={(e) => { e.target.style.background = '#f3e8ff'; }}
 onMouseOut={(e) => { e.target.style.background = 'white'; }}
 >
 View PDF
</button>
 <button
 onClick={() => handleDelete(mif.id)}
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
 title="Delete MIF record"
 >
 Delete
</button>
</div>
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
 {mifs.length === 0 ? (
 <div style={{ 
 background: 'white', 
 padding: '60px 20px', 
 borderRadius: '12px', 
 textAlign: 'center',
 color: '#9ca3af',
 fontSize: '15px',
 border: '1px solid #e5e7eb'
 }}>
 No MIF records found
</div>
 ) : (
 mifs.map((mif) => (
 <div
 key={mif.id}
 style={{
 background: 'white',
 borderRadius: '12px',
 border: '1px solid #e5e7eb',
 padding: '16px',
 boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
 }}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
 <div>
 <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '4px'}}>
 {mif.machine_model}
</div>
 <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151'}}>
 {mif.customer_name}
</div>
 <div style={{ fontSize: '12px', color: '#6b7280'}}>
 {mif.location}
</div>
</div>
 {getStatusBadge(mif.status)}
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
 <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase'}}>Serial Number</div>
 <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937'}}>{mif.serial_number}</div>
</div>
 <div>
 <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase'}}>Installed By</div>
 <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937'}}>{mif.engineer_name || 'N/A'}</div>
</div>
 <div style={{ gridColumn: '1 / -1'}}>
 <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase'}}>Date</div>
 <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937'}}>
 {new Date(mif.installation_date).toLocaleDateString()}
</div>
</div>
 <div style={{ gridColumn: '1 / -1', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
 <button
 onClick={() => generatePDF(mif)}
 style={{
 padding: '10px',
 borderRadius: '8px',
 border: '1.5px solid #a78bfa',
 background: 'white',
 color: '#a78bfa',
 fontSize: '14px',
 cursor: 'pointer',
 fontWeight: '600',
 width: '100%',
 transition: 'all 0.2s'
 }}
 onMouseOver={(e) => { e.target.style.background = '#f3e8ff'; }}
 onMouseOut={(e) => { e.target.style.background = 'white'; }}
 >
 View PDF
</button>
 <button
 onClick={() => handleDelete(mif.id)}
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
 Delete
</button>
</div>
</div>
</div>
 ))
 )}
</div>
 )}

 {/* Create MIF Modal */}
 {showCreateModal && (
 <div style={{
 position: 'fixed',
 top: 0,
 left: 0,
 right: 0,
 bottom: 0,
 background: 'rgba(0,0,0,0.5)',
 display: 'flex',
 alignItems: isMobile ? 'flex-end': 'center',
 justifyContent: 'center',
 zIndex: 1000,
 padding: isMobile ? '0': '16px'
 }}>
 <div style={{
 background: 'white',
 borderRadius: isMobile ? '16px 16px 0 0': '12px',
 padding: isMobile ? '20px 16px': '24px',
 width: isMobile ? '100%': '90%',
 maxWidth: '600px',
 maxHeight: '90vh',
 overflow: 'auto'
 }}>
 <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px'}}>
 Create Machine Installation Form
</h2>
 <form onSubmit={handleCreate}>
 <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr'}}>
 <div style={{ gridColumn: '1 / -1'}}>
 <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px'}}>
 Customer Name *
</label>
 <input
 type="text"
 required
 value={formData.customer_name}
 onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
 style={{
 width: '100%',
 padding: '8px 12px',
 border: '1px solid #E5E7EB',
 borderRadius: '6px',
 fontSize: '14px'
 }}
 />
</div>
 <div>
 <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px'}}>
 Machine Model *
</label>
 <input
 type="text"
 required
 value={formData.machine_model}
 onChange={(e) => setFormData({ ...formData, machine_model: e.target.value })}
 style={{
 width: '100%',
 padding: '8px 12px',
 border: '1px solid #E5E7EB',
 borderRadius: '6px',
 fontSize: '14px'
 }}
 />
</div>
 <div>
 <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px'}}>
 Serial Number *
</label>
 <input
 type="text"
 required
 value={formData.serial_number}
 onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
 style={{
 width: '100%',
 padding: '8px 12px',
 border: '1px solid #E5E7EB',
 borderRadius: '6px',
 fontSize: '14px'
 }}
 />
</div>
 {/* Installation Date + Warranty Period side by side */}
 <div>
 <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px'}}>
 Installation Date *
</label>
 <input
 type="datetime-local"
 required
 value={formData.installation_date ? new Date(formData.installation_date).toISOString().slice(0, 16) : ''}
 onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
 style={{
 width: '100%',
 padding: '8px 12px',
 border: '1px solid #E5E7EB',
 borderRadius: '6px',
 fontSize: '14px'
 }}
 />
</div>
 <div>
 <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px'}}>
 Warranty Period (Months) *
</label>
 <input
 type="number"
 required
 min="0"
 max="120"
 value={formData.warranty_months}
 onChange={(e) => setFormData({ ...formData, warranty_months: e.target.value })}
 style={{
 width: '100%',
 padding: '8px 12px',
 border: '1px solid #E5E7EB',
 borderRadius: '6px',
 fontSize: '14px'
 }}
 />
</div>
 {/* Warranty Expiry Auto-calculated Preview */}
 {formData.installation_date && formData.warranty_months > 0 && (() => {
 const instDate = new Date(formData.installation_date);
 const expiryDate = new Date(instDate);
 expiryDate.setMonth(expiryDate.getMonth() + parseInt(formData.warranty_months));
 const now = new Date();
 const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
 const isExpired = daysLeft <= 0;
 const isExpiring = daysLeft > 0 && daysLeft <= 30;
 const bgColor = isExpired ? '#FEE2E2' : isExpiring ? '#FEF3C7' : '#ECFDF5';
 const textColor = isExpired ? '#991B1B' : isExpiring ? '#92400E' : '#065F46';
 const borderColor = isExpired ? '#FECACA' : isExpiring ? '#FCD34D' : '#A7F3D0';
 const icon = isExpired ? 'error' : isExpiring ? 'warning' : 'verified';
 return (
 <div style={{ gridColumn: '1 / -1', padding: '12px 16px', background: bgColor, borderRadius: '8px', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
 <span className="material-icons" style={{ color: textColor, fontSize: '22px' }}>{icon}</span>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: '13px', fontWeight: '700', color: textColor }}>
 Warranty Expiry: {expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
 </div>
 <div style={{ fontSize: '12px', color: textColor, marginTop: '2px' }}>
 {isExpired ? `Expired ${Math.abs(daysLeft)} days ago` : isExpiring ? `Only ${daysLeft} days remaining - Expiring soon!` : `${daysLeft} days remaining`}
 </div>
 </div>
 </div>
 );
 })()}
 {/* AMC Date (left) + AMC Status (right) - SWAPPED */}
 <div>
 <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px'}}>
 AMC Date {formData.amc_status === 'ACTIVE'? '*': ''}
</label>
 <input
 type="datetime-local"
 required={formData.amc_status === 'ACTIVE'}
 value={formData.amc_expiry ? new Date(formData.amc_expiry).toISOString().slice(0, 16) : ''}
 onChange={(e) => setFormData({ ...formData, amc_expiry: e.target.value || null })}
 style={{
 width: '100%',
 padding: '8px 12px',
 border: '1px solid #E5E7EB',
 borderRadius: '6px',
 fontSize: '14px'
 }}
 />
</div>
 <div>
 <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px'}}>
 AMC Status *
</label>
 <select
 required
 value={formData.amc_status}
 onChange={(e) => setFormData({ ...formData, amc_status: e.target.value })}
 style={{
 width: '100%',
 padding: '8px 12px',
 border: '1px solid #E5E7EB',
 borderRadius: '6px',
 fontSize: '14px'
 }}
 >
 <option value="ACTIVE">Active</option>
 <option value="INACTIVE">Inactive</option>
 <option value="EXPIRED">Expired</option>
</select>
</div>
 {/* Machine Value - below AMC row */}
 <div style={{ gridColumn: '1 / -1'}}>
 <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px'}}>
 Machine Value (₹) *
</label>
 <input
 type="number"
 required
 min="0"
 step="0.01"
 value={formData.machine_value}
 onChange={(e) => setFormData({ ...formData, machine_value: e.target.value })}
 style={{
 width: '100%',
 padding: '8px 12px',
 border: '1px solid #E5E7EB',
 borderRadius: '6px',
 fontSize: '14px'
 }}
 />
</div>
 <div style={{ gridColumn: '1 / -1'}}>
 <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px'}}>
 Installed By (Engineer Name)
</label>
 <input
 type="text"
 value={formData.engineer_name}
 onChange={(e) => setFormData({ ...formData, engineer_name: e.target.value })}
 placeholder="Enter the engineer/technician who installed"
 style={{
 width: '100%',
 padding: '8px 12px',
 border: '1px solid #E5E7EB',
 borderRadius: '6px',
 fontSize: '14px'
 }}
 />
</div>
 <div style={{ gridColumn: '1 / -1'}}>
 <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px'}}>
 Location / Installation Address *
</label>
 <textarea
 required
 value={formData.location}
 onChange={(e) => setFormData({ ...formData, location: e.target.value })}
 style={{
 width: '100%',
 padding: '8px 12px',
 border: '1px solid #E5E7EB',
 borderRadius: '6px',
 fontSize: '14px',
 minHeight: '80px'
 }}
 />
</div>
</div>
 <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end'}}>
 <button
 type="button"
 onClick={() => setShowCreateModal(false)}
 style={{
 padding: '10px 20px',
 border: '1px solid #E5E7EB',
 borderRadius: '8px',
 background: 'white',
 fontSize: '14px',
 fontWeight: '600',
 cursor: 'pointer'
 }}
 >
 Cancel
</button>
 <button
 type="submit"
 style={{
 padding: '10px 20px',
 background: '#3B82F6',
 color: 'white',
 border: 'none',
 borderRadius: '8px',
 fontSize: '14px',
 fontWeight: '600',
 cursor: 'pointer'
 }}
 >
 Create MIF
</button>
</div>
</form>
</div>
</div>
 )}
</div>
</div>
 );
}

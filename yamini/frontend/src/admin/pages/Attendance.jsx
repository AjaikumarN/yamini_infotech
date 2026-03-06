import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { API_BASE_URL } from '../../config';

export default function Attendance() {
 const [attendance, setAttendance] = useState([]);
 const [loading, setLoading] = useState(true);
 const [filter, setFilter] = useState('today');
 const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
 const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0 });
 const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
 const [photoModalOpen, setPhotoModalOpen] = useState(false);
 const [selectedPhoto, setSelectedPhoto] = useState(null);
 const [showReportMenu, setShowReportMenu] = useState(false);
 const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0,7));

 useEffect(() => {
 const handleResize = () => setIsMobile(window.innerWidth < 640);
 window.addEventListener('resize', handleResize);
 return () => window.removeEventListener('resize', handleResize);
 }, []);

 useEffect(() => {
 loadAttendance();
 }, [filter, selectedDate]);

 const loadAttendance = async () => {
 try {
 setLoading(true);
 const endpoint = '/api/attendance/all/today';
 
 const data = await apiRequest(endpoint);
 console.log('Attendance API Response:', data);
 
 // Transform data to show attendance records
 const records = data.map(emp => {
 console.log(`Processing employee: ${emp.employee_name}`, emp);
 
 // Check if employee has attendance
 // checked_in is boolean, so check explicitly for true
 const hasAttendance = emp.checked_in === true && emp.attendance !== null;
 
 if (hasAttendance) {
 const attendanceData = emp.attendance;
 return {
 id: attendanceData.id,
 employee_id: emp.employee_id,
 employee_name: emp.employee_name,
 role: emp.role,
 time: attendanceData.check_in_time || attendanceData.time || 'Marked',
 location: attendanceData.location || 'Not available',
 status: attendanceData.status || 'Present',
 photo_path: attendanceData.photo_path || attendanceData.photo_url
 };
 }
 
 return {
 id: null,
 employee_id: emp.employee_id,
 employee_name: emp.employee_name,
 role: emp.role,
 time: 'Not marked',
 location: 'N/A',
 status: 'Absent',
 photo_path: null
 };
 });
 
 setAttendance(records);
 
 // Calculate stats - count on time as present
 const present = records.filter(a => a.status === 'Present'|| a.status === 'On Time').length;
 const late = records.filter(a => a.status === 'Late').length;
 const absent = records.filter(a => a.status === 'Absent').length;
 const total = records.length;
 
 setStats({ total, present, late, absent });
 } catch (error) {
 console.error('Failed to load attendance:', error);
 setAttendance([]);
 } finally {
 setLoading(false);
 }
 };

 const openPhotoModal = (photoPath, employeeName) => {
 console.log('Opening photo modal with path:', photoPath);
 setSelectedPhoto({ photoPath, employeeName });
 setPhotoModalOpen(true);
 };

 const closePhotoModal = () => {
 setPhotoModalOpen(false);
 setSelectedPhoto(null);
 };

 const handleCorrection = async (attendanceId, newStatus, reason) => {
 if (!reason) {
 alert('Please provide a reason for correction');
 return;
 }
 
 try {
 await apiRequest(`/api/attendance/${attendanceId}/correct`, {
 method: 'PUT',
 body: JSON.stringify({ status: newStatus, reason })
 });
 alert('Attendance corrected successfully');
 loadAttendance();
 } catch (error) {
 console.error('Failed to correct attendance:', error);
 alert('Failed to correct attendance');
 }
 };

 const downloadAttendanceCSV = (reportType) => {
 const now = new Date();
 const dateStr = `${now.getDate().toString().padStart(2,'0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}`;
 let data = attendance;
 let filename = `Daily_Attendance_Report_${dateStr}`;
 let title = 'Daily Attendance Report';

 if (reportType === 'present') { data = attendance.filter(a => a.status === 'Present' || a.status === 'On Time'); filename = `Present_Employees_${dateStr}`; }
 if (reportType === 'absent') { data = attendance.filter(a => a.status === 'Absent'); filename = `Absent_Employees_${dateStr}`; }
 if (reportType === 'late') { data = attendance.filter(a => a.status === 'Late'); filename = `Late_Employees_${dateStr}`; }

 const headers = ['S.No', 'Employee Name', 'Role', 'Check-In Time', 'Location', 'Status'];
 const rows = data.map((r, i) => [
 i + 1,
 r.employee_name,
 r.role || 'N/A',
 r.time,
 (r.location || 'N/A').replace(/,/g, ' '),
 r.status
 ]);

 const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `${filename}.csv`;
 a.click();
 URL.revokeObjectURL(url);
 setShowReportMenu(false);
 };

 const downloadAttendancePDF = (reportType) => {
 const now = new Date();
 const dateStr = `${now.getDate().toString().padStart(2,'0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}`;
 let data = attendance;
 let title = 'Daily Attendance Report';

 if (reportType === 'present') { data = attendance.filter(a => a.status === 'Present' || a.status === 'On Time'); title = 'Present Employees Report'; }
 if (reportType === 'absent') { data = attendance.filter(a => a.status === 'Absent'); title = 'Absent Employees Report'; }
 if (reportType === 'late') { data = attendance.filter(a => a.status === 'Late'); title = 'Late Employees Report'; }
 if (reportType === 'summary') { title = 'Attendance Summary Report'; }

 const presentCount = attendance.filter(a => a.status === 'Present' || a.status === 'On Time').length;
 const lateCount = attendance.filter(a => a.status === 'Late').length;
 const absentCount = attendance.filter(a => a.status === 'Absent').length;

 const html = `<!DOCTYPE html><html><head><title>${title}</title><style>
 @page { size: A4; margin: 15mm; }
 body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; }
 .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #5560ff; padding-bottom: 15px; }
 .header h1 { margin: 0; color: #5560ff; font-size: 22px; }
 .header h2 { margin: 5px 0; color: #333; font-size: 16px; }
 .header p { margin: 5px 0 0; color: #666; font-size: 12px; }
 .summary-grid { display: flex; gap: 10px; margin-bottom: 20px; }
 .summary-card { flex: 1; padding: 15px; border-radius: 10px; text-align: center; }
 .summary-card.total { background: #f0f4ff; border: 1px solid #c7d2fe; }
 .summary-card.present { background: #DEF7EC; border: 1px solid #84E1BC; }
 .summary-card.late { background: #FEF3C7; border: 1px solid #FCD34D; }
 .summary-card.absent { background: #FEE2E2; border: 1px solid #FCA5A5; }
 .summary-card h3 { margin: 0; font-size: 28px; }
 .summary-card p { margin: 5px 0 0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
 table { width: 100%; border-collapse: collapse; margin-top: 10px; }
 th { background: #5560ff; color: white; padding: 10px 8px; text-align: left; font-size: 11px; }
 td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
 tr:nth-child(even) { background: #f9fafb; }
 .badge { padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
 .badge-present { background: #DEF7EC; color: #03543F; }
 .badge-late { background: #FEF3C7; color: #92400E; }
 .badge-absent { background: #FEE2E2; color: #991B1B; }
 .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 10px; }
 </style></head><body>
 <div class="header"><h1>Yamini Infotech</h1><h2>${title}</h2><p>Date: ${dateStr} | Generated at: ${now.toLocaleTimeString()}</p></div>
 <div class="summary-grid">
 <div class="summary-card total"><h3>${attendance.length}</h3><p>Total Staff</p></div>
 <div class="summary-card present"><h3>${presentCount}</h3><p>Present</p></div>
 <div class="summary-card late"><h3>${lateCount}</h3><p>Late</p></div>
 <div class="summary-card absent"><h3>${absentCount}</h3><p>Absent</p></div>
 </div>
 <table><thead><tr><th>S.No</th><th>Employee Name</th><th>Role</th><th>Check-In Time</th><th>Location</th><th>Status</th></tr></thead><tbody>
 ${data.map((r, i) => `<tr><td>${i+1}</td><td style="font-weight:700">${r.employee_name}</td><td>${r.role || '-'}</td><td>${r.time}</td><td>${r.location || '-'}</td><td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td></tr>`).join('')}
 </tbody></table>
 <div class="footer">Yamini Infotech - Attendance Report | Confidential | Page 1</div></body></html>`;

 const win = window.open('', '_blank');
 win.document.write(html);
 win.document.close();
 setTimeout(() => { win.print(); }, 500);
 setShowReportMenu(false);
 };

 const getStatusBadge = (status) => {
 const styles = {
 'Present': { bg: 'linear-gradient(135deg, #E8FFF4, #D1F7E6)', color: '#0F5132', dot: '#16A34A', border: '#B5E9C7'},
 'Late': { bg: 'linear-gradient(135deg, #FFF7E8, #FFE6B8)', color: '#8B3C00', dot: '#F59E0B', border: '#F6D68C'},
 'Absent': { bg: 'linear-gradient(135deg, #FFE8EA, #FDD5DA)', color: '#8A102F', dot: '#E11D48', border: '#F3A6B7'}
 };
 const style = styles[status] || styles['Present'];

 return (
 <span
 style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '8px',
 padding: '6px 12px',
 borderRadius: '999px',
 background: style.bg,
 color: style.color,
 border: `1px solid ${style.border}`,
 fontWeight: 700,
 fontSize: '12px',
 letterSpacing: '0.2px'
 }}
 >
 <span
 style={{
 display: 'inline-block',
 width: '10px',
 height: '10px',
 borderRadius: '50%',
 backgroundColor: style.dot,
 boxShadow: `0 0 0 4px ${style.bg.split(',')[1] || style.bg}`
 }}
 />
 {status}
</span>
 );
 };

 const cardStyles = {
 shell: {
 background: 'linear-gradient(180deg, #f6f8fb 0%, #f0f4ff 100%)',
 minHeight: '100vh',
 padding: isMobile ? '20px': '28px'
 },
 container: {
 maxWidth: '1200px',
 margin: '0 auto',
 display: 'flex',
 flexDirection: 'column',
 gap: isMobile ? '16px': '20px'
 },
 hero: {
 position: 'relative',
 overflow: 'hidden',
 borderRadius: '18px',
 padding: isMobile ? '18px': '22px',
 background: 'linear-gradient(135deg, #5560ff 0%, #7a5af8 50%, #c084fc 100%)',
 color: 'white',
 boxShadow: '0 18px 40px rgba(86, 110, 255, 0.18)'
 },
 heroOverlay: {
 position: 'absolute',
 inset: 0,
 background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.16), transparent 35%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.12), transparent 30%)'
 },
 heroContent: { position: 'relative', display: 'flex', flexDirection: 'column', gap: '14px'},
 statsGrid: {
 display: 'grid',
 gridTemplateColumns: isMobile ? 'repeat(2, minmax(0,1fr))': 'repeat(4, minmax(0,1fr))',
 gap: isMobile ? '10px': '12px'
 },
 statCard: (accent) => ({
 borderRadius: '14px',
 padding: isMobile ? '14px': '16px',
 background: accent,
 color: '#0f172a',
 border: '1px solid rgba(255,255,255,0.35)',
 boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
 backdropFilter: 'blur(10px)'
 }),
 filterBar: {
 display: 'flex',
 flexDirection: isMobile ? 'column': 'row',
 gap: isMobile ? '10px': '12px',
 alignItems: isMobile ? 'stretch': 'center',
 justifyContent: 'space-between',
 background: 'rgba(255,255,255,0.9)',
 borderRadius: '16px',
 padding: isMobile ? '12px': '14px',
 border: '1px solid #e6e9f2',
 boxShadow: '0 10px 20px rgba(15,23,42,0.05)'
 },
 filterButton: (active) => ({
 padding: '10px 14px',
 borderRadius: '12px',
 border: active ? '2px solid #4f46e5': '1px solid #d7dce7',
 background: active ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)': 'white',
 color: active ? '#312e81': '#475569',
 fontWeight: 700,
 fontSize: '14px',
 cursor: 'pointer',
 boxShadow: active ? '0 10px 24px rgba(79,70,229,0.14)': '0 6px 14px rgba(0,0,0,0.04)',
 transition: 'all 0.2s ease'
 }),
 tableShell: {
 background: 'rgba(255,255,255,0.95)',
 borderRadius: '18px',
 border: '1px solid #e6e9f2',
 boxShadow: '0 16px 34px rgba(15,23,42,0.08)',
 overflow: 'hidden'
 },
 table: { width: '100%', borderCollapse: 'collapse', minWidth: '720px'},
 th: {
 padding: isMobile ? '12px': '14px 18px',
 textAlign: 'left',
 fontSize: '13px',
 fontWeight: 800,
 color: '#475569',
 textTransform: 'uppercase',
 letterSpacing: '0.4px',
 background: 'linear-gradient(180deg, #f7f9fb, #eef1f7)',
 borderBottom: '1px solid #e5e7eb'
 },
 td: {
 padding: isMobile ? '12px': '14px 18px',
 fontSize: '14px',
 color: '#0f172a',
 borderBottom: '1px solid #eef1f7'
 }
 };

 if (loading) {
 return (
 <div style={cardStyles.shell}>
 <div style={{ ...cardStyles.container, maxWidth: '1100px'}}>
 <div style={{ ...cardStyles.hero, height: '140px'}}>
 <div style={cardStyles.heroOverlay} />
 <div style={{ ...cardStyles.heroContent, gap: '10px'}}>
 <div style={{ height: '16px', width: '120px', background: 'rgba(255,255,255,0.35)', borderRadius: '999px'}} />
 <div style={{ height: '26px', width: '60%', background: 'rgba(255,255,255,0.35)', borderRadius: '10px'}} />
 <div style={{ height: '12px', width: '75%', background: 'rgba(255,255,255,0.25)', borderRadius: '10px'}} />
</div>
</div>
 <div style={{ ...cardStyles.tableShell, height: '220px'}} />
</div>
</div>
 );
 }

 return (
 <div style={cardStyles.shell}>
 <div style={cardStyles.container}>
 <div style={cardStyles.hero}>
 <div style={cardStyles.heroOverlay} />
 <div style={cardStyles.heroContent}>
 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px'}}>
 <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', padding: '8px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.32)', fontWeight: 700, letterSpacing: '0.4px'}}>
 <span style={{ fontSize: '16px'}}></span>
 Live Attendance Dashboard
</div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: '6px'}}>
 <h1 style={{ fontSize: isMobile ? '26px': '32px', margin: 0, fontWeight: 800 }}>Attendance Management</h1>
 <p style={{ margin: 0, maxWidth: '720px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
 Monitor check-ins in real time, spot exceptions faster, and act on corrections without leaving the page.
</p>
</div>
 <div style={{ position: 'relative', alignSelf: 'flex-end'}}>
 <button
 onClick={() => setShowReportMenu(!showReportMenu)}
 style={{
 padding: '10px 18px',
 borderRadius: '12px',
 border: '2px solid rgba(255,255,255,0.4)',
 background: 'rgba(255,255,255,0.15)',
 color: 'white',
 fontWeight: '700',
 fontSize: '14px',
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 gap: '8px',
 backdropFilter: 'blur(10px)',
 transition: 'all 0.2s'
 }}
 onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
 onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
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
 boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
 border: '1px solid #e5e7eb',
 padding: '8px',
 zIndex: 1000,
 minWidth: '300px'
 }}>
 <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6'}}>
 <div style={{ fontSize: '13px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>CSV Reports</div>
 </div>
 {[
 { label: 'Daily Attendance Report', desc: 'All employees attendance for the day', action: () => downloadAttendanceCSV('all'), icon: 'today' },
 { label: 'Present Employees', desc: 'Employees present / on time today', action: () => downloadAttendanceCSV('present'), icon: 'check_circle' },
 { label: 'Absent Employees', desc: 'Employees absent today', action: () => downloadAttendanceCSV('absent'), icon: 'cancel' },
 { label: 'Late Employees', desc: 'Employees who checked in late', action: () => downloadAttendanceCSV('late'), icon: 'schedule' },
 ].map((item, i) => (
 <button key={i} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '10px', transition: 'background 0.2s', textAlign: 'left' }}
 onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
 >
 <span className="material-icons" style={{ fontSize: '20px', color: '#5560ff'}}>{item.icon}</span>
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
 { label: 'Daily Attendance PDF', desc: 'Printable attendance with summary stats', action: () => downloadAttendancePDF('all'), icon: 'print' },
 { label: 'Present Report PDF', desc: 'Print present employees list', action: () => downloadAttendancePDF('present'), icon: 'print' },
 { label: 'Absent Report PDF', desc: 'Print absent employees list', action: () => downloadAttendancePDF('absent'), icon: 'print' },
 { label: 'Summary Report PDF', desc: 'Overview with charts and totals', action: () => downloadAttendancePDF('summary'), icon: 'summarize' },
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
</div>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
 {getStatusBadge('Present')}
 {getStatusBadge('Late')}
 {getStatusBadge('Absent')}
</div>
 <div style={cardStyles.statsGrid}>
 {[
 { label: 'Total Staff', value: stats.total, accent: 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))'},
 { label: 'On Time', value: stats.present, accent: 'linear-gradient(135deg, #dcfce7, #a7f3d0)'},
 { label: 'Late', value: stats.late, accent: 'linear-gradient(135deg, #fef3c7, #fde68a)'},
 { label: 'Absent', value: stats.absent, accent: 'linear-gradient(135deg, #ffe4e6, #fecdd3)'}
 ].map((item) => (
 <div key={item.label} style={cardStyles.statCard(item.accent)}>
 <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#475569', fontWeight: 800 }}>{item.label}</div>
 <div style={{ fontSize: isMobile ? '26px': '32px', fontWeight: 900, marginTop: '6px'}}>{item.value}</div>
</div>
 ))}
</div>
</div>
</div>

 <div style={cardStyles.filterBar}>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
 {[
 { key: 'today', label: 'Today'},
 { key: 'week', label: 'This Week'},
 { key: 'custom', label: 'Custom Date'}
 ].map((option) => (
 <button
 key={option.key}
 onClick={() => setFilter(option.key)}
 style={cardStyles.filterButton(filter === option.key)}
 >
 {option.label}
</button>
 ))}
</div>
 {filter === 'custom'&& (
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px'}}>
 <span style={{ fontSize: '13px', color: '#475569', fontWeight: 700 }}>Select date</span>
 <input
 type="date"
 value={selectedDate}
 onChange={(e) => setSelectedDate(e.target.value)}
 style={{
 padding: '10px 12px',
 borderRadius: '10px',
 border: '1px solid #d7dce7',
 fontSize: '14px',
 color: '#0f172a',
 background: 'white',
 boxShadow: '0 6px 12px rgba(0,0,0,0.04)'
 }}
 />
</div>
 )}
</div>

 {!isMobile ? (
 <div style={cardStyles.tableShell}>
 <div style={{ overflowX: 'auto'}}>
 <table style={cardStyles.table}>
 <thead>
 <tr>
 <th style={cardStyles.th}> Employee</th>
 <th style={cardStyles.th}> Time</th>
 <th style={cardStyles.th}> Location</th>
 <th style={cardStyles.th}> Status</th>
 <th style={cardStyles.th}> Photo</th>
 <th style={cardStyles.th}> Actions</th>
</tr>
</thead>
 <tbody>
 {attendance.length === 0 ? (
 <tr>
 <td colSpan="6" style={{ ...cardStyles.td, padding: '50px', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
 No attendance records found
</td>
</tr>
 ) : (
 attendance.map((record) => (
 <tr key={record.employee_id} style={{ transition: 'background 0.2s ease'}}>
 <td style={cardStyles.td}>
 <div style={{ fontWeight: 800 }}>{record.employee_name}</div>
 <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{record.role}</div>
</td>
 <td style={cardStyles.td}>{record.time}</td>
 <td style={cardStyles.td}>{record.location || 'N/A'}</td>
 <td style={cardStyles.td}>{getStatusBadge(record.status)}</td>
 <td style={cardStyles.td}>
 {record.photo_path ? (
 <button
 onClick={() => openPhotoModal(record.photo_path, record.employee_name)}
 style={{
 color: '#4338ca',
 fontWeight: 700,
 textDecoration: 'underline',
 textUnderlineOffset: '4px',
 background: 'none',
 border: 'none',
 cursor: 'pointer'
 }}
 >
 View
</button>
 ) : (
 <span style={{ color: '#cbd5e1'}}>—</span>
 )}
</td>
 <td style={cardStyles.td}>
 {record.id ? (
 <button
 onClick={() => {
 const reason = prompt('Enter reason for correction:');
 if (reason) {
 const newStatus = prompt('New status (Present/Late/Absent):');
 if (newStatus) {
 handleCorrection(record.id, newStatus, reason);
 }
 }
 }}
 style={{
 padding: '10px 12px',
 borderRadius: '10px',
 border: '1px solid #d7dce7',
 background: '#eef2ff',
 color: '#4338ca',
 fontWeight: 800,
 cursor: 'pointer',
 boxShadow: '0 10px 18px rgba(67,56,202,0.12)'
 }}
 >
 Correct
</button>
 ) : (
 <span style={{ color: '#cbd5e1'}}>—</span>
 )}
</td>
</tr>
 ))
 )}
</tbody>
</table>
</div>
</div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px'}}>
 {attendance.length === 0 ? (
 <div style={{
 borderRadius: '16px',
 border: '1px dashed #d7dce7',
 background: 'rgba(255,255,255,0.95)',
 padding: '32px',
 textAlign: 'center',
 color: '#94a3b8',
 fontWeight: 700,
 boxShadow: '0 12px 24px rgba(0,0,0,0.05)'
 }}>
 No attendance records found
</div>
 ) : (
 attendance.map((record) => (
 <div
 key={record.employee_id}
 style={{
 borderRadius: '16px',
 border: '1px solid #e6e9f2',
 background: 'white',
 padding: '14px',
 boxShadow: '0 14px 24px rgba(15,23,42,0.08)',
 display: 'flex',
 flexDirection: 'column',
 gap: '10px'
 }}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px'}}>
 <div>
 <div style={{ fontWeight: 800, color: '#0f172a'}}>{record.employee_name}</div>
 <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{record.role}</div>
</div>
 {getStatusBadge(record.status)}
</div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #e6e9f2', paddingTop: '10px'}}>
 <div>
 <div style={{ fontSize: '11px', letterSpacing: '0.4px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800 }}>Time</div>
 <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '4px'}}>{record.time}</div>
</div>
 <div>
 <div style={{ fontSize: '11px', letterSpacing: '0.4px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800 }}>Location</div>
 <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '4px'}}>{record.location || 'N/A'}</div>
</div>
</div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px'}}>
 {record.photo_path && (
 <button
 onClick={() => openPhotoModal(record.photo_path, record.employee_name)}
 style={{
 width: '100%',
 padding: '10px',
 borderRadius: '12px',
 border: '1px solid #d7dce7',
 background: '#eef2ff',
 color: '#4338ca',
 fontWeight: 800,
 cursor: 'pointer',
 boxShadow: '0 10px 18px rgba(67,56,202,0.12)'
 }}
 >
 View Photo
</button>
 )}
 {record.id ? (
 <button
 onClick={() => {
 const reason = prompt('Enter reason for correction:');
 if (reason) {
 const newStatus = prompt('New status (Present/Late/Absent):');
 if (newStatus) {
 handleCorrection(record.id, newStatus, reason);
 }
 }
 }}
 style={{
 width: '100%',
 padding: '10px',
 borderRadius: '12px',
 border: '1px solid #e6e9f2',
 background: '#ffffff',
 color: '#4338ca',
 fontWeight: 800,
 cursor: 'pointer',
 boxShadow: '0 10px 18px rgba(0,0,0,0.06)'
 }}
 >
 Edit Correct Status
</button>
 ) : (
 <div style={{
 width: '100%',
 padding: '10px',
 borderRadius: '12px',
 border: '1px dashed #d7dce7',
 textAlign: 'center',
 color: '#94a3b8',
 fontWeight: 700
 }}>
 No attendance marked
</div>
 )}
</div>
</div>
 ))
 )}
</div>
 )}
</div>

 {/* Photo Modal */}
 {photoModalOpen && selectedPhoto && (
 <div
 style={{
 position: 'fixed',
 inset: 0,
 background: 'rgba(0, 0, 0, 0.75)',
 backdropFilter: 'blur(8px)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 zIndex: 9999,
 padding: '20px',
 animation: 'fadeIn 0.2s ease'
 }}
 onClick={closePhotoModal}
 >
 <div
 style={{
 background: 'white',
 borderRadius: '20px',
 boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
 maxWidth: '600px',
 width: '100%',
 overflow: 'hidden',
 animation: 'slideUp 0.3s ease'
 }}
 onClick={(e) => e.stopPropagation()}
 >
 {/* Modal Header */}
 <div
 style={{
 background: 'linear-gradient(135deg, #5560ff 0%, #7a5af8 100%)',
 color: 'white',
 padding: '20px 24px',
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center'
 }}
 >
 <div>
 <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
 Attendance Photo
</h3>
 <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
 {selectedPhoto.employeeName}
</p>
</div>
 <button
 onClick={closePhotoModal}
 style={{
 background: 'rgba(255, 255, 255, 0.2)',
 border: 'none',
 borderRadius: '50%',
 width: '36px',
 height: '36px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 fontSize: '20px',
 color: 'white',
 transition: 'background 0.2s ease'
 }}
 onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
 onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
 >
 
</button>
</div>

 {/* Modal Body */}
 <div style={{ padding: '24px'}}>
 <div
 style={{
 position: 'relative',
 width: '100%',
 borderRadius: '12px',
 overflow: 'hidden',
 background: '#f1f5f9',
 boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
 }}
 >
 <img
 src={(() => {
 const path = selectedPhoto.photoPath;
 console.log('Photo path:', path);
 
 // If already a full URL, use it
 if (path.startsWith('http')) {
 return path;
 }
 
 // If it's a file system path like "uploads/attendance/file.jpg", extract just the path
 // Remove any leading slashes or "uploads" prefix since backend mounts at /uploads
 let cleanPath = path;
 if (cleanPath.includes('uploads/attendance/')) {
 // Extract filename from full path
 cleanPath = cleanPath.split('uploads/attendance/').pop();
 return `${API_BASE_URL}/uploads/attendance/${cleanPath}`;
 } else if (cleanPath.includes('attendance/')) {
 cleanPath = cleanPath.split('attendance/').pop();
 return `${API_BASE_URL}/uploads/attendance/${cleanPath}`;
 }
 
 // Default: assume it's just a filename
 return `${API_BASE_URL}/uploads/attendance/${cleanPath}`;
 })()}
 alt="Attendance"
 style={{
 width: '100%',
 height: 'auto',
 display: 'block',
 maxHeight: '500px',
 objectFit: 'contain'
 }}
 onError={(e) => {
 console.error('Failed to load image:', e.target.src);
 e.target.style.display = 'none';
 e.target.nextSibling.style.display = 'flex';
 }}
 />
 <div
 style={{
 display: 'none',
 alignItems: 'center',
 justifyContent: 'center',
 minHeight: '300px',
 color: '#94a3b8',
 fontSize: '16px',
 fontWeight: 700
 }}
 >
 Image not available
</div>
</div>
</div>

 {/* Modal Footer */}
 <div
 style={{
 padding: '16px 24px',
 background: '#f8fafc',
 borderTop: '1px solid #e2e8f0',
 display: 'flex',
 justifyContent: 'flex-end'
 }}
 >
 <button
 onClick={closePhotoModal}
 style={{
 padding: '10px 20px',
 borderRadius: '10px',
 border: '1px solid #d7dce7',
 background: 'white',
 color: '#475569',
 fontWeight: 700,
 cursor: 'pointer',
 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
 transition: 'all 0.2s ease'
 }}
 onMouseEnter={(e) => {
 e.target.style.background = '#f1f5f9';
 e.target.style.borderColor = '#cbd5e1';
 }}
 onMouseLeave={(e) => {
 e.target.style.background = 'white';
 e.target.style.borderColor = '#d7dce7';
 }}
 >
 Close
</button>
</div>
</div>
</div>
 )}
</div>
 );
}

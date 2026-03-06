import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../utils/api';

const STOCK_CATEGORIES = [
  { value: 'SPARE', label: 'Spare' },
  { value: 'MACHINE', label: 'Machine' },
  { value: 'TONER', label: 'Toner' },
  { value: 'STABILIZER', label: 'Stabilizer' },
  { value: 'TONER_CHIP', label: 'Toner Chip' },
  { value: 'DRUM_CHIP', label: 'Drum Chip' },
  { value: 'ID_CARD', label: 'ID Card' },
  { value: 'SPACE_ROLLER', label: 'Space Roller' },
  { value: 'PICKUP_ROLLER', label: 'Pickup Roller' },
  { value: 'SCANNER_CABLE', label: 'Scanner Cable' },
  { value: 'OLD_SPARE', label: 'Old Spare' },
  { value: 'LAMINATION', label: 'Lamination' },
];

const MACHINE_SUBTYPES = ['New', 'RC', 'Exchange'];

const PREDEFINED_ITEMS = [
  '195 Drum / Drum Unit',
  '195 Blade',
  '1800 Drum OPC',
  '1800 Blade',
  '1800 PCR',
  '1800 Fuser',
  '195 Fuser Roller',
  'TN118',
  'TN328',
  'TN225',
  '195 VY Copier Toner',
  'Printer Toner 300gm',
  'TN712 Toner',
  'Printer Toner 500gm',
  'Green Sticker 500gm',
  'Yellow Sticker 500gm',
  'IMAX - Magenta',
  'IMAX - Cyan',
  'IMAX - Yellow',
  'Half Cover',
  'KY Toner Black',
  'Toner Black - Blue Dot Pot 500gm',
  'Black Image',
  'Rico Ink & Master Cut Ribbon',
  'Fuser Paper Guide 3212i',
  'Dominica Toner - Guaran Feed Toner',
  'KY Drum Cleaning Blade 3212',
  'VY Pressure Roller 3212i',
  'VY PCR 3212i',
  '258 Cleaning Roller / 258 Drum',
  'VY 258 PCR',
  'DR316 Drum Unit - Colour',
  'Colour TN328 (M, Y, C, B)',
  '308 Drum Cleaning Blade & Corona',
  '224 Transfer Blade & Drum Parts',
  '227 Bizhub 287 Cleaning Parts',
  '227 VY Drum Cleaning Blade & 1800 Hinge',
  'OPC Drum - Charge Corona Unit',
  'Drum Unit 512',
  'Half Base 3212i - ADF Base',
  'VY 3212 Fuser Roller',
  'Lamp Fuser Fixing Film',
  'Taskalfa 3010 / 6525 Drum',
  'VY Seal',
  'Open / Closed Guide & Laminating Pouch Film',
  'Transfer Belt & Stabilizer',
  'TN321 Colour',
  'TK-1178',
  '1800 Drum / 367 Drum',
  'KY TK4140 & AOKI-ORD',
  'Maintenance Kit & KY Bypass',
  'Toner TN414 & TK6329',
  'Developer & Keyboard Box',
  'TN328 / TN628',
  'Chip & PVC ID Card',
  'Integral Toner Spare',
];

const DeliveryLog = () => {
  const [movements, setMovements] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [engineers, setEngineers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory');
  const [filters, setFilters] = useState({
    type: 'ALL', search: '', dateFrom: '', dateTo: '',
    paymentStatus: 'ALL', category: 'ALL'
  });
  const [showLogForm, setShowLogForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [editForm, setEditForm] = useState({ quantity: 1, notes: '' });
  const [stockWarning, setStockWarning] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('ALL');
  const [form, setForm] = useState({
    movement_type: 'IN', category: '', sub_type: '', item_name: '',
    quantity: 1, total_cost: 0, reference_type: '', notes: '',
    engineer_id: '', service_request_id: '',
    payment_status: 'PENDING', paid_amount: 0
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchMovements(), fetchInventory(), fetchEngineers(), fetchComplaints()]);
    setLoading(false);
  };

  const fetchEngineers = async () => {
    try {
      const data = await apiRequest('/api/users?role=SERVICE_ENGINEER');
      setEngineers(data || []);
    } catch (e) { console.error('Failed to fetch engineers:', e); }
  };

  const fetchComplaints = async () => {
    try {
      const data = await apiRequest('/api/complaints/');
      setComplaints(data || []);
    } catch (e) { console.error('Failed to fetch complaints:', e); }
  };

  const fetchMovements = async () => {
    try {
      const data = await apiRequest('/api/stock-movements/');
      setMovements(data || []);
    } catch (e) { console.error('Failed to fetch movements:', e); }
  };

  const fetchInventory = async () => {
    try {
      const data = await apiRequest('/api/stock-movements/inventory');
      setInventory(data?.items || []);
    } catch (e) {
      console.error('Failed to fetch inventory:', e);
      // Fallback: compute from movements
      try {
        const data = await apiRequest('/api/stock-movements/');
        const balances = {};
        (data || []).forEach(d => {
          const key = d.item_name;
          if (!balances[key]) balances[key] = { item_name: key, category: d.category || 'Uncategorized', available_stock: 0 };
          if (d.movement_type === 'IN') balances[key].available_stock += d.quantity;
          if (d.movement_type === 'OUT') balances[key].available_stock -= d.quantity;
        });
        const items = Object.values(balances).map(b => ({
          ...b,
          low_stock: b.available_stock > 0 && b.available_stock <= 5,
          no_stock: b.available_stock <= 0
        }));
        setInventory(items);
      } catch (e2) { console.error('Fallback inventory failed:', e2); }
    }
  };

  const getStockBalance = (itemName) => {
    const inv = inventory.find(i => i.item_name === itemName);
    return inv ? inv.available_stock : 0;
  };

  const checkStock = (itemName) => {
    const balance = getStockBalance(itemName);
    if (balance <= 0) {
      setStockWarning('No stock available for "' + itemName + '". Current stock: 0');
      return false;
    } else if (balance <= 5) {
      setStockWarning('Low stock warning: Only ' + balance + ' units of "' + itemName + '" remaining');
      return true;
    }
    setStockWarning('');
    return true;
  };

  const handleItemSelect = (itemName) => {
    setForm({ ...form, item_name: itemName });
    setItemSearch(itemName);
    setShowItemDropdown(false);
    if (form.movement_type === 'OUT') checkStock(itemName);
  };

  const filteredPredefinedItems = useMemo(() => {
    if (!itemSearch) return PREDEFINED_ITEMS;
    return PREDEFINED_ITEMS.filter(item =>
      item.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [itemSearch]);

  const logMovement = async (e) => {
    e.preventDefault();
    if (!form.category) { alert('Please select a category'); return; }
    if (!form.item_name) { alert('Please enter an item name'); return; }
    if (form.movement_type === 'OUT') {
      if (!form.engineer_id) { alert('Engineer is required for stock OUT'); return; }
      if (!form.service_request_id) { alert('Ticket ID is required for stock OUT'); return; }
    }
    try {
      const payload = {
        movement_type: form.movement_type,
        category: form.category,
        sub_type: form.category === 'MACHINE' ? form.sub_type : null,
        item_name: form.item_name,
        quantity: Number(form.quantity) || 1,
        total_cost: Number(form.total_cost) || 0,
        engineer_id: form.engineer_id ? Number(form.engineer_id) : null,
        service_request_id: form.service_request_id ? Number(form.service_request_id) : null,
        reference_type: form.reference_type || null,
        notes: form.notes || null,
        payment_status: form.payment_status || 'PENDING',
        paid_amount: Number(form.paid_amount) || 0
      };
      await apiRequest('/api/stock-movements/', { method: 'POST', body: JSON.stringify(payload) });
      setShowLogForm(false);
      resetForm();
      fetchAll();
      alert('Stock movement logged successfully!');
    } catch (error) {
      alert('Failed to log movement: ' + (error.message || ''));
    }
  };

  const resetForm = () => {
    setForm({
      movement_type: 'IN', category: '', sub_type: '', item_name: '',
      quantity: 1, total_cost: 0, reference_type: '', notes: '',
      engineer_id: '', service_request_id: '',
      payment_status: 'PENDING', paid_amount: 0
    });
    setItemSearch('');
    setStockWarning('');
    setShowItemDropdown(false);
  };

  const openPaymentModal = (movement) => {
    setSelectedMovement(movement);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  const handlePayment = async (payFull) => {
    if (!selectedMovement) return;
    try {
      const body = { payment_status: 'PAID' };
      if (!payFull && paymentAmount) body.amount = Number(paymentAmount);
      await apiRequest('/api/stock-movements/' + selectedMovement.id + '/payment', {
        method: 'PUT', body: JSON.stringify(body)
      });
      setShowPaymentModal(false);
      setSelectedMovement(null);
      setPaymentAmount('');
      fetchAll();
      alert(payFull ? 'Marked as fully PAID!' : 'Partial payment recorded!');
    } catch (error) {
      alert('Failed to update payment: ' + (error.message || ''));
    }
  };

  const openEditModal = (movement) => {
    setSelectedMovement(movement);
    setEditForm({ quantity: movement.quantity, notes: movement.notes || '' });
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!selectedMovement) return;
    const newQty = Number(editForm.quantity);
    if (newQty < 0) { alert('Quantity cannot be negative'); return; }
    try {
      await apiRequest('/api/stock-movements/' + selectedMovement.id, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQty, notes: editForm.notes })
      });
      setShowEditModal(false);
      setSelectedMovement(null);
      fetchAll();
      alert('Movement updated successfully!');
    } catch (error) {
      alert('Failed to update: ' + (error.message || ''));
    }
  };

  const getCategoryLabel = (val) => {
    const cat = STOCK_CATEGORIES.find(c => c.value === val);
    return cat ? cat.label : val || '-';
  };

  const filteredMovements = movements.filter(m => {
    if (filters.type !== 'ALL' && m.movement_type !== filters.type) return false;
    if (filters.paymentStatus !== 'ALL' && m.payment_status !== filters.paymentStatus) return false;
    if (filters.category !== 'ALL' && m.category !== filters.category) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      return m.item_name.toLowerCase().includes(s) ||
        (m.engineer_name || '').toLowerCase().includes(s) ||
        (m.category || '').toLowerCase().includes(s) ||
        (m.notes || '').toLowerCase().includes(s);
    }
    if (filters.dateFrom) {
      if (new Date(m.created_at || m.date) < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      if (new Date(m.created_at || m.date) > new Date(filters.dateTo)) return false;
    }
    return true;
  });

  const filteredInventory = inventory.filter(item => {
    if (inventoryCategoryFilter !== 'ALL' && item.category !== inventoryCategoryFilter) return false;
    if (inventorySearch) {
      return item.item_name.toLowerCase().includes(inventorySearch.toLowerCase());
    }
    return true;
  });

  const stats = {
    totalItems: inventory.length,
    lowStock: inventory.filter(i => i.low_stock).length,
    noStock: inventory.filter(i => i.no_stock).length,
    totalIn: movements.filter(d => d.movement_type === 'IN').length,
    totalOut: movements.filter(d => d.movement_type === 'OUT').length,
    paymentPending: movements.filter(d => (d.payment_status === 'PENDING' || d.payment_status === 'PARTIALLY_PAID')).length,
    paid: movements.filter(d => d.payment_status === 'PAID').length
  };

  if (loading) {
    return <div style={{textAlign:'center',padding:'100px',fontSize:'18px',color:'#7f8c8d'}}>Loading stock management...</div>;
  }

  return (
    <div style={{padding:'20px',maxWidth:'1600px',margin:'0 auto'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <div>
          <h1 style={{margin:0,fontSize:'26px',color:'#2c3e50'}}>Stock Management</h1>
          <p style={{margin:'4px 0 0',color:'#7f8c8d',fontSize:'13px'}}>Track inventory, movements, and payments</p>
        </div>
        <button onClick={() => setShowLogForm(true)} style={{
          padding:'10px 22px',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',
          background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white',fontSize:'14px',
          boxShadow:'0 2px 8px rgba(102,126,234,0.25)',transition:'all 0.3s'
        }}>+ Add Stock</button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'15px',marginBottom:'20px'}}>
        {[
          { label: 'Total Items', value: stats.totalItems, color: '#3498db', icon: 'inventory_2' },
          { label: 'Low Stock', value: stats.lowStock, color: '#f39c12', icon: 'warning' },
          { label: 'Out of Stock', value: stats.noStock, color: '#e74c3c', icon: 'remove_shopping_cart' },
          { label: 'Stock IN', value: stats.totalIn, color: '#27ae60', icon: 'add_circle' },
          { label: 'Stock OUT', value: stats.totalOut, color: '#e67e22', icon: 'remove_circle' },
          { label: 'Payment Pending', value: stats.paymentPending, color: '#9b59b6', icon: 'pending' },
        ].map((s, i) => (
          <div key={i} style={{
            background:'white',padding:'16px',borderRadius:'10px',
            boxShadow:'0 2px 8px rgba(0,0,0,0.06)',borderLeft:'4px solid ' + s.color,
            display:'flex',alignItems:'center',gap:'12px'
          }}>
            <span className="material-icons" style={{fontSize:'28px',color:s.color}}>{s.icon}</span>
            <div>
              <div style={{fontSize:'24px',fontWeight:700,color:'#2c3e50'}}>{s.value}</div>
              <div style={{fontSize:'11px',color:'#7f8c8d',textTransform:'uppercase',letterSpacing:'0.5px'}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'0',marginBottom:'20px',borderBottom:'2px solid #ecf0f1'}}>
        {[
          { key: 'inventory', label: 'Inventory', icon: 'inventory' },
          { key: 'movements', label: 'Movements', icon: 'swap_vert' },
          { key: 'low-stock', label: 'Low Stock Alerts', icon: 'notification_important' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding:'12px 24px',border:'none',borderBottom: activeTab === tab.key ? '3px solid #667eea' : '3px solid transparent',
            background:'none',cursor:'pointer',fontWeight: activeTab === tab.key ? 700 : 500,
            color: activeTab === tab.key ? '#667eea' : '#7f8c8d',fontSize:'14px',
            display:'flex',alignItems:'center',gap:'6px',transition:'all 0.2s'
          }}>
            <span className="material-icons" style={{fontSize:'18px'}}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* === INVENTORY TAB === */}
      {activeTab === 'inventory' && (
        <div>
          <div style={{display:'flex',gap:'15px',marginBottom:'15px',flexWrap:'wrap',alignItems:'end'}}>
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              <label style={{fontSize:'11px',fontWeight:600,color:'#7f8c8d',textTransform:'uppercase'}}>Search</label>
              <input placeholder="Search items..." value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                style={{padding:'8px 12px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'14px',minWidth:'200px'}} />
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              <label style={{fontSize:'11px',fontWeight:600,color:'#7f8c8d',textTransform:'uppercase'}}>Category</label>
              <select value={inventoryCategoryFilter} onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                style={{padding:'8px 12px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'14px'}}>
                <option value="ALL">All Categories</option>
                {STOCK_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
                <option value="Uncategorized">Uncategorized</option>
              </select>
            </div>
            <div style={{marginLeft:'auto',padding:'8px 12px',background:'#ecf0f1',borderRadius:'6px',fontSize:'13px',fontWeight:600}}>
              {filteredInventory.length} items
            </div>
          </div>

          <div style={{background:'white',borderRadius:'12px',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f8f9fa'}}>
                  <th style={thStyle}>Item Name</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Current Stock</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr><td colSpan="4" style={{textAlign:'center',padding:'40px',color:'#95a5a6',fontStyle:'italic'}}>No inventory items found</td></tr>
                ) : (
                  filteredInventory.map((item, idx) => (
                    <tr key={idx} style={{borderBottom:'1px solid #f0f0f0'}}>
                      <td style={tdStyle}><strong>{item.item_name}</strong></td>
                      <td style={tdStyle}>
                        <span style={{
                          padding:'3px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:600,
                          background: getCategoryColor(item.category).bg,
                          color: getCategoryColor(item.category).text
                        }}>{getCategoryLabel(item.category)}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontSize:'18px',fontWeight:700,
                          color: item.no_stock ? '#e74c3c' : item.low_stock ? '#f39c12' : '#27ae60'
                        }}>{item.available_stock}</span>
                      </td>
                      <td style={tdStyle}>
                        {item.no_stock && <span style={{padding:'3px 10px',borderRadius:'4px',fontSize:'11px',fontWeight:700,background:'#fde2e2',color:'#c0392b'}}>OUT OF STOCK</span>}
                        {item.low_stock && <span style={{padding:'3px 10px',borderRadius:'4px',fontSize:'11px',fontWeight:700,background:'#fef9e7',color:'#e67e22'}}>LOW STOCK</span>}
                        {!item.no_stock && !item.low_stock && <span style={{padding:'3px 10px',borderRadius:'4px',fontSize:'11px',fontWeight:700,background:'#e8f5e9',color:'#27ae60'}}>IN STOCK</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === MOVEMENTS TAB === */}
      {activeTab === 'movements' && (
        <div>
          <div style={{background:'white',padding:'15px 20px',borderRadius:'10px',marginBottom:'15px',
            display:'flex',gap:'12px',flexWrap:'wrap',alignItems:'end',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              <label style={filterLabel}>Search</label>
              <input placeholder="Item, engineer, notes..." value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                style={filterInput} />
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              <label style={filterLabel}>Type</label>
              <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} style={filterInput}>
                <option value="ALL">All</option>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              <label style={filterLabel}>Category</label>
              <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})} style={filterInput}>
                <option value="ALL">All</option>
                {STOCK_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              <label style={filterLabel}>Payment</label>
              <select value={filters.paymentStatus} onChange={(e) => setFilters({...filters, paymentStatus: e.target.value})} style={filterInput}>
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              <label style={filterLabel}>From</label>
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} style={filterInput} />
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              <label style={filterLabel}>To</label>
              <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} style={filterInput} />
            </div>
            <div style={{marginLeft:'auto',padding:'8px 12px',background:'#ecf0f1',borderRadius:'6px',fontSize:'13px',fontWeight:600}}>
              {filteredMovements.length} of {movements.length}
            </div>
          </div>

          <div style={{background:'white',borderRadius:'12px',overflowX:'auto',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f8f9fa'}}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Item Name</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Balance</th>
                  <th style={thStyle}>Engineer</th>
                  <th style={thStyle}>Service ID</th>
                  <th style={thStyle}>Cost</th>
                  <th style={thStyle}>Payment</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr><td colSpan="11" style={{textAlign:'center',padding:'50px',color:'#95a5a6',fontStyle:'italic'}}>No stock movements found</td></tr>
                ) : (
                  filteredMovements.map(m => {
                    const balance = getStockBalance(m.item_name);
                    const isLow = balance > 0 && balance <= 5;
                    const isNone = balance <= 0;
                    return (
                      <tr key={m.id} style={{borderBottom:'1px solid #f0f0f0'}}>
                        <td style={tdStyle}>
                          <div style={{fontSize:'13px'}}>{new Date(m.created_at || m.date).toLocaleDateString()}</div>
                          <div style={{fontSize:'11px',color:'#7f8c8d'}}>{new Date(m.created_at || m.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display:'inline-block',padding:'3px 10px',borderRadius:'4px',fontSize:'11px',fontWeight:600,
                            background: m.movement_type === 'IN' ? '#27ae60' : '#e74c3c', color:'white'
                          }}>{m.movement_type}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding:'3px 8px',borderRadius:'10px',fontSize:'10px',fontWeight:600,
                            background: getCategoryColor(m.category).bg,
                            color: getCategoryColor(m.category).text
                          }}>{getCategoryLabel(m.category)}</span>
                          {m.sub_type && <div style={{fontSize:'10px',color:'#7f8c8d',marginTop:'2px'}}>{m.sub_type}</div>}
                        </td>
                        <td style={tdStyle}>
                          <strong>{m.item_name}</strong>
                          {isNone && <div style={{fontSize:'10px',fontWeight:700,padding:'1px 6px',borderRadius:'3px',marginTop:'3px',display:'inline-block',background:'#e74c3c',color:'white'}}>NO STOCK</div>}
                          {isLow && <div style={{fontSize:'10px',fontWeight:700,padding:'1px 6px',borderRadius:'3px',marginTop:'3px',display:'inline-block',background:'#f39c12',color:'white'}}>LOW: {balance}</div>}
                        </td>
                        <td style={{...tdStyle,fontWeight:700}}>{m.quantity}</td>
                        <td style={tdStyle}>
                          <span style={{fontWeight:700,color: isNone ? '#e74c3c' : isLow ? '#f39c12' : '#27ae60'}}>{balance}</span>
                        </td>
                        <td style={tdStyle}>{m.engineer_name || (m.movement_type === 'IN' ? '-' : 'N/A')}</td>
                        <td style={tdStyle}>{m.service_request_id || '-'}</td>
                        <td style={tdStyle}>{m.total_cost ? 'Rs.' + m.total_cost : '-'}</td>
                        <td style={tdStyle}>
                          {m.payment_status === 'PAID' ? (
                            <span style={{padding:'3px 10px',borderRadius:'4px',fontSize:'11px',fontWeight:600,background:'#27ae60',color:'white'}}>PAID</span>
                          ) : m.payment_status === 'PARTIALLY_PAID' ? (
                            <span onClick={() => openPaymentModal(m)} style={{
                              padding:'3px 10px',borderRadius:'4px',fontSize:'11px',fontWeight:600,
                              background:'#f39c12',color:'white',cursor:'pointer'
                            }}>PARTIAL (Rs.{m.paid_amount || 0})</span>
                          ) : (
                            <button onClick={() => openPaymentModal(m)} style={{
                              padding:'5px 10px',border:'none',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontWeight:600,
                              background:'linear-gradient(135deg,#9b59b6,#8e44ad)',color:'white'
                            }}>Mark Paid</button>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {m.payment_status !== 'PAID' && (
                            <button onClick={() => openEditModal(m)} style={{
                              padding:'5px 10px',border:'none',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontWeight:600,
                              background:'linear-gradient(135deg,#3498db,#2980b9)',color:'white'
                            }}>Edit / Return</button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === LOW STOCK TAB === */}
      {activeTab === 'low-stock' && (
        <div>
          {(() => {
            const alerts = inventory.filter(i => i.low_stock || i.no_stock);
            if (alerts.length === 0) {
              return <div style={{background:'white',padding:'60px',borderRadius:'12px',textAlign:'center',color:'#27ae60',fontSize:'16px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                <span className="material-icons" style={{fontSize:'48px',display:'block',marginBottom:'10px'}}>check_circle</span>
                All items are well stocked!
              </div>;
            }
            return (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'15px'}}>
                {alerts.map((item, idx) => (
                  <div key={idx} style={{
                    background:'white',padding:'20px',borderRadius:'10px',
                    boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                    borderLeft: '4px solid ' + (item.no_stock ? '#e74c3c' : '#f39c12')
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <strong style={{fontSize:'15px',color:'#2c3e50'}}>{item.item_name}</strong>
                      <span style={{
                        padding:'3px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:700,
                        background: item.no_stock ? '#fde2e2' : '#fef9e7',
                        color: item.no_stock ? '#c0392b' : '#e67e22'
                      }}>{item.no_stock ? 'OUT OF STOCK' : 'LOW STOCK'}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'12px',color:'#7f8c8d'}}>{getCategoryLabel(item.category)}</span>
                      <span style={{fontSize:'22px',fontWeight:700,color: item.no_stock ? '#e74c3c' : '#f39c12'}}>{item.available_stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* === ADD STOCK MODAL === */}
      {showLogForm && (
        <div onClick={() => { setShowLogForm(false); resetForm(); }} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
            <h3 style={{margin:'0 0 20px',color:'#2c3e50',fontSize:'20px'}}>Log Stock Movement</h3>
            <form onSubmit={logMovement}>
              {/* Movement Type */}
              <div style={fgStyle}>
                <label style={flStyle}>Type *</label>
                <select required value={form.movement_type}
                  onChange={(e) => setForm({...form, movement_type: e.target.value})} style={fiStyle}>
                  <option value="IN">Stock IN (Receiving)</option>
                  <option value="OUT">Stock OUT (Issued to Engineer)</option>
                </select>
              </div>

              {/* Category */}
              <div style={fgStyle}>
                <label style={flStyle}>Category *</label>
                <select required value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value, sub_type: ''})} style={fiStyle}>
                  <option value="">Select Category</option>
                  {STOCK_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Machine Sub-type */}
              {form.category === 'MACHINE' && (
                <div style={fgStyle}>
                  <label style={flStyle}>Machine Type *</label>
                  <select required value={form.sub_type}
                    onChange={(e) => setForm({...form, sub_type: e.target.value})} style={fiStyle}>
                    <option value="">Select Machine Type</option>
                    {MACHINE_SUBTYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}

              {/* Item Name with autocomplete */}
              <div style={{...fgStyle,position:'relative'}}>
                <label style={flStyle}>Item Name *</label>
                <input required placeholder="Type or search item name..."
                  value={itemSearch || form.item_name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItemSearch(val);
                    setForm({...form, item_name: val});
                    setShowItemDropdown(val.length > 0);
                    if (form.movement_type === 'OUT' && val) checkStock(val);
                  }}
                  onFocus={() => setShowItemDropdown(true)}
                  onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                  style={fiStyle} />
                {showItemDropdown && filteredPredefinedItems.length > 0 && (
                  <div style={{
                    position:'absolute',top:'100%',left:0,right:0,maxHeight:'200px',overflowY:'auto',
                    background:'white',border:'1px solid #ddd',borderRadius:'0 0 6px 6px',zIndex:10,
                    boxShadow:'0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {filteredPredefinedItems.map((item, i) => (
                      <div key={i} onMouseDown={() => handleItemSelect(item)} style={{
                        padding:'8px 12px',cursor:'pointer',fontSize:'13px',
                        borderBottom:'1px solid #f0f0f0'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f0f4ff'}
                      onMouseLeave={(e) => e.target.style.background = 'white'}
                      >{item}</div>
                    ))}
                  </div>
                )}
                {stockWarning && (
                  <div style={{
                    padding:'8px 12px',borderRadius:'6px',marginTop:'8px',fontWeight:600,fontSize:'12px',
                    background: stockWarning.includes('No stock') ? '#fde2e2' : '#fef9e7',
                    color: stockWarning.includes('No stock') ? '#c0392b' : '#e67e22',
                    border: '1px solid ' + (stockWarning.includes('No stock') ? '#e74c3c' : '#f39c12')
                  }}>{stockWarning}</div>
                )}
              </div>

              {/* Quantity */}
              <div style={fgStyle}>
                <label style={flStyle}>Quantity *</label>
                <input type="number" required min="1" value={form.quantity}
                  onChange={(e) => setForm({...form, quantity: e.target.value === '' ? '' : parseInt(e.target.value) || 1})}
                  style={fiStyle} />
              </div>

              {/* Total Cost */}
              <div style={fgStyle}>
                <label style={flStyle}>Total Cost (Rs.)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.total_cost}
                  onChange={(e) => setForm({...form, total_cost: e.target.value})}
                  style={fiStyle} />
              </div>

              {/* Payment Status & Paid Amount */}
              <div style={{background:'#f0f9ff',padding:'16px',borderRadius:'10px',border:'1px solid #bae6fd',marginBottom:'14px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                  <span className="material-icons" style={{fontSize:'20px',color:'#0284c7'}}>payments</span>
                  <span style={{fontWeight:700,fontSize:'14px',color:'#0369a1'}}>Payment Details</span>
                </div>
                <div style={fgStyle}>
                  <label style={flStyle}>Payment Status *</label>
                  <select value={form.payment_status}
                    onChange={(e) => {
                      const status = e.target.value;
                      setForm({...form, payment_status: status, 
                        paid_amount: status === 'PAID' ? (Number(form.total_cost) || 0) : status === 'PENDING' ? 0 : form.paid_amount
                      });
                    }} style={fiStyle}>
                    <option value="PENDING">Pending - Not Paid Yet</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="PAID">Fully Paid</option>
                  </select>
                </div>
                {form.payment_status === 'PARTIALLY_PAID' && (
                  <div style={fgStyle}>
                    <label style={flStyle}>Amount Paid (Rs.)</label>
                    <input type="number" min="0" step="0.01" placeholder="Enter amount paid"
                      value={form.paid_amount}
                      onChange={(e) => setForm({...form, paid_amount: e.target.value})}
                      style={fiStyle} />
                  </div>
                )}
                {/* Payment Summary */}
                {Number(form.total_cost) > 0 && (
                  <div style={{background:'white',padding:'12px',borderRadius:'8px',marginTop:'8px',border:'1px solid #e0f2fe'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                      <span style={{fontSize:'13px',color:'#64748b'}}>Total Cost:</span>
                      <span style={{fontSize:'13px',fontWeight:700,color:'#1e293b'}}>Rs.{Number(form.total_cost).toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                      <span style={{fontSize:'13px',color:'#64748b'}}>Paid:</span>
                      <span style={{fontSize:'13px',fontWeight:700,color:'#059669'}}>
                        Rs.{(form.payment_status === 'PAID' ? Number(form.total_cost) : Number(form.paid_amount) || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div style={{borderTop:'1px solid #e2e8f0',paddingTop:'6px',display:'flex',justifyContent:'space-between'}}>
                      <span style={{fontSize:'13px',fontWeight:600,color:'#64748b'}}>Remaining:</span>
                      <span style={{fontSize:'15px',fontWeight:800,color: form.payment_status === 'PAID' ? '#059669' : '#dc2626'}}>
                        Rs.{Math.max(0, Number(form.total_cost) - (form.payment_status === 'PAID' ? Number(form.total_cost) : Number(form.paid_amount) || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Engineer & Ticket (for OUT) */}
              {form.movement_type === 'OUT' && (
                <>
                  <div style={fgStyle}>
                    <label style={flStyle}>Engineer * (Required for OUT)</label>
                    <select required value={form.engineer_id}
                      onChange={(e) => setForm({...form, engineer_id: e.target.value})} style={fiStyle}>
                      <option value="">Select Engineer</option>
                      {engineers.map(eng => <option key={eng.id} value={eng.id}>{eng.full_name}</option>)}
                    </select>
                  </div>
                  <div style={fgStyle}>
                    <label style={flStyle}>Ticket ID * (Required for OUT)</label>
                    <select required value={form.service_request_id}
                      onChange={(e) => setForm({...form, service_request_id: e.target.value})} style={fiStyle}>
                      <option value="">Select Ticket</option>
                      {complaints.map(c => (
                        <option key={c.id} value={c.id}>#{c.id} - {c.ticket_no || ''} - {c.customer_name} ({c.machine_model || 'N/A'})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Reference Type */}
              <div style={fgStyle}>
                <label style={flStyle}>Reference Type</label>
                <select value={form.reference_type} onChange={(e) => setForm({...form, reference_type: e.target.value})} style={fiStyle}>
                  <option value="">Select Type</option>
                  <option value="INVOICE">Invoice</option>
                  <option value="PO">Purchase Order</option>
                  <option value="DO">Delivery Order</option>
                  <option value="DC">Delivery Challan</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div style={fgStyle}>
                <label style={flStyle}>Notes</label>
                <textarea rows="3" placeholder="Additional details..." value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  style={{...fiStyle,resize:'vertical',fontFamily:'inherit'}} />
              </div>

              <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'20px'}}>
                <button type="button" onClick={() => { setShowLogForm(false); resetForm(); }}
                  style={{padding:'10px 20px',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',background:'#95a5a6',color:'white'}}>Cancel</button>
                <button type="submit"
                  style={{padding:'10px 20px',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',
                    background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white'}}>Log Movement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === PAYMENT MODAL === */}
      {showPaymentModal && selectedMovement && (
        <div onClick={() => setShowPaymentModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
            <h3 style={{margin:'0 0 20px',color:'#2c3e50'}}>Payment for: {selectedMovement.item_name}</h3>
            <div style={{background:'#f8f9fa',padding:'15px',borderRadius:'8px',marginBottom:'20px'}}>
              <p style={{margin:'4px 0'}}><strong>Item:</strong> {selectedMovement.item_name}</p>
              <p style={{margin:'4px 0'}}><strong>Category:</strong> {getCategoryLabel(selectedMovement.category)}</p>
              <p style={{margin:'4px 0'}}><strong>Quantity:</strong> {selectedMovement.quantity}</p>
              <p style={{margin:'4px 0'}}><strong>Total Cost:</strong> Rs.{selectedMovement.total_cost || 0}</p>
              <p style={{margin:'4px 0'}}><strong>Already Paid:</strong> Rs.{selectedMovement.paid_amount || 0}</p>
              {selectedMovement.total_cost > 0 && (
                <p style={{margin:'4px 0'}}><strong>Remaining:</strong> Rs.{(selectedMovement.total_cost - (selectedMovement.paid_amount || 0)).toFixed(2)}</p>
              )}
            </div>
            <button onClick={() => handlePayment(true)} style={{
              width:'100%',padding:'12px',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',
              background:'linear-gradient(135deg,#27ae60,#2ecc71)',color:'white',fontSize:'14px',marginBottom:'15px'
            }}>Mark as Fully PAID</button>
            <hr style={{margin:'10px 0',border:'none',borderTop:'1px solid #eee'}} />
            <p style={{fontWeight:600,marginBottom:'10px',fontSize:'14px'}}>Or enter partial amount:</p>
            <div style={fgStyle}>
              <input type="number" min="0" step="0.01" placeholder="Enter amount paid"
                value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} style={fiStyle} />
            </div>
            <button onClick={() => handlePayment(false)}
              disabled={!paymentAmount || Number(paymentAmount) <= 0}
              style={{
                width:'100%',padding:'10px',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',
                background:'linear-gradient(135deg,#f39c12,#e67e22)',color:'white',fontSize:'14px',
                opacity: (!paymentAmount || Number(paymentAmount) <= 0) ? 0.5 : 1
              }}>Record Partial Payment</button>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:'15px'}}>
              <button onClick={() => setShowPaymentModal(false)}
                style={{padding:'8px 20px',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',background:'#95a5a6',color:'white'}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* === EDIT/RETURN MODAL === */}
      {showEditModal && selectedMovement && (
        <div onClick={() => setShowEditModal(false)} style={overlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
            <h3 style={{margin:'0 0 15px',color:'#2c3e50'}}>Edit / Return: {selectedMovement.item_name}</h3>
            <p style={{background:'#e8f5e9',padding:'8px 12px',borderRadius:'6px',fontSize:'12px',color:'#2e7d32',marginBottom:'15px'}}>
              Reduce quantity if customer returned items. Stock will be adjusted accordingly.
            </p>
            <div style={fgStyle}>
              <label style={flStyle}>Current Quantity: {selectedMovement.quantity}</label>
              <input type="number" min="0" max={selectedMovement.quantity}
                value={editForm.quantity}
                onChange={(e) => setEditForm({...editForm, quantity: e.target.value === '' ? '' : parseInt(e.target.value) || 0})}
                style={fiStyle} />
              {Number(editForm.quantity) < selectedMovement.quantity && (
                <small style={{color:'#e67e22',fontWeight:600,marginTop:'4px',display:'block'}}>
                  Returning {selectedMovement.quantity - Number(editForm.quantity)} unit(s) to stock
                </small>
              )}
            </div>
            <div style={fgStyle}>
              <label style={flStyle}>Notes</label>
              <textarea rows="3" placeholder="Reason for edit/return..."
                value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                style={{...fiStyle,resize:'vertical',fontFamily:'inherit'}} />
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'20px'}}>
              <button onClick={() => setShowEditModal(false)}
                style={{padding:'10px 20px',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',background:'#95a5a6',color:'white'}}>Cancel</button>
              <button onClick={handleEdit}
                style={{padding:'10px 20px',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',
                  background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white'}}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Style constants ---
const thStyle = { padding:'12px 14px',textAlign:'left',fontWeight:600,fontSize:'11px',color:'#7f8c8d',textTransform:'uppercase',letterSpacing:'0.5px' };
const tdStyle = { padding:'12px 14px',fontSize:'13px',color:'#2c3e50' };
const filterLabel = { fontSize:'11px',fontWeight:600,color:'#7f8c8d',textTransform:'uppercase' };
const filterInput = { padding:'8px 12px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'13px',minWidth:'120px' };
const overlayStyle = { position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 };
const modalStyle = { background:'white',borderRadius:'12px',padding:'30px',maxWidth:'520px',width:'90%',maxHeight:'90vh',overflowY:'auto' };
const fgStyle = { marginBottom:'14px' };
const flStyle = { display:'block',marginBottom:'5px',fontWeight:600,fontSize:'13px',color:'#2c3e50' };
const fiStyle = { width:'100%',padding:'10px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'14px',boxSizing:'border-box' };

function getCategoryColor(category) {
  const colors = {
    SPARE: { bg: '#e8f5e9', text: '#2e7d32' },
    MACHINE: { bg: '#e3f2fd', text: '#1565c0' },
    TONER: { bg: '#fff3e0', text: '#e65100' },
    STABILIZER: { bg: '#f3e5f5', text: '#7b1fa2' },
    TONER_CHIP: { bg: '#fce4ec', text: '#c62828' },
    DRUM_CHIP: { bg: '#efebe9', text: '#4e342e' },
    ID_CARD: { bg: '#e0f7fa', text: '#00695c' },
    SPACE_ROLLER: { bg: '#f1f8e9', text: '#33691e' },
    PICKUP_ROLLER: { bg: '#fff8e1', text: '#f57f17' },
    SCANNER_CABLE: { bg: '#e8eaf6', text: '#283593' },
    OLD_SPARE: { bg: '#fafafa', text: '#616161' },
    LAMINATION: { bg: '#fbe9e7', text: '#bf360c' },
  };
  return colors[category] || { bg: '#ecf0f1', text: '#7f8c8d' };
}

export default DeliveryLog;

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

const DeliveryLog = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [engineers, setEngineers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [stockBalances, setStockBalances] = useState({});
  const [filters, setFilters] = useState({
    type: 'ALL',
    search: '',
    dateFrom: '',
    dateTo: '',
    paymentStatus: 'ALL'
  });
  const [showLogForm, setShowLogForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [editForm, setEditForm] = useState({ quantity: 1, notes: '' });
  const [stockWarning, setStockWarning] = useState('');
  const [deliveryForm, setDeliveryForm] = useState({
    movement_type: 'IN',
    item_name: '',
    quantity: 1,
    reference_type: '',
    notes: '',
    engineer_id: '',
    service_request_id: '',
    total_cost: 0
  });

  useEffect(() => {
    fetchDeliveries();
    fetchEngineers();
    fetchComplaints();
  }, []);

  const fetchEngineers = async () => {
    try {
      const data = await apiRequest('/api/users?role=SERVICE_ENGINEER');
      setEngineers(data || []);
    } catch (error) {
      console.error('Failed to fetch engineers:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      const data = await apiRequest('/api/complaints/');
      setComplaints(data || []);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const data = await apiRequest('/api/stock-movements/');
      setDeliveries(data || []);
      const balances = {};
      (data || []).forEach(d => {
        if (!balances[d.item_name]) balances[d.item_name] = 0;
        if (d.movement_type === 'IN') balances[d.item_name] += d.quantity;
        if (d.movement_type === 'OUT') balances[d.item_name] -= d.quantity;
      });
      setStockBalances(balances);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStock = (itemName) => {
    const balance = stockBalances[itemName] || 0;
    if (balance <= 0) {
      setStockWarning('No stock available for "' + itemName + '"! Current stock: 0');
      return false;
    } else if (balance <= 5) {
      setStockWarning('Low stock warning: Only ' + balance + ' units of "' + itemName + '" remaining');
      return true;
    }
    setStockWarning('');
    return true;
  };

  const logDelivery = async (e) => {
    e.preventDefault();
    if (deliveryForm.movement_type === 'OUT') {
      if (!deliveryForm.engineer_id) {
        alert('Engineer is required for stock OUT movements');
        return;
      }
      if (!deliveryForm.service_request_id) {
        alert('Ticket ID is required for stock OUT movements');
        return;
      }
      const balance = stockBalances[deliveryForm.item_name] || 0;
      if (balance <= 0) {
        alert('No stock available for "' + deliveryForm.item_name + '"! Cannot create OUT movement.');
        return;
      }
      if (Number(deliveryForm.quantity) > balance) {
        alert('Insufficient stock! Only ' + balance + ' units of "' + deliveryForm.item_name + '" available.');
        return;
      }
    }
    try {
      const engId = deliveryForm.engineer_id ? Number(deliveryForm.engineer_id) : null;
      const svcId = deliveryForm.service_request_id ? Number(deliveryForm.service_request_id) : null;
      const qty = Number(deliveryForm.quantity) || 1;
      const payload = {
        movement_type: deliveryForm.movement_type,
        item_name: deliveryForm.item_name,
        quantity: qty,
        engineer_id: isNaN(engId) ? null : engId,
        service_request_id: isNaN(svcId) ? null : svcId,
        reference_type: deliveryForm.reference_type || null,
        notes: deliveryForm.notes || null,
        total_cost: Number(deliveryForm.total_cost) || 0
      };
      await apiRequest('/api/stock-movements/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowLogForm(false);
      setDeliveryForm({
        movement_type: 'IN', item_name: '', quantity: 1,
        reference_type: '', notes: '', engineer_id: '',
        service_request_id: '', total_cost: 0
      });
      setStockWarning('');
      fetchDeliveries();
      alert('Stock movement logged successfully!');
    } catch (error) {
      alert('Failed to log delivery: ' + (error.message || ''));
    }
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
      if (!payFull && paymentAmount) {
        body.amount = Number(paymentAmount);
      }
      await apiRequest('/api/stock-movements/' + selectedMovement.id + '/payment', {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      setShowPaymentModal(false);
      setSelectedMovement(null);
      setPaymentAmount('');
      fetchDeliveries();
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
    if (newQty < 0) {
      alert('Quantity cannot be negative');
      return;
    }
    try {
      await apiRequest('/api/stock-movements/' + selectedMovement.id, {
        method: 'PUT',
        body: JSON.stringify({
          quantity: newQty,
          notes: editForm.notes
        })
      });
      setShowEditModal(false);
      setSelectedMovement(null);
      fetchDeliveries();
      alert('Movement updated successfully!');
    } catch (error) {
      alert('Failed to update: ' + (error.message || ''));
    }
  };

  const filteredDeliveries = deliveries.filter(del => {
    if (filters.type !== 'ALL' && del.movement_type !== filters.type) return false;
    if (filters.paymentStatus !== 'ALL' && del.payment_status !== filters.paymentStatus) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        del.item_name.toLowerCase().includes(search) ||
        (del.reference || '').toLowerCase().includes(search) ||
        (del.engineer_name || '').toLowerCase().includes(search)
      );
    }
    if (filters.dateFrom) {
      const delDate = new Date(del.created_at || del.date);
      if (delDate < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      const delDate = new Date(del.created_at || del.date);
      if (delDate > new Date(filters.dateTo)) return false;
    }
    return true;
  });

  const stats = {
    totalIn: deliveries.filter(d => d.movement_type === 'IN').length,
    totalOut: deliveries.filter(d => d.movement_type === 'OUT').length,
    paymentPending: deliveries.filter(d => d.movement_type === 'OUT' && (d.payment_status === 'PENDING' || d.payment_status === 'PARTIALLY_PAID')).length,
    paid: deliveries.filter(d => d.movement_type === 'OUT' && d.payment_status === 'PAID').length
  };

  if (loading) {
    return <div className="loading">Loading delivery log...</div>;
  }

  return (
    <div className="reception-page">
      <div className="page-header">
        <h1>Delivery IN / OUT Log</h1>
        <button className="btn-primary" onClick={() => setShowLogForm(true)}>
          + Log Delivery
        </button>
      </div>
      <p className="page-subtitle">Replacement of DC notebook</p>

      <div className="stats-grid">
        <div className="stat-card in">
          <div className="stat-content">
            <div className="stat-value">{stats.totalIn}</div>
            <div className="stat-label">Stock IN</div>
          </div>
        </div>
        <div className="stat-card out">
          <div className="stat-content">
            <div className="stat-value">{stats.totalOut}</div>
            <div className="stat-label">Stock OUT</div>
          </div>
        </div>
        <div className="stat-card payment-pending">
          <div className="stat-content">
            <div className="stat-value">{stats.paymentPending}</div>
            <div className="stat-label">Payment Pending</div>
          </div>
        </div>
        <div className="stat-card paid">
          <div className="stat-content">
            <div className="stat-value">{stats.paid}</div>
            <div className="stat-label">Paid</div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Search:</label>
          <input type="text" placeholder="Item, reference, engineer..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})} />
        </div>
        <div className="filter-group">
          <label>Type:</label>
          <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
            <option value="ALL">All</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Payment:</label>
          <select value={filters.paymentStatus} onChange={(e) => setFilters({...filters, paymentStatus: e.target.value})}>
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Date From:</label>
          <input type="date" value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} />
        </div>
        <div className="filter-group">
          <label>Date To:</label>
          <input type="date" value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})} />
        </div>
        <div className="filter-info">
          Showing {filteredDeliveries.length} of {deliveries.length} records
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Item Name</th>
              <th>Qty</th>
              <th>Stock Balance</th>
              <th>Engineer</th>
              <th>Service ID</th>
              <th>Total Cost</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.length === 0 ? (
              <tr><td colSpan="10" className="empty-state">No delivery records found</td></tr>
            ) : (
              filteredDeliveries.map(del => {
                const balance = stockBalances[del.item_name] || 0;
                const isLowStock = balance > 0 && balance <= 5;
                const isNoStock = balance <= 0;
                return (
                  <tr key={del.id}>
                    <td>
                      <div>{new Date(del.created_at || del.date).toLocaleDateString()}</div>
                      <small className="time-text">{new Date(del.created_at || del.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                    </td>
                    <td>
                      <span className={'type-badge ' + del.movement_type.toLowerCase()}>
                        {del.movement_type}
                      </span>
                    </td>
                    <td>
                      <strong>{del.item_name}</strong>
                      {isNoStock && <div className="stock-alert no-stock">NO STOCK</div>}
                      {isLowStock && <div className="stock-alert low-stock">LOW STOCK: {balance}</div>}
                    </td>
                    <td className="quantity">{del.quantity}</td>
                    <td>
                      <span className={isNoStock ? 'balance-danger' : isLowStock ? 'balance-warning' : 'balance-ok'}>
                        {balance}
                      </span>
                    </td>
                    <td>{del.engineer_name || (del.movement_type === 'IN' ? '-' : 'N/A')}</td>
                    <td>{del.service_request_id || '-'}</td>
                    <td>{del.total_cost ? 'Rs.' + del.total_cost : '-'}</td>
                    <td>
                      {del.movement_type === 'OUT' ? (
                        del.payment_status === 'PAID' ? (
                          <span className="payment-badge paid">PAID</span>
                        ) : del.payment_status === 'PARTIALLY_PAID' ? (
                          <span className="payment-badge partial" onClick={() => openPaymentModal(del)} style={{cursor:'pointer'}}>
                            PARTIAL (Rs.{del.paid_amount || 0})
                          </span>
                        ) : (
                          <button className="btn-mark-paid" onClick={() => openPaymentModal(del)}>
                            Mark Paid
                          </button>
                        )
                      ) : '-'}
                    </td>
                    <td>
                      {del.movement_type === 'OUT' && del.payment_status !== 'PAID' && (
                        <button className="btn-edit" onClick={() => openEditModal(del)}>
                          Edit / Return
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showLogForm && (
        <div className="modal-overlay" onClick={() => { setShowLogForm(false); setStockWarning(''); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Log Stock Movement</h3>
            <p className="form-hint">Payment status will be set to PENDING by default</p>
            {stockWarning && (
              <div className={'stock-warning-box ' + (stockWarning.includes('No stock') ? 'danger' : 'warning')}>
                {stockWarning}
              </div>
            )}
            <form onSubmit={logDelivery}>
              <div className="form-group">
                <label>Type *</label>
                <select required value={deliveryForm.movement_type}
                  onChange={(e) => setDeliveryForm({...deliveryForm, movement_type: e.target.value})}>
                  <option value="IN">Stock IN (Receiving)</option>
                  <option value="OUT">Stock OUT (Service Use)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Item Name *</label>
                <input required placeholder="e.g., Printer Toner, Paper Box, Spare Part"
                  value={deliveryForm.item_name}
                  onChange={(e) => {
                    setDeliveryForm({...deliveryForm, item_name: e.target.value});
                    if (deliveryForm.movement_type === 'OUT' && e.target.value) {
                      checkStock(e.target.value);
                    }
                  }} />
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input type="number" required min="1" value={deliveryForm.quantity}
                  onChange={(e) => setDeliveryForm({...deliveryForm, quantity: e.target.value === '' ? '' : parseInt(e.target.value) || 1})} />
              </div>
              <div className="form-group">
                <label>Total Cost (Rs.)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00"
                  value={deliveryForm.total_cost}
                  onChange={(e) => setDeliveryForm({...deliveryForm, total_cost: e.target.value})} />
              </div>
              {deliveryForm.movement_type === 'OUT' && (
                <>
                  <div className="form-group">
                    <label>Engineer * (Required for OUT)</label>
                    <select required value={deliveryForm.engineer_id}
                      onChange={(e) => setDeliveryForm({...deliveryForm, engineer_id: e.target.value})}>
                      <option value="">Select Engineer</option>
                      {engineers.map(eng => (
                        <option key={eng.id} value={eng.id}>{eng.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ticket ID * (Required for OUT)</label>
                    <select required value={deliveryForm.service_request_id}
                      onChange={(e) => setDeliveryForm({...deliveryForm, service_request_id: e.target.value})}>
                      <option value="">Select Ticket</option>
                      {complaints.map(c => (
                        <option key={c.id} value={c.id}>
                          #{c.id} - {c.ticket_no || ''} - {c.customer_name} ({c.machine_model || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="form-group">
                <label>Reference Type</label>
                <select value={deliveryForm.reference_type}
                  onChange={(e) => setDeliveryForm({...deliveryForm, reference_type: e.target.value})}>
                  <option value="">Select Type</option>
                  <option value="INVOICE">Invoice</option>
                  <option value="PO">Purchase Order</option>
                  <option value="DO">Delivery Order</option>
                  <option value="DC">Delivery Challan</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows="3" placeholder="Additional details..."
                  value={deliveryForm.notes}
                  onChange={(e) => setDeliveryForm({...deliveryForm, notes: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowLogForm(false); setStockWarning(''); }}>Cancel</button>
                <button type="submit" className="btn-primary">Log Movement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedMovement && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Payment for: {selectedMovement.item_name}</h3>
            <div className="payment-info">
              <p><strong>Item:</strong> {selectedMovement.item_name}</p>
              <p><strong>Quantity:</strong> {selectedMovement.quantity}</p>
              <p><strong>Total Cost:</strong> Rs.{selectedMovement.total_cost || 0}</p>
              <p><strong>Already Paid:</strong> Rs.{selectedMovement.paid_amount || 0}</p>
              {selectedMovement.total_cost > 0 && (
                <p><strong>Remaining:</strong> Rs.{(selectedMovement.total_cost - (selectedMovement.paid_amount || 0)).toFixed(2)}</p>
              )}
            </div>
            <div className="payment-actions-section">
              <button className="btn-primary" onClick={() => handlePayment(true)}
                style={{width:'100%', marginBottom:'15px'}}>
                Mark as Fully PAID
              </button>
              <hr style={{margin:'10px 0', border:'none', borderTop:'1px solid #eee'}} />
              <p style={{fontWeight:600, marginBottom:'10px'}}>Or enter partial amount:</p>
              <div className="form-group">
                <input type="number" min="0" step="0.01" placeholder="Enter amount paid"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)} />
              </div>
              <button className="btn-partial" onClick={() => handlePayment(false)}
                disabled={!paymentAmount || Number(paymentAmount) <= 0}>
                Record Partial Payment
              </button>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedMovement && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit / Return: {selectedMovement.item_name}</h3>
            <p className="form-hint">Reduce quantity if customer returned items. Stock will be adjusted accordingly.</p>
            <div className="form-group">
              <label>Current Quantity: {selectedMovement.quantity}</label>
              <input type="number" min="0" max={selectedMovement.quantity}
                value={editForm.quantity}
                onChange={(e) => setEditForm({...editForm, quantity: e.target.value === '' ? '' : parseInt(e.target.value) || 0})} />
              {Number(editForm.quantity) < selectedMovement.quantity && (
                <small style={{color:'#e67e22', fontWeight:600}}>
                  Returning {selectedMovement.quantity - Number(editForm.quantity)} unit(s) to stock
                </small>
              )}
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea rows="3" placeholder="Reason for edit/return..."
                value={editForm.notes}
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .reception-page { padding: 20px; max-width: 1600px; margin: 0 auto; }
        .page-header { display: flex; justify-content: flex-start; align-items: center; margin-bottom: 10px; gap: 20px; }
        .page-header h1 { margin: 0; color: #2c3e50; font-size: 28px; flex: 0 0 auto; }
        .page-header .btn-primary { flex-shrink: 0; margin-left: auto; }
        .page-subtitle { margin: 5px 0 25px 0; color: #7f8c8d; font-size: 14px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 15px; border-left: 4px solid; }
        .stat-card.in { border-color: #27ae60; }
        .stat-card.out { border-color: #e74c3c; }
        .stat-card.payment-pending { border-color: #9b59b6; }
        .stat-card.paid { border-color: #27ae60; }
        .stat-value { font-size: 32px; font-weight: bold; color: #2c3e50; }
        .stat-label { font-size: 13px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; }
        .filters-section { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; display: flex; gap: 15px; flex-wrap: wrap; align-items: end; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .filter-group { display: flex; flex-direction: column; gap: 5px; }
        .filter-group label { font-size: 12px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; }
        .filter-group input, .filter-group select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; min-width: 150px; }
        .filter-info { margin-left: auto; padding: 8px 12px; background: #ecf0f1; border-radius: 6px; font-size: 13px; font-weight: 600; color: #2c3e50; }
        .data-table-container { background: white; border-radius: 12px; overflow-x: auto; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 14px; text-align: left; border-bottom: 1px solid #ecf0f1; }
        .data-table th { background: #f8f9fa; font-weight: 600; font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; }
        .data-table tbody tr:hover { background: #f8f9fa; }
        .type-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .type-badge.in { background: #27ae60; color: white; }
        .type-badge.out { background: #e74c3c; color: white; }
        .quantity { font-weight: bold; color: #2c3e50; }
        .time-text { color: #7f8c8d; font-size: 11px; }
        .stock-alert { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px; margin-top: 4px; display: inline-block; }
        .stock-alert.no-stock { background: #e74c3c; color: white; }
        .stock-alert.low-stock { background: #f39c12; color: white; }
        .balance-danger { color: #e74c3c; font-weight: bold; }
        .balance-warning { color: #f39c12; font-weight: bold; }
        .balance-ok { color: #27ae60; font-weight: bold; }
        .payment-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .payment-badge.paid { background: #27ae60; color: white; }
        .payment-badge.partial { background: #f39c12; color: white; }
        .btn-mark-paid { padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white; transition: all 0.2s; white-space: nowrap; }
        .btn-mark-paid:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(155,89,182,0.4); }
        .btn-edit { padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; background: linear-gradient(135deg, #3498db, #2980b9); color: white; transition: all 0.2s; white-space: nowrap; }
        .btn-edit:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(52,152,219,0.4); }
        .btn-partial { width: 100%; padding: 10px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #f39c12, #e67e22); color: white; font-size: 14px; }
        .btn-partial:disabled { opacity: 0.5; cursor: not-allowed; }
        .stock-warning-box { padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; font-weight: 600; font-size: 13px; }
        .stock-warning-box.danger { background: #fde2e2; color: #c0392b; border: 1px solid #e74c3c; }
        .stock-warning-box.warning { background: #fef9e7; color: #e67e22; border: 1px solid #f39c12; }
        .payment-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .payment-info p { margin: 5px 0; }
        .payment-actions-section { margin-bottom: 15px; }
        .empty-state { text-align: center; padding: 60px 20px !important; color: #95a5a6; font-style: italic; font-size: 16px; }
        .btn-primary, .btn-secondary { padding: 10px 20px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-size: 14px; display: inline-block; white-space: nowrap; }
        .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; box-shadow: 0 2px 8px rgba(102,126,234,0.25); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
        .btn-secondary { background: #95a5a6; color: white; }
        .btn-secondary:hover { background: #7f8c8d; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-content h3 { margin: 0 0 25px 0; color: #2c3e50; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 13px; color: #2c3e50; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; font-family: inherit; }
        .form-group textarea { resize: vertical; }
        .form-hint { background: #e8f5e9; padding: 8px 12px; border-radius: 6px; font-size: 12px; color: #2e7d32; margin-bottom: 15px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
        .loading { text-align: center; padding: 100px; font-size: 20px; color: #7f8c8d; }
      `}</style>
    </div>
  );
};

export default DeliveryLog;

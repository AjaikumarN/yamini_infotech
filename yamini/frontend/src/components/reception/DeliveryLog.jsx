import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

const DeliveryLog = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [engineers, setEngineers] = useState([]);
  const [filters, setFilters] = useState({
    type: 'ALL',
    search: '',
    dateFrom: '',
    dateTo: '',
    paymentStatus: 'ALL'
  });
  const [showLogForm, setShowLogForm] = useState(false);
  // Form for logging - Payment status set to PENDING by default
  const [deliveryForm, setDeliveryForm] = useState({
    movement_type: 'IN',
    item_name: '',
    quantity: 1,
    reference_type: '',
    notes: '',
    engineer_id: '',
    service_request_id: ''
  });

  useEffect(() => {
    fetchDeliveries();
    fetchEngineers();
  }, []);

  const fetchEngineers = async () => {
    try {
      const data = await apiRequest('/api/users?role=SERVICE_ENGINEER');
      setEngineers(data || []);
    } catch (error) {
      console.error('Failed to fetch engineers:', error);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const data = await apiRequest('/api/stock-movements/');
      setDeliveries(data || []);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const logDelivery = async (e) => {
    e.preventDefault();
    
    // Validation for OUT movements
    if (deliveryForm.movement_type === 'OUT') {
      if (!deliveryForm.engineer_id) {
        alert('❌ Engineer is required for stock OUT movements');
        return;
      }
      if (!deliveryForm.service_request_id) {
        alert('❌ Ticket ID is required for stock OUT movements');
        return;
      }
    }
    
    try {
      // Clean payload: convert empty strings to null for optional int fields
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
      };
      // Backend automatically sets: approval_status=PENDING, payment_status=UNBILLED
      await apiRequest('/api/stock-movements/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowLogForm(false);
      setDeliveryForm({
        movement_type: 'IN',
        item_name: '',
        quantity: 1,
        reference_type: '',
        notes: '',
        engineer_id: '',
        service_request_id: ''
      });
      fetchDeliveries();
      alert('✅ Stock movement logged successfully!');
    } catch (error) {
      alert('❌ Failed to log delivery: ' + (error.message || ''));
    }
  };

  // Mark payment as PAID
  const markAsPaid = async (movementId) => {
    if (!confirm('Mark this stock as PAID?')) return;
    try {
      await apiRequest(`/api/stock-movements/${movementId}/payment`, {
        method: 'PUT',
        body: JSON.stringify({ payment_status: 'PAID' })
      });
      fetchDeliveries();
      alert('✅ Marked as PAID!');
    } catch (error) {
      alert('❌ Failed to update payment: ' + (error.message || ''));
    }
  };

  const filteredDeliveries = deliveries.filter(del => {
    if (filters.type !== 'ALL' && del.movement_type !== filters.type) return false;
    // Filter by payment_status
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
      const fromDate = new Date(filters.dateFrom);
      if (delDate < fromDate) return false;
    }
    if (filters.dateTo) {
      const delDate = new Date(del.created_at || del.date);
      const toDate = new Date(filters.dateTo);
      if (delDate > toDate) return false;
    }
    return true;
  });

  const stats = {
    totalIn: deliveries.filter(d => d.movement_type === 'IN').length,
    totalOut: deliveries.filter(d => d.movement_type === 'OUT').length,
    paymentPending: deliveries.filter(d => d.movement_type === 'OUT' && d.payment_status === 'PENDING').length,
    paid: deliveries.filter(d => d.movement_type === 'OUT' && d.payment_status === 'PAID').length
  };

  if (loading) {
    return <div className="loading">⏳ Loading delivery log...</div>;
  }

  return (
    <div className="reception-page">
      <div className="page-header">
        <h1>📦 Delivery IN / OUT Log</h1>
        <button className="btn-primary" onClick={() => setShowLogForm(true)}>
          ➕ Log Delivery
        </button>
      </div>
      <p className="page-subtitle">Replacement of DC notebook</p>

      {/* STATISTICS */}
      <div className="stats-grid">
        <div className="stat-card in">
          <div className="stat-icon">📥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalIn}</div>
            <div className="stat-label">Stock IN</div>
          </div>
        </div>
        <div className="stat-card out">
          <div className="stat-icon">📤</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalOut}</div>
            <div className="stat-label">Stock OUT</div>
          </div>
        </div>
        <div className="stat-card payment-pending">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.paymentPending}</div>
            <div className="stat-label">Payment Pending</div>
          </div>
        </div>
        <div className="stat-card paid">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.paid}</div>
            <div className="stat-label">Paid</div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Item, reference, engineer..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Type:</label>
          <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
            <option value="ALL">All</option>
            <option value="IN">📥 IN</option>
            <option value="OUT">📤 OUT</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Payment:</label>
          <select value={filters.paymentStatus} onChange={(e) => setFilters({...filters, paymentStatus: e.target.value})}>
            <option value="ALL">All</option>
            <option value="PENDING">💳 Pending</option>
            <option value="PAID">💰 Paid</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Date From:</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Date To:</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
          />
        </div>

        <div className="filter-info">
          Showing {filteredDeliveries.length} of {deliveries.length} records
        </div>
      </div>

      {/* DELIVERY TABLE - Separate Approval & Payment Columns */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Item Name</th>
              <th>Qty</th>
              <th>Engineer</th>
              <th>Service ID</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.length === 0 ? (
              <tr><td colSpan="7" className="empty-state">No delivery records found</td></tr>
            ) : (
              filteredDeliveries.map(del => (
                  <tr key={del.id}>
                    <td>
                      <div>{new Date(del.created_at || del.date).toLocaleDateString()}</div>
                      <small className="time-text">{new Date(del.created_at || del.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                    </td>
                    <td>
                      <span className={`type-badge ${del.movement_type.toLowerCase()}`}>
                        {del.movement_type === 'IN' ? '📥' : '📤'} {del.movement_type}
                      </span>
                    </td>
                    <td><strong>{del.item_name}</strong></td>
                    <td className="quantity">{del.quantity}</td>
                    <td>{del.engineer_name || (del.movement_type === 'IN' ? '-' : 'N/A')}</td>
                    <td>{del.service_request_id || '-'}</td>
                    {/* PAYMENT STATUS with Mark Paid button */}
                    <td>
                      {del.movement_type === 'OUT' ? (
                        del.payment_status === 'PAID' ? (
                          <span className="payment-badge paid">💰 PAID</span>
                        ) : (
                          <button className="btn-mark-paid" onClick={() => markAsPaid(del.id)}>
                            💳 Mark Paid
                          </button>
                        )
                      ) : '-'}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* LOG DELIVERY MODAL - Reception Only Logs, No Payment Status */}
      {showLogForm && (
        <div className="modal-overlay" onClick={() => setShowLogForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📦 Log Stock Movement</h3>
            <p className="form-hint">Payment status will be set to PENDING by default</p>
            <form onSubmit={logDelivery}>
              <div className="form-group">
                <label>Type *</label>
                <select
                  required
                  value={deliveryForm.movement_type}
                  onChange={(e) => setDeliveryForm({...deliveryForm, movement_type: e.target.value})}
                >
                  <option value="IN">📥 Stock IN (Receiving)</option>
                  <option value="OUT">📤 Stock OUT (Service Use)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  required
                  placeholder="e.g., Printer Toner, Paper Box, Spare Part"
                  value={deliveryForm.item_name}
                  onChange={(e) => setDeliveryForm({...deliveryForm, item_name: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={deliveryForm.quantity}
                  onChange={(e) => setDeliveryForm({...deliveryForm, quantity: e.target.value === '' ? '' : parseInt(e.target.value) || 1})}
                />
              </div>
              
              {/* SHOW THESE FIELDS ONLY FOR OUT MOVEMENTS */}
              {deliveryForm.movement_type === 'OUT' && (
                <>
                  <div className="form-group">
                    <label>Engineer * (Required for OUT)</label>
                    <select
                      required
                      value={deliveryForm.engineer_id}
                      onChange={(e) => setDeliveryForm({...deliveryForm, engineer_id: e.target.value})}
                    >
                      <option value="">Select Engineer</option>
                      {engineers.map(eng => (
                        <option key={eng.id} value={eng.id}>{eng.full_name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Ticket ID * (Required for OUT)</label>
                    <input
                      required
                      type="number"
                      placeholder="Ticket ID (e.g., 123)"
                      value={deliveryForm.service_request_id}
                      onChange={(e) => setDeliveryForm({...deliveryForm, service_request_id: e.target.value})}
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label>Reference Type</label>
                <select
                  value={deliveryForm.reference_type}
                  onChange={(e) => setDeliveryForm({...deliveryForm, reference_type: e.target.value})}
                >
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
                <textarea
                  rows="3"
                  placeholder="Additional details..."
                  value={deliveryForm.notes}
                  onChange={(e) => setDeliveryForm({...deliveryForm, notes: e.target.value})}
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowLogForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Log Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .reception-page {
          padding: 20px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 0;
          border-bottom: none;
          flex-shrink: 0;
          gap: 20px;
        }

        .page-header h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 28px;
          flex: 0 0 auto;
        }

        .page-header .btn-primary {
          flex-shrink: 0;
          margin-left: auto;
        }

        .page-subtitle {
          margin: 5px 0 25px 0;
          color: #7f8c8d;
          font-size: 14px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          gap: 15px;
          border-left: 4px solid;
        }

        .stat-card.in { border-color: #27ae60; }
        .stat-card.out { border-color: #e74c3c; }
        .stat-card.pending { border-color: #f39c12; }
        .stat-card.approved { border-color: #3498db; }
        .stat-card.unbilled { border-color: #95a5a6; }
        .stat-card.payment-pending { border-color: #9b59b6; }
        .stat-card.paid { border-color: #27ae60; }

        .stat-icon {
          font-size: 36px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #2c3e50;
        }

        .stat-label {
          font-size: 13px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filters-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          align-items: end;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .filter-group label {
          font-size: 12px;
          font-weight: 600;
          color: #7f8c8d;
          text-transform: uppercase;
        }

        .filter-group input,
        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          min-width: 150px;
        }

        .filter-info {
          margin-left: auto;
          padding: 8px 12px;
          background: #ecf0f1;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #2c3e50;
        }

        .data-table-container {
          background: white;
          border-radius: 12px;
          overflow-x: auto;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 14px;
          text-align: left;
          border-bottom: 1px solid #ecf0f1;
        }

        .data-table th {
          background: #f8f9fa;
          font-weight: 600;
          font-size: 12px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .data-table tbody tr:hover {
          background: #f8f9fa;
        }

        .type-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .type-badge.in {
          background: #27ae60;
          color: white;
        }

        .type-badge.out {
          background: #e74c3c;
          color: white;
        }

        .quantity {
          font-weight: bold;
          color: #2c3e50;
        }

        .time-text {
          color: #7f8c8d;
          font-size: 11px;
        }

        /* APPROVAL STATUS BADGES - Operational Control */
        .approval-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .approval-badge.pending {
          background: #f39c12;
          color: white;
        }

        .approval-badge.approved {
          background: #27ae60;
          color: white;
        }

        .approval-badge.rejected {
          background: #e74c3c;
          color: white;
        }

        /* PAYMENT STATUS BADGES */
        .payment-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .payment-badge.paid {
          background: #27ae60;
          color: white;
        }

        /* MARK PAID BUTTON */
        .btn-mark-paid {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
          color: white;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-mark-paid:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(155, 89, 182, 0.4);
          background: linear-gradient(135deg, #8e44ad 0%, #7d3c98 100%);
        }

        /* ACTION BUTTONS */
        .actions-cell {
          white-space: nowrap;
        }

        .action-buttons {
          display: inline-flex;
          gap: 5px;
        }

        .btn-approve, .btn-reject, .btn-payment {
          padding: 5px 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-approve {
          background: #27ae60;
          color: white;
        }

        .btn-approve:hover {
          background: #219a52;
        }

        .btn-reject {
          background: #e74c3c;
          color: white;
        }

        .btn-reject:hover {
          background: #c0392b;
        }

        .btn-payment {
          background: #9b59b6;
          color: white;
        }

        .btn-payment:hover {
          background: #8e44ad;
        }

        .form-hint {
          background: #e8f5e9;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          color: #2e7d32;
          margin-bottom: 15px;
        }

        .item-info {
          margin: 5px 0;
          color: #2c3e50;
        }

        .form-row {
          display: flex;
          gap: 15px;
        }

        .form-group.half {
          flex: 1;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.pending {
          background: #f39c12;
          color: white;
        }

        .status-badge.approved {
          background: #27ae60;
          color: white;
        }

        .status-badge.rejected {
          background: #e74c3c;
          color: white;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px !important;
          color: #95a5a6;
          font-style: italic;
          font-size: 16px;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
          display: inline-block;
          width: auto;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
        }

        .btn-secondary:hover {
          background: #7f8c8d;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin: 0 0 25px 0;
          color: #2c3e50;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          font-size: 13px;
          color: #2c3e50;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group textarea {
          resize: vertical;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 25px;
        }

        .loading {
          text-align: center;
          padding: 100px;
          font-size: 20px;
          color: #7f8c8d;
        }
      `}</style>
    </div>
  );
};

export default DeliveryLog;

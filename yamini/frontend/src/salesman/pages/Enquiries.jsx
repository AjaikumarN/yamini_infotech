import React, { useState, useEffect } from 'react';
import { getMyEnquiries, updateEnquiry } from '../hooks/useSalesmanApi';
import EmptyState from '../components/EmptyState';
import ExportButtons from '../components/ExportButtons';
import { showToast } from '../components/ToastNotification';
import { apiRequest } from '../../utils/api';
import ActionButton from '../../components/shared/dashboard/ActionButton';
import DataCard from '../../components/shared/dashboard/DataCard';
import StatusBadge from '../../components/shared/dashboard/StatusBadge';
import '../styles/salesman.css';

/**
 * Enquiries Page - View and manage leads (Enhanced with export and search)
 */
export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEnquiry, setNewEnquiry] = useState({
    customer_name: '',
    phone: '',
    email: '',
    product_interest: '',
    source: 'field_visit',
    priority: 'WARM',
    notes: ''
  });

  useEffect(() => {
    loadEnquiries();
  }, [filter]);

  useEffect(() => {
    filterEnquiries();
  }, [enquiries, searchQuery]);

  const loadEnquiries = async () => {
    try {
      const filters = filter === 'all' ? {} : { status: filter };
      const data = await getMyEnquiries(filters);
      setEnquiries(data);
    } catch (error) {
      console.error('Failed to load enquiries:', error);
      showToast && showToast('Failed to load enquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterEnquiries = () => {
    if (!searchQuery) {
      setFilteredEnquiries(enquiries);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = enquiries.filter(e =>
      e.customer_name?.toLowerCase().includes(query) ||
      e.email?.toLowerCase().includes(query) ||
      e.phone?.includes(query) ||
      e.product_interest?.toLowerCase().includes(query) ||
      e.notes?.toLowerCase().includes(query)
    );
    setFilteredEnquiries(filtered);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateEnquiry(id, { status: newStatus });
      showToast && showToast('✅ Status updated successfully!', 'success');
      await loadEnquiries();
    } catch (error) {
      console.error('Failed to update enquiry:', error);
      showToast && showToast('Failed to update status', 'error');
    }
  };

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    
    if (!newEnquiry.customer_name || !newEnquiry.phone) {
      showToast && showToast('Please fill in required fields', 'error');
      return;
    }

    try {
      await apiRequest('/api/enquiries', {
        method: 'POST',
        body: JSON.stringify(newEnquiry)
      });
      
      showToast && showToast('✅ Enquiry created successfully!', 'success');
      setShowCreateModal(false);
      setNewEnquiry({
        customer_name: '',
        phone: '',
        email: '',
        product_interest: '',
        source: 'field_visit',
        priority: 'WARM',
        notes: ''
      });
      await loadEnquiries();
    } catch (error) {
      console.error('Failed to create enquiry:', error);
      showToast && showToast('Failed to create enquiry', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#6B7280' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
            Enquiries & Leads
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            {filteredEnquiries.length} of {enquiries.length} enquiries
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <ActionButton 
            variant="primary" 
            icon="add_circle"
            onClick={() => setShowCreateModal(true)}
          >
            Create Enquiry
          </ActionButton>
          <ExportButtons 
            data={filteredEnquiries} 
            filename="enquiries" 
            type="enquiries" 
          />
          <select
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              background: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Enquiries</option>
            <option value="new">🆕 New</option>
            <option value="contacted">📞 Contacted</option>
            <option value="qualified">✅ Qualified</option>
            <option value="converted">🎉 Converted</option>
            <option value="lost">❌ Lost</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="🔍 Search by name, email, phone, product interest..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '500px',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            fontSize: '14px',
            color: '#374151',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3B82F6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#D1D5DB';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {filteredEnquiries.length === 0 ? (
        <EmptyState 
          icon="📋" 
          message={searchQuery 
            ? "No enquiries match your search" 
            : "No enquiries found. Try changing the filter."
          } 
        />
      ) : (
        <DataCard
          title={`Enquiries (${filteredEnquiries.length})`}
          subtitle="View and manage all your leads"
          noPadding
        >
          {/* Table Container */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr 1.2fr 1.5fr',
              gap: '16px',
              padding: '16px 20px',
              background: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              minWidth: '800px'
            }}>
              <div>Customer</div>
              <div>Phone</div>
              <div>Product</div>
              <div>Status</div>
              <div>Date</div>
              <div>Actions</div>
            </div>

            {/* Table Rows */}
            {filteredEnquiries.map((enquiry, index) => (
              <div 
                key={enquiry.id} 
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr 1.2fr 1.5fr',
                  gap: '16px',
                  padding: '16px 20px',
                  borderBottom: index < filteredEnquiries.length - 1 ? '1px solid #F3F4F6' : 'none',
                  alignItems: 'center',
                  transition: 'background-color 0.15s',
                  minWidth: '800px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
              >
                {/* Customer Name + Email */}
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#111827',
                    marginBottom: '2px'
                  }}>
                    {enquiry.customer_name}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#9CA3AF'
                  }}>
                    {enquiry.email}
                  </div>
                </div>

                {/* Phone */}
                <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                  {enquiry.phone}
                </div>

                {/* Product Interest */}
                <div style={{ 
                  fontSize: '13px', 
                  color: '#374151'
                }}>
                  {enquiry.product_interest || 'N/A'}
                </div>

                {/* Status Badge */}
                <div>
                  <StatusBadge 
                    status={enquiry.status?.toUpperCase() || 'NEW'}
                    variant={enquiry.status?.toLowerCase() || 'new'}
                    size="sm"
                  />
                </div>

                {/* Date */}
                <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                  {new Date(enquiry.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Call Button */}
                  <a 
                    href={`tel:${enquiry.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    title="Call customer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: '#DBEAFE',
                      color: '#1E40AF',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#3B82F6';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#DBEAFE';
                      e.currentTarget.style.color = '#1E40AF';
                    }}
                  >
                    ☎️
                  </a>

                  {/* Create Order Button */}
                  <button 
                    onClick={() => window.location.href = `/salesman/create-order?enquiry_id=${enquiry.id}`}
                    title="Create order from this enquiry"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: '#D1FAE5',
                      color: '#065F46',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#10B981';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#D1FAE5';
                      e.currentTarget.style.color = '#065F46';
                    }}
                  >
                    🛒
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DataCard>
      )}

      {/* Create Enquiry Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                Create New Enquiry
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  padding: '4px',
                  lineHeight: 1,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F3F4F6';
                  e.currentTarget.style.color = '#6B7280';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#9CA3AF';
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateEnquiry} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Customer Name */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Customer Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newEnquiry.customer_name}
                    onChange={(e) => setNewEnquiry({ ...newEnquiry, customer_name: e.target.value })}
                    required
                    placeholder="Enter customer name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3B82F6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D1D5DB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Phone Number <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={newEnquiry.phone}
                    onChange={(e) => setNewEnquiry({ ...newEnquiry, phone: e.target.value })}
                    required
                    placeholder="Enter phone number"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3B82F6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D1D5DB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newEnquiry.email}
                    onChange={(e) => setNewEnquiry({ ...newEnquiry, email: e.target.value })}
                    placeholder="customer@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3B82F6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D1D5DB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Product Interest */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Product Interest
                  </label>
                  <input
                    type="text"
                    value={newEnquiry.product_interest}
                    onChange={(e) => setNewEnquiry({ ...newEnquiry, product_interest: e.target.value })}
                    placeholder="e.g., HP LaserJet Printer"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3B82F6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D1D5DB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Priority
                  </label>
                  <select
                    value={newEnquiry.priority}
                    onChange={(e) => setNewEnquiry({ ...newEnquiry, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="HOT">🔥 Hot</option>
                    <option value="WARM">🌡️ Warm</option>
                    <option value="COLD">❄️ Cold</option>
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Source
                  </label>
                  <select
                    value={newEnquiry.source}
                    onChange={(e) => setNewEnquiry({ ...newEnquiry, source: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="field_visit">🚶 Field Visit</option>
                    <option value="phone">📞 Phone Call</option>
                    <option value="walk-in">🚪 Walk-in</option>
                    <option value="website">🌐 Website</option>
                    <option value="referral">👥 Referral</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                    Notes
                  </label>
                  <textarea
                    value={newEnquiry.notes}
                    onChange={(e) => setNewEnquiry({ ...newEnquiry, notes: e.target.value })}
                    placeholder="Additional details about the enquiry..."
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                marginTop: '24px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#F3F4F6';
                    e.target.style.borderColor = '#9CA3AF';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#FFFFFF';
                    e.target.style.borderColor = '#D1D5DB';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  Create Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

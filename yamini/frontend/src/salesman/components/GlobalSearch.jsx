import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/salesman.css';

/**
 * GlobalSearch - Advanced search across all modules
 * Keyboard shortcut: Cmd/Ctrl + K
 */
export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search function with debouncing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    
    // Mock search results - replace with real API calls
    const mockResults = [
      { id: 1, type: 'customer', title: 'Rajesh Kumar', subtitle: '9876543210', icon: '👤', route: '/salesman/enquiries' },
      { id: 2, type: 'enquiry', title: 'HP Printer Enquiry', subtitle: 'Status: New', icon: '📋', route: '/salesman/enquiries' },
      { id: 3, type: 'call', title: 'Call with Priya Sharma', subtitle: 'Today at 10:30 AM', icon: '📞', route: '/salesman/calls' },
      { id: 4, type: 'order', title: 'Order #1234', subtitle: 'Canon Pixma - ₹15,000', icon: '🧾', route: '/salesman/orders' },
      { id: 5, type: 'followup', title: 'Follow-up: Demo Setup', subtitle: 'Due tomorrow', icon: '🔁', route: '/salesman/followups' },
    ];

    // Filter results based on query
    const filtered = mockResults.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setResults(filtered);
    setLoading(false);
    setSelectedIndex(0);
  };

  const handleSelect = (result) => {
    navigate(result.route);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  if (!isOpen) {
    return (
      <button
        className="global-search-trigger"
        onClick={() => setIsOpen(true)}
        title="Search (⌘K)"
      >
        🔍 Search
      </button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div className="search-overlay" onClick={() => setIsOpen(false)} />

      {/* Search Modal */}
      <div className="search-modal">
        <div className="search-input-container">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search customers, enquiries, orders... (⌘K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              className="search-clear"
              onClick={() => setQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Results */}
        <div className="search-results">
          {loading && (
            <div className="search-loading">Searching...</div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="search-empty">
              <span className="empty-icon">🔍</span>
              <p>No results found for "{query}"</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="search-results-list">
              {results.map((result, idx) => (
                <div
                  key={result.id}
                  className={`search-result-item ${idx === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <span className="result-icon">{result.icon}</span>
                  <div className="result-content">
                    <div className="result-title">{result.title}</div>
                    <div className="result-subtitle">{result.subtitle}</div>
                  </div>
                  <span className="result-arrow">→</span>
                </div>
              ))}
            </div>
          )}

          {!query && (
            <div className="search-shortcuts">
              <div className="shortcut-section">
                <div className="shortcut-title">Quick Actions</div>
                <div className="shortcut-item" onClick={() => navigate('/salesman/calls')}>
                  <span>📞</span> Log a Call
                </div>
                <div className="shortcut-item" onClick={() => navigate('/salesman/enquiries')}>
                  <span>📋</span> View Enquiries
                </div>
                <div className="shortcut-item" onClick={() => navigate('/salesman/daily-report')}>
                  <span>📝</span> Daily Report
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="search-footer">
          <div className="search-hint">
            <kbd>↑↓</kbd> Navigate
            <kbd>Enter</kbd> Select
            <kbd>Esc</kbd> Close
          </div>
        </div>
      </div>
    </>
  );
}

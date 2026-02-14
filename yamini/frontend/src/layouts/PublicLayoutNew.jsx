import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import '../styles/public.css';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/products', label: 'Products', icon: '🖨' },
  { path: '/services', label: 'Service', icon: '🛠' },
  { path: '/track', label: 'Track', icon: '📍' },
  { path: '/contact', label: 'Contact', icon: '☎' },
];

const HEADER_NAV = [
  { path: '/', label: 'Home' },
  { path: '/products', label: 'Products' },
  { path: '/services', label: 'Services' },
  { path: '/about', label: 'About Us' },
  { path: '/contact', label: 'Contact' },
];

export default function PublicLayoutNew() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="pub">
      {/* ── HEADER ── */}
      <header className="pub-header">
        <div className="container">
          <Link to="/" className="pub-header-logo">
            <img src="/assets/main_logo.png" alt="Yamini Infotech" />
            <span>YAMINI INFOTECH</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="pub-header-nav">
            {HEADER_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={isActive(item.path) ? 'active' : ''}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/login" className="btn btn-primary btn-pill" style={{ marginLeft: 8 }}>
              Login
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="pub-header-actions">
            <button className="pub-header-menu" onClick={() => setMenuOpen(true)}>
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU OVERLAY ── */}
      <div className={`pub-mobile-menu ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className="pub-mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
          <button className="pub-mobile-menu-close" onClick={() => setMenuOpen(false)}>✕</button>
          {HEADER_NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={isActive(item.path) ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/login" onClick={() => setMenuOpen(false)} style={{ color: 'var(--brand)', fontWeight: 700 }}>
            Login →
          </Link>
        </div>
      </div>

      {/* ── PAGE CONTENT ── */}
      <main className="pub-page">
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer className="pub-footer">
        <div className="container">
          <div className="pub-footer-grid">
            <div>
              <img src="/assets/main_logo.png" alt="Yamini Infotech" style={{ height: 32, marginBottom: 12, filter: 'brightness(10)' }} />
              <p style={{ color: '#94a3b8', fontSize: 14 }}>Driving Business Through Technology</p>
            </div>
            <div>
              <h4>Information</h4>
              <Link to="/about">About Us</Link>
              <Link to="/products">Products</Link>
              <Link to="/services">Services</Link>
            </div>
            <div>
              <h4>Customer Service</h4>
              <a href="tel:+919842122952">📞 +91 98421 22952</a>
              <a href="tel:+919842504171">📞 +91 98425 04171</a>
              <a href="mailto:yaminiinfotechtvl@gmail.com">✉ yaminiinfotechtvl@gmail.com</a>
            </div>
            <div>
              <h4>Locations</h4>
              <a href="https://maps.app.goo.gl/SkFjxc5EnUjZc34L8" target="_blank" rel="noopener noreferrer">📍 Tirunelveli</a>
              <a href="https://maps.app.goo.gl/Td9rribid4CQKg6q6" target="_blank" rel="noopener noreferrer">📍 Tenkasi</a>
              <a href="https://maps.app.goo.gl/qdFhJTpKfeZ1pMzt7" target="_blank" rel="noopener noreferrer">📍 Nagercoil</a>
            </div>
          </div>
          <div className="pub-footer-bottom">
            YAMINI INFOTECH © {new Date().getFullYear()}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── BOTTOM NAV (Mobile) ── */}
      <nav className="pub-bottom-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={isActive(item.path) ? 'active' : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* ── FLOATING WHATSAPP ── */}
      <a
        href="https://wa.me/919842122952?text=Hi%20Yamini%20Infotech%2C%20I%20have%20an%20enquiry"
        target="_blank"
        rel="noopener noreferrer"
        className="pub-fab-whatsapp"
      >
        <span style={{ fontSize: 'inherit' }}>💬</span>
        <span className="fab-label">WhatsApp Enquiry</span>
      </a>
    </div>
  );
}

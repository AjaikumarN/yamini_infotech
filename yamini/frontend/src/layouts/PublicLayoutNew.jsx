import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDeviceProfile } from '../hooks/useDeviceProfile';
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
  const { type: deviceType } = useDeviceProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('yi_visited'));
  const [scrolled, setScrolled] = useState(false);
  const pubRef = useRef(null);

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Splash: show once per session
  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('yi_visited', '1');
    }, 1800);
    return () => clearTimeout(timer);
  }, [showSplash]);

  // Scroll-reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    const els = pubRef.current?.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    els?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [location.pathname]);

  // Scroll to top on route change
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  // Header scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="pub" ref={pubRef}>
      {/* ── SPLASH ── */}
      {showSplash && (
        <div className="pub-splash">
          <img className="splash-logo" src="/assets/main_logo.png" alt="Yamini Infotech" />
          <div className="splash-name">Yamini Infotech</div>
          <div className="splash-bar" />
        </div>
      )}

      {/* ── HEADER ── */}
      <header className={`pub-header${scrolled ? ' scrolled' : ''}`}>
        <div className="container">
          <Link to="/" className="pub-header-logo">
            <img src="/assets/main_logo.png" alt="Yamini Infotech" />
            <span>YAMINI INFOTECH</span>
          </Link>

          {/* Desktop / Hybrid top nav — shown via CSS [data-density="expanded"] */}
          <nav className="pub-header-nav">
            {HEADER_NAV.map((item) => (
              <Link key={item.path} to={item.path} className={isActive(item.path) ? 'active' : ''}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link to="/login" className="pub-header-login" style={{ display: deviceType === 'mobile' || deviceType === 'tablet' ? 'none' : 'inline-flex' }}>
            Login
          </Link>

          {/* Hamburger — hidden on expanded density */}
          <div className="pub-header-actions">
            <button className="pub-header-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* ── TABLET SIDE RAIL ── shown via CSS [data-device="tablet"] */}
      <nav className="pub-side-rail">
        {NAV_ITEMS.map((item) => (
          <Link key={item.path} to={item.path} className={isActive(item.path) ? 'active' : ''}>
            <span className="rail-icon">{item.icon}</span>
            <span className="rail-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* ── MOBILE MENU OVERLAY ── */}
      <div className={`pub-mobile-menu ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className="pub-mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
          <button className="pub-mobile-menu-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
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
      <footer className="pub-footer" itemScope itemType="https://schema.org/LocalBusiness">
        <div className="container">
          <div className="pub-footer-grid">
            <div>
              <img src="/assets/main_logo.png" alt="Yamini Infotech - Copier & Printer Sales Service Tirunelveli" itemProp="image" style={{ height: 56, width: 'auto', marginBottom: 12, objectFit: 'contain', borderRadius: 8, background: 'white', padding: 4 }} />
              <p itemProp="name" style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Yamini Infotech</p>
              <p itemProp="description" style={{ color: '#94a3b8', fontSize: 14 }}>Xerox Machine Sales & Service | Printers | Toner | AMC — Serving Tirunelveli, Tenkasi & Nagercoil since 1998</p>
            </div>
            <div>
              <h4>Information</h4>
              <Link to="/about">About Us</Link>
              <Link to="/products">Products</Link>
              <Link to="/services">Services</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/track">Track Service</Link>
            </div>
            <div>
              <h4>Customer Service</h4>
              <a href="tel:+919842122952" itemProp="telephone">📞 +91 98421 22952</a>
              <a href="tel:+919842504171">📞 +91 98425 04171</a>
              <a href="mailto:yaminiinfotechtvl@gmail.com" itemProp="email">✉ yaminiinfotechtvl@gmail.com</a>
            </div>
            <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
              <h4>Locations</h4>
              <Link to="/copier-service-tirunelveli">📍 <span itemProp="addressLocality">Tirunelveli</span></Link>
              <Link to="/printer-service-tenkasi">📍 Tenkasi</Link>
              <Link to="/copier-dealer-nagercoil">📍 Nagercoil</Link>
              <Link to="/xerox-machine-thoothukudi">📍 Thoothukudi</Link>
              <meta itemProp="addressRegion" content="Tamil Nadu" />
              <meta itemProp="addressCountry" content="IN" />
            </div>
          </div>

          {/* Services by Brand — SEO internal links */}
          <div style={{ borderTop: '1px solid rgba(148,163,184,0.15)', marginTop: 20, paddingTop: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {[
                { to: '/kyocera-copier-tirunelveli', label: 'Kyocera Copier Tirunelveli' },
                { to: '/canon-printer-tirunelveli', label: 'Canon Printer Tirunelveli' },
                { to: '/ricoh-copier-tirunelveli', label: 'Ricoh Copier Tirunelveli' },
                { to: '/printer-rental-tirunelveli', label: 'Printer Rental Tirunelveli' },
                { to: '/copier-amc-tirunelveli', label: 'Copier AMC Tirunelveli' },
                { to: '/photocopier-repair-tirunelveli', label: 'Photocopier Repair Tirunelveli' },
                { to: '/office-printer-for-school-tirunelveli', label: 'School Printer' },
                { to: '/a3-copier-machine-tirunelveli', label: 'A3 Copier Machine' },
                { to: '/color-photocopier-rental-tirunelveli', label: 'Color Copier Rental' },
                { to: '/printer-repair-near-me-tirunelveli', label: 'Printer Repair Near Me' },
                { to: '/kyocera-installation-school-tirunelveli', label: 'Case Study: School' },
                { to: '/printer-rental-for-hospital-tirunelveli', label: 'Case Study: Hospital' },
              ].map((link) => (
                <Link key={link.to} to={link.to} style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'none', padding: '3px 10px', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#60a5fa'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="pub-footer-bottom">
            YAMINI INFOTECH © {new Date().getFullYear()}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── BOTTOM NAV — shown via CSS on mobile only ── */}
      <nav className="pub-bottom-nav">
        {NAV_ITEMS.map((item) => (
          <Link key={item.path} to={item.path} className={isActive(item.path) ? 'active' : ''}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* ── FLOATING WHATSAPP FAB ── */}
      <a
        href="https://wa.me/919842122952?text=Hi%20Yamini%20Infotech%2C%20I%20have%20an%20enquiry"
        target="_blank"
        rel="noopener noreferrer"
        className="pub-fab-wa"
      >
        <span className="fab-icon">💬</span>
        <span className="fab-text">WhatsApp</span>
      </a>

      {/* ── STICKY CALL BAR (mobile) — Conversion SEO ── */}
      <div className="pub-sticky-call-bar">
        <a href="tel:+919842122952" className="sticky-call-btn">
          <span>📞</span> Call Now
        </a>
        <a href="https://wa.me/919842122952?text=Hi%20Yamini%20Infotech%2C%20I%20need%20a%20quote" target="_blank" rel="noopener noreferrer" className="sticky-wa-btn">
          <span>💬</span> WhatsApp
        </a>
      </div>
    </div>
  );
}

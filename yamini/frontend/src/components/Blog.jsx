import React, { useState } from 'react';
import './Blog.css';

export default function Blog() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="App">
      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Empowering Businesses with Reliable Office Automation & Security Solutions
              </h1>
              <p className="hero-subtitle">
                Sales & Service of Xerox Machines, Digital Copy Printers, and CCTV Systems in Tirunelveli & Nearby Regions
              </p>
              <div className="hero-locations">
                <span className="location-icon">📍</span>
                <span>Tirunelveli | Nagercoil | Tenkasi | Tuticorin</span>
              </div>
              <div className="hero-buttons">
                <a href="#contact" className="btn btn-primary">Get a Quote</a>
                <a href="tel:9042504173" className="btn btn-secondary">Call Now</a>
              </div>
            </div>
            <div className="hero-image">
              <img src="/images/hero-printer.jpg" alt="Konica Minolta bizhub C266i" />
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="who-we-are" id="about">
        <div className="container">
          <h2 className="section-title">Who We Are</h2>
          <div className="content-wrapper">
            <p className="intro-text">
              Welcome to <strong>Yamini Infotech</strong>, your trusted partner in office automation and security solutions based in Tirunelveli. With a strong commitment to quality, reliability, and customer satisfaction, we specialize in the sales and service of Xerox machines, digital copy printers, and CCTV systems, serving businesses, institutions, and organizations of all sizes.
            </p>
            <p>
              In today's fast-paced business environment, efficiency, productivity, and security are essential. At Yamini Infotech, we deliver advanced technology from industry-leading brands to help organizations streamline operations and protect their workplaces.
            </p>
            <p>
              Whether you require high-performance Xerox machines for bulk printing, professional digital copy printers, or advanced CCTV solutions for 24×7 surveillance, our expert team provides tailored solutions that meet your exact requirements.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-us">
        <div className="container">
          <h2 className="section-title">Why Choose Us</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">✓</div>
              <h3>Quality Products</h3>
              <p>Reliable, industry-approved machines from trusted brands</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Modern Technology</h3>
              <p>Latest office automation & security solutions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛠️</div>
              <h3>Customer Support</h3>
              <p>Prompt service & after-sales support</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Competitive Pricing</h3>
              <p>Cost-effective, value-driven solutions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Innovation Section */}
      <section className="innovation-section">
        <div className="container">
          <h2 className="section-title">Innovation in Every Solution</h2>
          <p className="section-subtitle">
            Enhance your business operations with top-quality Xerox machines, digital printers, and CCTV systems designed for performance, reliability, and efficiency.
          </p>
        </div>
      </section>

      {/* Solutions & Services Grid */}
      <section className="solutions-services" id="products">
        <div className="container">
          <h2 className="section-title">Solutions & Services</h2>
          <div className="solutions-grid">
            <div className="solution-card">
              <div className="solution-icon">🖨️</div>
              <h3>Xerox Machines</h3>
            </div>
            <div className="solution-card">
              <div className="solution-icon">🖨️</div>
              <h3>Digital Copy Printers</h3>
            </div>
            <div className="solution-card">
              <div className="solution-icon">📹</div>
              <h3>CCTV Cameras & Surveillance</h3>
            </div>
            <div className="solution-card">
              <div className="solution-icon">⚡</div>
              <h3>Panel Boards</h3>
            </div>
            <div className="solution-card">
              <div className="solution-icon">📽️</div>
              <h3>Interactive Projectors</h3>
            </div>
            <div className="solution-card">
              <div className="solution-icon">🎓</div>
              <h3>Smart Classroom Software</h3>
            </div>
            <div className="solution-card">
              <div className="solution-icon">💻</div>
              <h3>Desktop Computers</h3>
            </div>
            <div className="solution-card">
              <div className="solution-icon">📄</div>
              <h3>Lamination / Spiral Binding</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Konica Minolta Products Section */}
      <section className="products-section">
        <div className="container">
          <h2 className="section-title">Konica Minolta Product Range</h2>
          <p className="section-subtitle">Industry-leading multifunction printers for every business need</p>
          <div className="products-grid">
            <div className="product-card">
              <div className="product-image">
                <img src="/images/product-1.jpg" alt="bizhub 205i / 225i" />
              </div>
              <div className="product-info">
                <h3>bizhub 205i / 225i</h3>
                <p>A3 Digital Printer with 20-22 PPM, ideal for small to medium offices</p>
              </div>
            </div>
            <div className="product-card">
              <div className="product-image">
                <img src="/images/product-2.jpg" alt="bizhub 226i / 306i" />
              </div>
              <div className="product-info">
                <h3>bizhub 226i / 306i</h3>
                <p>Professional MFDs with network print, scan, and duplex capabilities</p>
              </div>
            </div>
            <div className="product-card">
              <div className="product-image">
                <img src="/images/product-3.jpg" alt="bizhub 287 / 367" />
              </div>
              <div className="product-info">
                <h3>bizhub 287 / 367</h3>
                <p>High-speed multifunction systems with advanced paper handling</p>
              </div>
            </div>
            <div className="product-card">
              <div className="product-image">
                <img src="/images/product-4.jpg" alt="bizhub C266i" />
              </div>
              <div className="product-info">
                <h3>bizhub C266i</h3>
                <p>Ultimate solution for high-quality, versatile color printing</p>
              </div>
            </div>
            <div className="product-card">
              <div className="product-image">
                <img src="/images/product-5.jpg" alt="bizhub C251i / C301i" />
              </div>
              <div className="product-info">
                <h3>bizhub C251i / C301i</h3>
                <p>Advanced color MFPs with touchscreen and mobile print support</p>
              </div>
            </div>
            <div className="product-card">
              <div className="product-image">
                <img src="/images/product-6.jpg" alt="bizhub 451i / 550i / 650i" />
              </div>
              <div className="product-info">
                <h3>bizhub 451i / 550i / 650i</h3>
                <p>High-volume production systems for demanding environments</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="blog-section" id="blog">
        <div className="container">
          <h2 className="section-title">Latest Insights & Resources</h2>
          <p className="section-subtitle">Expert guidance on office automation and printer technology</p>
          <div className="blog-grid">
            <article className="blog-card">
              <div className="blog-image">
                <img src="/images/blog-1.jpg" alt="Multicolor Printer Guide" />
              </div>
              <div className="blog-content">
                <h3>Complete Guide to Konica Minolta Multicolor Printers</h3>
                <p>Discover the features, benefits, and best use cases for bizhub color series printers in office and institutional environments.</p>
                <a href="#" className="read-more">Read More →</a>
              </div>
            </article>
            <article className="blog-card">
              <div className="blog-image">
                <img src="/images/blog-2.jpg" alt="Choosing the Right Printer" />
              </div>
              <div className="blog-content">
                <h3>Which Bizhub Model Is Best for Offices & Institutions?</h3>
                <p>Compare different bizhub models to find the perfect match for your printing volume, budget, and feature requirements.</p>
                <a href="#" className="read-more">Read More →</a>
              </div>
            </article>
            <article className="blog-card">
              <div className="blog-image">
                <img src="/images/blog-3.jpg" alt="EMI Options" />
              </div>
              <div className="blog-content">
                <h3>Printer EMI Options for Schools & Businesses</h3>
                <p>Learn about flexible financing options with Bajaj Finserv for affordable access to premium office equipment.</p>
                <a href="#" className="read-more">Read More →</a>
              </div>
            </article>
            <article className="blog-card">
              <div className="blog-image">
                <img src="/images/blog-4.jpg" alt="Genuine Service" />
              </div>
              <div className="blog-content">
                <h3>Why Genuine Printer Service Matters</h3>
                <p>Understanding the importance of authorized service, genuine parts, and regular maintenance for printer longevity.</p>
                <a href="#" className="read-more">Read More →</a>
              </div>
            </article>
            <article className="blog-card">
              <div className="blog-image">
                <img src="/images/blog-5.jpg" alt="Tirunelveli Showroom" />
              </div>
              <div className="blog-content">
                <h3>Inside Our Tirunelveli Printer Showroom</h3>
                <p>Take a virtual tour of our fully-stocked showroom with live demos, expert consultations, and immediate service support.</p>
                <a href="#" className="read-more">Read More →</a>
              </div>
            </article>
            <article className="blog-card">
              <div className="blog-image">
                <img src="/images/blog-6.jpg" alt="Office Solutions" />
              </div>
              <div className="blog-content">
                <h3>Comprehensive Office Automation Solutions</h3>
                <p>Explore our complete range of products including CCTV systems, projectors, and smart classroom technology.</p>
                <a href="#" className="read-more">Read More →</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Showroom Trust Section */}
      <section className="showroom-section">
        <div className="container">
          <div className="showroom-content">
            <div className="showroom-image">
              <img src="/images/showroom.jpg" alt="Yamini Infotech Tirunelveli Showroom" />
            </div>
            <div className="showroom-text">
              <h2>Visit Our Tirunelveli Showroom</h2>
              <p className="showroom-caption">
                Our Tirunelveli showroom with ready stock, live demos, and professional service support.
              </p>
              <p>
                Experience our products firsthand with free demonstrations, expert consultation, and immediate technical support. We maintain a comprehensive inventory of printers, toners, and spare parts for quick delivery and repairs.
              </p>
              <a href="#contact" className="btn btn-primary">Schedule a Visit</a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Statement */}
      <section className="trust-statement">
        <div className="container">
          <h2>Empowering Businesses with Reliable Sales & Service</h2>
          <p>
            We deliver trusted sales, genuine spare parts, and professional service support for Xerox machines, digital printers, and CCTV systems—ensuring secure and productive business operations.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="container">
          <h2 className="section-title">Contact Yamini Infotech</h2>
          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-item">
                <h3>📞 Call Us</h3>
                <p><a href="tel:9042504173">+91 90425 04173</a></p>
                <p><a href="tel:9842504171">+91 98425 04171</a></p>
              </div>
              <div className="contact-item">
                <h3>📧 Email</h3>
                <p><a href="mailto:yaminiinfotechtvl@gmail.com">yaminiinfotechtvl@gmail.com</a></p>
              </div>
              <div className="contact-item">
                <h3>👤 Contact Person</h3>
                <p>Mr. K. Rajaguru</p>
              </div>
            </div>
            <div className="locations-info">
              <div className="location-card">
                <h3>📍 Head Office – Tirunelveli</h3>
                <p>No. 24, Rajarajeshwari Nagar,</p>
                <p>Near New Bus Stand, Palayamkottai,</p>
                <p>Tirunelveli – 627007</p>
              </div>
              <div className="location-card">
                <h3>📍 Branch – Nagercoil</h3>
                <p>339, Rajakkamangalam Road,</p>
                <p>Chetti Kulam Junction,</p>
                <p>Nagercoil – 629001</p>
              </div>
            </div>
          </div>
          <div className="cta-buttons">
            <a href="tel:9042504173" className="btn btn-primary">Call for Service</a>
            <a href="#" className="btn btn-secondary">Book a Demo</a>
            <a href="mailto:yaminiinfotechtvl@gmail.com" className="btn btn-secondary">Request a Quote</a>
          </div>
        </div>
      </section>
    </div>
  );
}


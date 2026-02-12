import React from 'react'
import { Link } from 'react-router-dom'
import { FiFacebook, FiInstagram, FiMapPin } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <img src="/assets/main_logo.png" alt="Yamini Infotech" className="logo-icon small" />
          <div>
            <div className="company">YAMINI INFOTECH</div>
            <div className="tagline">Driving Business Through Technology</div>
          </div>
        </div>

        <div className="footer-columns">
          <div className="column">
            <h4>INFORMATION</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </div>
          <div className="column">
            <h4>CUSTOMER SERVICE</h4>
            <ul>
              <li><a href="tel:+919842122952">Mobile: +91 98421 22952</a></li>
              <li><a href="tel:+919842504171">Landline: +91 98425 04171</a></li>
              <li><a href="mailto:yaminiinfotechtvl@gmail.com">yaminiinfotechtvl@gmail.com</a></li>
            </ul>
          </div>
          <div className="column">
            <h4>LOCATION</h4>
            <ul>
              <li><a href="https://maps.app.goo.gl/SkFjxc5EnUjZc34L8" target="_blank" rel="noopener noreferrer"><FiMapPin /> Tirunelveli</a></li>
              <li><a href="https://maps.app.goo.gl/Td9rribid4CQKg6q6" target="_blank" rel="noopener noreferrer"><FiMapPin /> Tenkasi</a></li>
              <li><a href="https://maps.app.goo.gl/qdFhJTpKfeZ1pMzt7" target="_blank" rel="noopener noreferrer"><FiMapPin /> Nagercoil</a></li>
            </ul>
          </div>
          <div className="column">
            <h4>CONNECT</h4>
            <ul className="social">
              <li><a href="https://www.facebook.com/yaminiinfotech/" target="_blank" rel="noopener noreferrer"><FiFacebook /> Facebook</a></li>
              <li><a href="https://wa.me/919842122952" target="_blank" rel="noopener noreferrer"><FaWhatsapp /> WhatsApp</a></li>
              <li><a href="https://www.instagram.com/yamin_iinfotech?igsh=MWNvaW5yc3R2cnU3ZQ==" target="_blank" rel="noopener noreferrer"><FiInstagram /> Instagram</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <small>YAMINI INFOTECH © 2025.  SOLUTION.</small>
      </div>
    </footer>
  )
}

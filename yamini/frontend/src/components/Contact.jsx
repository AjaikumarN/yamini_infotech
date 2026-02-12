import React from 'react'
import { FiMapPin, FiPhone, FiMail } from 'react-icons/fi'

export default function Contact() {
  const branches = [
    {
      name: 'Tirunelveli Branch',
      address: 'Raja Rajeshwari Nagar, No: 25, opp. ARR Royal Park Hotel, near New Bus Stand, Tirunelveli, Tamil Nadu 627007',
      phone: '+91 98421 22952',
      email: 'yaminiinfotechtvl@gmail.com',
      mapLink: 'https://maps.app.goo.gl/SkFjxc5EnUjZc34L8'
    },
    {
      name: 'Tenkasi Branch',
      address: '128/C3, Tirunelveli Rd, periya street, Ainthuvarna, Tenkasi, Tamil Nadu 627811',
      phone: '+91 98421 22952',
      email: 'yaminiinfotechtvl@gmail.com',
      mapLink: 'https://maps.app.goo.gl/Td9rribid4CQKg6q6'
    },
    {
      name: 'Nagercoil Branch',
      address: '339, Rajakkamangalam Road, Chetti Kulam, Junction, Nagercoil, Tamil Nadu 629001',
      phone: '+91 98421 22952',
      email: 'yaminiinfotechtvl@gmail.com',
      mapLink: 'https://maps.app.goo.gl/qdFhJTpKfeZ1pMzt7'
    }
  ]

  return (
    <div className="contact-page">
      <div className="contact-container">
        <h1 className="page-title">Our Branches</h1>
        <div className="branches-grid">
          {branches.map((branch, index) => (
            <div key={index} className="branch-card">
              <h3 className="branch-name">
                <FiMapPin className="branch-icon" /> {branch.name}
              </h3>
              <div className="branch-details">
                <div className="detail-item">
                  <FiMapPin className="detail-icon" />
                  <a href={branch.mapLink} target="_blank" rel="noopener noreferrer" className="detail-text">
                    {branch.address}
                  </a>
                </div>
                <div className="detail-item">
                  <FiPhone className="detail-icon" />
                  <a href={`tel:${branch.phone}`} className="detail-text">{branch.phone}</a>
                </div>
                <div className="detail-item">
                  <FiMail className="detail-icon" />
                  <a href={`mailto:${branch.email}`} className="detail-text">{branch.email}</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

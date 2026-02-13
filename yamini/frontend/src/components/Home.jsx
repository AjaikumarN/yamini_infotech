import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../utils/api'
import ChatWidget from './ChatWidget'

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const data = await apiRequest('/api/products')
      // Show first 6 products as featured
      setFeaturedProducts(data.slice(0, 6))
      setLoading(false)
    } catch (error) {
      console.error('Error fetching products:', error)
      setLoading(false)
    }
  }

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`)
  }

  const handleViewAll = () => {
    navigate('/products')
  }

  return (
    <main className="content">
      <section className="hero">
        <h1>YAMINI INFOTECH</h1>
        <p>Driving Business Through Technology</p>
      </section>

      <section style={styles.featuredSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Featured Products</h2>
          <button onClick={handleViewAll} style={styles.viewAllBtn}>
            View All Products →
          </button>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading products...</div>
        ) : (
          <div style={styles.productsGrid}>
            {featuredProducts.map(product => (
              <div 
                key={product.id} 
                style={styles.productCard}
                onClick={() => handleProductClick(product.id)}
              >
                <div style={styles.imageContainer}>
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      style={styles.productImage}
                      onError={(e) => {
                        e.target.src = '/assets/placeholder.png'
                      }}
                    />
                  ) : (
                    <div style={styles.placeholderImage}>
                      <span style={styles.placeholderText}>No Image</span>
                    </div>
                  )}
                </div>
                <div style={styles.productInfo}>
                  <h3 style={styles.productName}>{product.name}</h3>
                  <p style={styles.productCategory}>{product.category}</p>
                  <p style={styles.productPrice}>₹{product.price.toLocaleString()}</p>
                  <button style={styles.viewDetailsBtn}>View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ChatWidget />
    </main>
  )
}

const styles = {
  featuredSection: {
    padding: '40px 20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  viewAllBtn: {
    padding: '12px 24px',
    backgroundColor: '#00bcd4',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '30px',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
  },
  imageContainer: {
    width: '100%',
    height: '250px',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
  },
  placeholderText: {
    color: '#999',
    fontSize: '14px',
  },
  productInfo: {
    padding: '20px',
  },
  productName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '8px',
  },
  productCategory: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginBottom: '12px',
  },
  productPrice: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#00bcd4',
    marginBottom: '16px',
  },
  viewDetailsBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#2c3e50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
}

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChatWidget from '../components/ChatWidget';

/**
 * PUBLIC LAYOUT
 * For public-facing pages: Home, Products, Contact, About, Blog, Login
 * Includes: Global Header + Page Content + Footer + ChatWidget
 */
export default function PublicLayout({ showNotificationPanel, setShowNotificationPanel }) {
  return (
    <div className="app public-layout">
      <Header 
        showNotificationPanel={showNotificationPanel}
        setShowNotificationPanel={setShowNotificationPanel}
      />
      
      <main className="content">
        <Outlet />
      </main>

      <ChatWidget />
      <Footer />

      <style>{`
        .app.public-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app.public-layout .content {
          flex: 1;
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import '../styles/salesman.css';

/**
 * ToastNotification - Real-time toast messages
 * Usage: showToast('Success!', 'success')
 */

let toastCallback = null;

export const showToast = (message, type = 'info', duration = 3000) => {
  if (toastCallback) {
    toastCallback({ message, type, duration });
  }
};

export default function ToastNotification() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastCallback = ({ message, type, duration }) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    };

    return () => {
      toastCallback = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'warning' && '⚠️'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

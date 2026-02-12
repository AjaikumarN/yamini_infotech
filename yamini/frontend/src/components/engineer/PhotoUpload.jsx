import React, { useState } from 'react';

export default function PhotoUpload({ onPhotoCapture, label = "Upload Photo" }) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    onPhotoCapture(file);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <label style={{
        fontSize: '14px',
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </label>
      
      <input
        type="file"
        accept="image/*"
        capture="environment"  // Opens camera on mobile
        onChange={handleFileChange}
        style={{
          padding: '12px',
          borderRadius: '8px',
          border: '2px solid #e2e8f0',
          fontSize: '14px',
          background: 'white',
          cursor: 'pointer'
        }}
      />

      {preview && (
        <div style={{
          marginTop: '12px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '300px',
              objectFit: 'contain',
              display: 'block'
            }}
          />
          <div style={{
            padding: '8px',
            background: '#f1f5f9',
            fontSize: '12px',
            color: '#64748b',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            ✅ Photo ready to upload
          </div>
        </div>
      )}
    </div>
  );
}

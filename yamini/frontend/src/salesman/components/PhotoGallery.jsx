import React, { useState } from 'react';
import '../styles/salesman.css';

/**
 * PhotoGallery - Before/After photos for site visits
 * Supports multiple photos with captions
 */
export default function PhotoGallery({ photos = [], onAddPhoto, onDeletePhoto }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [captureMode, setCaptureMode] = useState(false);

  const handlePhotoCapture = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhoto = {
          id: Date.now(),
          url: reader.result,
          timestamp: new Date().toISOString(),
          caption: '',
        };
        onAddPhoto && onAddPhoto(newPhoto);
        setCaptureMode(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="photo-gallery">
      {/* Header */}
      <div className="gallery-header">
        <h4 className="section-title">📸 Site Visit Photos</h4>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setCaptureMode(true)}
        >
          + Add Photo
        </button>
      </div>

      {/* Capture Mode */}
      {captureMode && (
        <div className="photo-capture-card">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="form-control"
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setCaptureMode(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length === 0 && !captureMode && (
        <div className="empty-state">
          <div className="empty-state-icon">📷</div>
          <div className="empty-state-message">
            No photos yet. Add photos from site visits.
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="photo-card">
              <img
                src={photo.url}
                alt={photo.caption || 'Site photo'}
                className="photo-thumbnail"
                onClick={() => setSelectedPhoto(photo)}
              />
              <div className="photo-info">
                <div className="photo-caption">{photo.caption || 'No caption'}</div>
                <div className="photo-timestamp">
                  {new Date(photo.timestamp).toLocaleString()}
                </div>
              </div>
              {onDeletePhoto && (
                <button
                  className="photo-delete"
                  onClick={() => onDeletePhoto(photo.id)}
                  title="Delete photo"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="photo-lightbox" onClick={() => setSelectedPhoto(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close"
              onClick={() => setSelectedPhoto(null)}
            >
              ✕
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption}
              className="lightbox-image"
            />
            <div className="lightbox-caption">
              <p>{selectedPhoto.caption || 'No caption'}</p>
              <small>{new Date(selectedPhoto.timestamp).toLocaleString()}</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

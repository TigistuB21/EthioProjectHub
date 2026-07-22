'use client';

import { useState } from 'react';
import styles from './PdfViewer.module.css';

interface PdfViewerProps {
  pdfUrl: string;
  title: string;
}

export default function PdfViewer({ pdfUrl, title }: PdfViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 200));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  };

  const resetZoom = () => {
    setZoomLevel(100);
  };

  const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;

  // Append hash parameters for zoom level if browser supports native PDF viewer params
  const pdfSource = `${pdfUrl}#zoom=${zoomLevel}`;

  return (
    <div className={`${styles.viewerContainer} ${isFullscreen ? styles.fullscreen : ''}`}>
      {/* Toolbar Controls */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span style={{ fontSize: '1.2rem' }}>📄</span>
          <span className={styles.documentTitle} title={title}>
            {title}
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            onClick={zoomOut}
            className={styles.toolBtn}
            title="Zoom Out"
            disabled={zoomLevel <= 50}
          >
            ➖
          </button>
          <span className={styles.zoomIndicator} onClick={resetZoom} style={{ cursor: 'pointer' }} title="Reset Zoom">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            className={styles.toolBtn}
            title="Zoom In"
            disabled={zoomLevel >= 200}
          >
            ➕
          </button>

          <div style={{ width: '1px', height: '20px', backgroundColor: 'hsl(var(--border))', margin: '0 0.25rem' }} />

          <button
            type="button"
            onClick={toggleFullscreen}
            className={styles.toolBtn}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '📉 Exit Fullscreen' : '📺 Fullscreen'}
          </button>

          <a
            href={pdfUrl}
            download={filename}
            className={`${styles.toolBtn} btn-primary`}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
          >
            📥 Download
          </a>
        </div>
      </div>

      {/* Main Viewport */}
      <div className={styles.iframeWrapper}>
        <object
          data={pdfSource}
          type="application/pdf"
          className={styles.pdfObject}
        >
          <div className={styles.pdfFallback}>
            <span className={styles.pdfFallbackIcon}>📂</span>
            <h3 className={styles.pdfFallbackTitle}>PDF Viewer Not Supported</h3>
            <p className={styles.pdfFallbackText}>
              Your browser doesn&apos;t support direct PDF embedding. Click below to download and view the document.
            </p>
            <a href={pdfUrl} download={filename} className="btn btn-primary">
              📥 Download PDF
            </a>
          </div>
        </object>
      </div>
    </div>
  );
}

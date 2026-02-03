/**
 * LatticeControls Component
 *
 * Zoom and navigation controls for the visualization.
 */

import React from 'react';
import type { LatticeControlsProps } from './types.js';

/**
 * LatticeControls component
 *
 * Renders zoom and navigation buttons.
 */
export function LatticeControls({
  scale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToView,
  onDownload,
}: LatticeControlsProps): JSX.Element {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 10,
    right: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 4,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  const buttonStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    border: '1px solid #ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: '#333',
    transition: 'background-color 0.2s',
  };

  const scaleStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    padding: '4px 0',
    fontFamily: "'Fira Code', monospace",
  };

  return (
    <div style={containerStyle}>
      <button
        style={buttonStyle}
        onClick={onZoomIn}
        title="Zoom In"
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
      >
        +
      </button>

      <div style={scaleStyle}>{(scale * 100).toFixed(0)}%</div>

      <button
        style={buttonStyle}
        onClick={onZoomOut}
        title="Zoom Out"
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
      >
        −
      </button>

      <div style={{ height: 8 }} />

      <button
        style={buttonStyle}
        onClick={onZoomReset}
        title="Reset Zoom"
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
      >
        ↺
      </button>

      <button
        style={buttonStyle}
        onClick={onFitToView}
        title="Fit to View"
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
      >
        ⊡
      </button>

      {onDownload && (
        <button
          style={buttonStyle}
          onClick={onDownload}
          title="Download Image"
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
        >
          ⬇
        </button>
      )}
    </div>
  );
}

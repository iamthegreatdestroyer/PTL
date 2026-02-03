/**
 * TypeTooltip Component
 *
 * Tooltip showing type details on hover.
 */

import React from 'react';
import type { TypeTooltipProps } from './types.js';
import { ConfidenceBar } from './ConfidenceBar.js';

/**
 * TypeTooltip component
 *
 * Renders a floating tooltip with type information.
 */
export function TypeTooltip({ node, x, y, visible }: TypeTooltipProps): JSX.Element | null {
  if (!visible) return null;

  // Position tooltip to avoid edge overflow
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: x + 10,
    top: y + 10,
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: 8,
    padding: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    minWidth: 200,
    maxWidth: 300,
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#333',
    marginBottom: 4,
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: "'Fira Code', monospace",
    color: '#666',
    marginBottom: 8,
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    marginRight: 4,
    marginBottom: 4,
  };

  return (
    <div style={tooltipStyle}>
      {/* Type name */}
      <div style={{ ...valueStyle, fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
        {node.label}
      </div>

      {/* Badges */}
      <div style={{ marginBottom: 8 }}>
        {node.isInferred && (
          <span style={{ ...badgeStyle, backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
            Inferred
          </span>
        )}
        {node.isAlternative && (
          <span style={{ ...badgeStyle, backgroundColor: '#FFF8E1', color: '#F57F17' }}>
            Alternative
          </span>
        )}
        <span style={{ ...badgeStyle, backgroundColor: '#E3F2FD', color: '#1565C0' }}>
          Depth: {node.depth}
        </span>
      </div>

      {/* Confidence */}
      <div style={labelStyle}>Confidence</div>
      <ConfidenceBar
        confidence={node.confidence}
        interval={node.confidenceInterval}
        width={180}
        height={12}
      />

      {/* Parents */}
      {node.parents.length > 0 && (
        <>
          <div style={{ ...labelStyle, marginTop: 8 }}>Supertypes</div>
          <div style={valueStyle}>{node.parents.join(', ')}</div>
        </>
      )}

      {/* Children */}
      {node.children.length > 0 && (
        <>
          <div style={labelStyle}>Subtypes</div>
          <div style={valueStyle}>{node.children.join(', ')}</div>
        </>
      )}
    </div>
  );
}

/**
 * TypeNode Component
 *
 * Renders a single type node in the lattice.
 */

import type { TypeNodeProps } from './types.js';
import { getContrastColor } from '../utils/colors.js';

/**
 * TypeNode component
 *
 * Renders a circle with the type name and visual indicators.
 */
export function TypeNode({
  node,
  radius,
  isSelected,
  isHighlighted,
  color,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: TypeNodeProps): JSX.Element {
  const strokeColor = isSelected ? '#1976D2' : isHighlighted ? '#42A5F5' : '#888';
  const strokeWidth = isSelected ? 3 : isHighlighted ? 2 : 1;
  const textColor = getContrastColor(color);

  // Truncate label if too long
  const maxChars = Math.floor(radius / 4);
  const displayLabel =
    node.label.length > maxChars ? node.label.slice(0, maxChars - 1) + '…' : node.label;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer glow for inferred type */}
      {node.isInferred && (
        <circle
          r={radius + 4}
          fill="none"
          stroke="#4CAF50"
          strokeWidth={2}
          strokeDasharray="4,2"
          opacity={0.6}
        />
      )}

      {/* Main circle */}
      <circle r={radius} fill={color} stroke={strokeColor} strokeWidth={strokeWidth} />

      {/* Confidence ring */}
      {node.confidence < 1 && (
        <circle
          r={radius - 4}
          fill="none"
          stroke={textColor}
          strokeWidth={2}
          strokeDasharray={`${node.confidence * Math.PI * 2 * (radius - 4)} ${
            (1 - node.confidence) * Math.PI * 2 * (radius - 4)
          }`}
          strokeDashoffset={(Math.PI * (radius - 4)) / 2}
          opacity={0.3}
        />
      )}

      {/* Type label */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
        fontSize={Math.min(14, radius / 2)}
        fontFamily="'Fira Code', monospace"
        fontWeight={node.isInferred ? 'bold' : 'normal'}
      >
        {displayLabel}
      </text>

      {/* Alternative indicator */}
      {node.isAlternative && (
        <circle
          cx={radius * 0.7}
          cy={-radius * 0.7}
          r={6}
          fill="#FFC107"
          stroke="#FFF"
          strokeWidth={1}
        />
      )}
    </g>
  );
}

/**
 * ConfidenceBar Component
 *
 * Displays a confidence value with interval.
 */

import type { ConfidenceBarProps } from './types.js';
import { confidenceToColor } from '../utils/colors.js';

/**
 * ConfidenceBar component
 *
 * Renders a horizontal bar showing confidence level with interval.
 */
export function ConfidenceBar({
  confidence,
  interval,
  width,
  height,
  showValue = true,
}: ConfidenceBarProps): JSX.Element {
  const [lower, upper] = interval;
  const barWidth = confidence * width;
  const intervalStart = lower * width;
  const intervalEnd = upper * width;
  const intervalWidth = intervalEnd - intervalStart;

  return (
    <svg width={width} height={height + (showValue ? 16 : 0)}>
      {/* Background */}
      <rect x={0} y={0} width={width} height={height} fill="#E0E0E0" rx={height / 2} />

      {/* Confidence interval range */}
      <rect
        x={intervalStart}
        y={0}
        width={intervalWidth}
        height={height}
        fill="#BBDEFB"
        rx={height / 2}
      />

      {/* Confidence value */}
      <rect
        x={0}
        y={0}
        width={barWidth}
        height={height}
        fill={confidenceToColor(confidence)}
        rx={height / 2}
      />

      {/* Interval markers */}
      <line
        x1={intervalStart}
        y1={0}
        x2={intervalStart}
        y2={height}
        stroke="#1976D2"
        strokeWidth={2}
      />
      <line x1={intervalEnd} y1={0} x2={intervalEnd} y2={height} stroke="#1976D2" strokeWidth={2} />

      {/* Value text */}
      {showValue && (
        <text
          x={width / 2}
          y={height + 12}
          textAnchor="middle"
          fill="#666"
          fontSize={10}
          fontFamily="'Fira Code', monospace"
        >
          {(confidence * 100).toFixed(1)}% [{(lower * 100).toFixed(0)}%-
          {(upper * 100).toFixed(0)}%]
        </text>
      )}
    </svg>
  );
}

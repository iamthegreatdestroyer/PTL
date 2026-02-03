/**
 * Component Types
 *
 * Props types for React components.
 */

import type { VisualizationData, VisualizationConfig, VisualizationNode } from '../types.js';

/**
 * Props for LatticeVisualization component
 */
export interface LatticeVisualizationProps {
  /**
   * Visualization data
   */
  readonly data: VisualizationData;

  /**
   * Configuration options
   */
  readonly config?: Partial<VisualizationConfig>;

  /**
   * Class name for the root element
   */
  readonly className?: string;

  /**
   * Callback when a node is selected
   */
  readonly onNodeSelect?: (node: VisualizationNode | null) => void;

  /**
   * Callback when a node is hovered
   */
  readonly onNodeHover?: (node: VisualizationNode | null) => void;

  /**
   * Callback when zoom changes
   */
  readonly onZoomChange?: (scale: number) => void;
}

/**
 * Props for TypeNode component
 */
export interface TypeNodeProps {
  /**
   * Node data
   */
  readonly node: VisualizationNode;

  /**
   * Node radius
   */
  readonly radius: number;

  /**
   * Is this node selected
   */
  readonly isSelected: boolean;

  /**
   * Is this node highlighted
   */
  readonly isHighlighted: boolean;

  /**
   * Fill color
   */
  readonly color: string;

  /**
   * Click handler
   */
  readonly onClick?: () => void;

  /**
   * Mouse enter handler
   */
  readonly onMouseEnter?: () => void;

  /**
   * Mouse leave handler
   */
  readonly onMouseLeave?: () => void;
}

/**
 * Props for ConfidenceBar component
 */
export interface ConfidenceBarProps {
  /**
   * Confidence value (0-1)
   */
  readonly confidence: number;

  /**
   * Confidence interval [lower, upper]
   */
  readonly interval: readonly [number, number];

  /**
   * Width of the bar
   */
  readonly width: number;

  /**
   * Height of the bar
   */
  readonly height: number;

  /**
   * Show numeric value
   */
  readonly showValue?: boolean;
}

/**
 * Props for TypeTooltip component
 */
export interface TypeTooltipProps {
  /**
   * Node to show tooltip for
   */
  readonly node: VisualizationNode;

  /**
   * X position
   */
  readonly x: number;

  /**
   * Y position
   */
  readonly y: number;

  /**
   * Is tooltip visible
   */
  readonly visible: boolean;
}

/**
 * Props for LatticeControls component
 */
export interface LatticeControlsProps {
  /**
   * Current zoom scale
   */
  readonly scale: number;

  /**
   * Zoom in handler
   */
  readonly onZoomIn: () => void;

  /**
   * Zoom out handler
   */
  readonly onZoomOut: () => void;

  /**
   * Reset zoom handler
   */
  readonly onZoomReset: () => void;

  /**
   * Fit to view handler
   */
  readonly onFitToView: () => void;

  /**
   * Download image handler
   */
  readonly onDownload?: () => void;
}

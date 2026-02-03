/**
 * @ptl/lattice-visualizer
 *
 * React components for visualizing PTL type lattices.
 *
 * Features:
 * - Interactive D3-based lattice visualization
 * - Confidence interval display with color coding
 * - Pan and zoom navigation
 * - Type node selection and highlighting
 * - Hierarchical layout with relationship lines
 *
 * @packageDocumentation
 */

export { LatticeVisualization } from './components/LatticeVisualization.js';
export { TypeNode } from './components/TypeNode.js';
export { ConfidenceBar } from './components/ConfidenceBar.js';
export { TypeTooltip } from './components/TypeTooltip.js';
export { LatticeControls } from './components/LatticeControls.js';

export type {
  LatticeVisualizationProps,
  TypeNodeProps,
  ConfidenceBarProps,
  TypeTooltipProps,
  LatticeControlsProps,
} from './components/types.js';

export type {
  VisualizationNode,
  VisualizationEdge,
  VisualizationData,
  VisualizationConfig,
  LayoutAlgorithm,
  ColorScheme,
} from './types.js';

export { createVisualizationData, layoutLattice, computeEdges } from './utils/layout.js';

export { confidenceToColor, typeToColor, getContrastColor } from './utils/colors.js';

/**
 * Visualization Types
 *
 * Type definitions for lattice visualization.
 */

/**
 * A node in the visualization
 */
export interface VisualizationNode {
  /**
   * Unique identifier
   */
  readonly id: string;

  /**
   * Type name to display
   */
  readonly label: string;

  /**
   * X coordinate (set by layout)
   */
  x: number;

  /**
   * Y coordinate (set by layout)
   */
  y: number;

  /**
   * Confidence value (0-1)
   */
  readonly confidence: number;

  /**
   * Confidence interval [lower, upper]
   */
  readonly confidenceInterval: readonly [number, number];

  /**
   * Is this the inferred type
   */
  readonly isInferred: boolean;

  /**
   * Is this an alternative type
   */
  readonly isAlternative: boolean;

  /**
   * Depth in the lattice (0 = top)
   */
  readonly depth: number;

  /**
   * Parent node IDs
   */
  readonly parents: readonly string[];

  /**
   * Child node IDs
   */
  readonly children: readonly string[];

  /**
   * Additional metadata
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * An edge in the visualization
 */
export interface VisualizationEdge {
  /**
   * Unique identifier
   */
  readonly id: string;

  /**
   * Source node ID
   */
  readonly source: string;

  /**
   * Target node ID
   */
  readonly target: string;

  /**
   * Edge type
   */
  readonly type: 'subtype' | 'supertype' | 'meet' | 'join';

  /**
   * Edge weight (for styling)
   */
  readonly weight: number;
}

/**
 * Complete visualization data
 */
export interface VisualizationData {
  /**
   * All nodes
   */
  readonly nodes: readonly VisualizationNode[];

  /**
   * All edges
   */
  readonly edges: readonly VisualizationEdge[];

  /**
   * Root node ID (top of lattice)
   */
  readonly rootId: string;

  /**
   * Bottom node ID (⊥)
   */
  readonly bottomId: string;
}

/**
 * Visualization configuration
 */
export interface VisualizationConfig {
  /**
   * Width of the visualization
   * @default 800
   */
  readonly width: number;

  /**
   * Height of the visualization
   * @default 600
   */
  readonly height: number;

  /**
   * Layout algorithm to use
   * @default 'hierarchical'
   */
  readonly layout: LayoutAlgorithm;

  /**
   * Color scheme for nodes
   * @default 'confidence'
   */
  readonly colorScheme: ColorScheme;

  /**
   * Node size (radius)
   * @default 30
   */
  readonly nodeSize: number;

  /**
   * Spacing between levels
   * @default 80
   */
  readonly levelSpacing: number;

  /**
   * Spacing between siblings
   * @default 60
   */
  readonly siblingSpacing: number;

  /**
   * Enable pan and zoom
   * @default true
   */
  readonly enableZoom: boolean;

  /**
   * Show confidence intervals
   * @default true
   */
  readonly showConfidenceIntervals: boolean;

  /**
   * Show edge labels
   * @default false
   */
  readonly showEdgeLabels: boolean;

  /**
   * Animation duration (ms)
   * @default 300
   */
  readonly animationDuration: number;
}

/**
 * Layout algorithm options
 */
export type LayoutAlgorithm = 'hierarchical' | 'force' | 'radial' | 'tree';

/**
 * Color scheme options
 */
export type ColorScheme = 'confidence' | 'category' | 'depth' | 'mono';

/**
 * Selection state
 */
export interface SelectionState {
  /**
   * Selected node ID
   */
  readonly selectedId: string | null;

  /**
   * Highlighted node IDs
   */
  readonly highlightedIds: ReadonlySet<string>;

  /**
   * Hovered node ID
   */
  readonly hoveredId: string | null;
}

/**
 * Zoom state
 */
export interface ZoomState {
  /**
   * Zoom level (1 = 100%)
   */
  readonly scale: number;

  /**
   * X translation
   */
  readonly translateX: number;

  /**
   * Y translation
   */
  readonly translateY: number;
}

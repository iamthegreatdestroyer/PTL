/**
 * LatticeVisualization Component
 *
 * Main visualization component for type lattices.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { zoom as d3zoom, type ZoomBehavior, type D3ZoomEvent } from 'd3-zoom';

import type { LatticeVisualizationProps } from './types.js';
import type {
  VisualizationConfig,
  VisualizationNode,
  SelectionState,
  ZoomState,
} from '../types.js';
import { TypeNode } from './TypeNode.js';
import { TypeTooltip } from './TypeTooltip.js';
import { LatticeControls } from './LatticeControls.js';
import { layoutLattice, computeEdges } from '../utils/layout.js';
import { confidenceToColor } from '../utils/colors.js';

/**
 * Default visualization configuration
 */
const DEFAULT_CONFIG: VisualizationConfig = {
  width: 800,
  height: 600,
  layout: 'hierarchical',
  colorScheme: 'confidence',
  nodeSize: 30,
  levelSpacing: 80,
  siblingSpacing: 60,
  enableZoom: true,
  showConfidenceIntervals: true,
  showEdgeLabels: false,
  animationDuration: 300,
};

/**
 * LatticeVisualization component
 *
 * Renders an interactive D3-based visualization of a type lattice.
 */
export function LatticeVisualization({
  data,
  config: partialConfig,
  className,
  onNodeSelect,
  onNodeHover,
  onZoomChange,
}: LatticeVisualizationProps): JSX.Element {
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...partialConfig }), [partialConfig]);

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  // State
  const [selection, setSelection] = useState<SelectionState>({
    selectedId: null,
    highlightedIds: new Set(),
    hoveredId: null,
  });

  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  const [tooltipNode, setTooltipNode] = useState<VisualizationNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Compute layout
  const layoutedNodes = useMemo(() => layoutLattice(data.nodes, config), [data.nodes, config]);

  const edges = useMemo(() => computeEdges(layoutedNodes, data.edges), [layoutedNodes, data.edges]);

  // D3 zoom behavior
  const zoomBehavior = useRef<ZoomBehavior<SVGSVGElement, unknown>>();

  useEffect(() => {
    if (!svgRef.current || !gRef.current || !config.enableZoom) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    zoomBehavior.current = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        const { transform } = event;
        g.attr('transform', transform.toString());
        setZoomState({
          scale: transform.k,
          translateX: transform.x,
          translateY: transform.y,
        });
        onZoomChange?.(transform.k);
      });

    svg.call(zoomBehavior.current);

    // Center initially
    const initialX = config.width / 2;
    const initialY = 50;
    svg.call(zoomBehavior.current.transform, d3.zoomIdentity.translate(initialX, initialY));

    return () => {
      svg.on('.zoom', null);
    };
  }, [config.enableZoom, config.width, onZoomChange]);

  // Handlers
  const handleNodeClick = useCallback(
    (node: VisualizationNode) => {
      const newSelectedId = selection.selectedId === node.id ? null : node.id;

      // Highlight related nodes
      const highlighted = new Set<string>();
      if (newSelectedId) {
        highlighted.add(newSelectedId);
        node.parents.forEach((p) => highlighted.add(p));
        node.children.forEach((c) => highlighted.add(c));
      }

      setSelection({
        ...selection,
        selectedId: newSelectedId,
        highlightedIds: highlighted,
      });

      onNodeSelect?.(newSelectedId ? node : null);
    },
    [selection, onNodeSelect]
  );

  const handleNodeMouseEnter = useCallback(
    (node: VisualizationNode, event: React.MouseEvent) => {
      setSelection((s) => ({ ...s, hoveredId: node.id }));
      setTooltipNode(node);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
      onNodeHover?.(node);
    },
    [onNodeHover]
  );

  const handleNodeMouseLeave = useCallback(
    (_event: React.MouseEvent<SVGGElement>) => {
      setSelection((s) => ({ ...s, hoveredId: null }));
      setTooltipNode(null);
      onNodeHover?.(null);
    },
    [onNodeHover]
  );

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehavior.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(config.animationDuration)
      .call(zoomBehavior.current.scaleBy, 1.3);
  }, [config.animationDuration]);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehavior.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(config.animationDuration)
      .call(zoomBehavior.current.scaleBy, 0.7);
  }, [config.animationDuration]);

  const handleZoomReset = useCallback(() => {
    if (!svgRef.current || !zoomBehavior.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(config.animationDuration)
      .call(zoomBehavior.current.transform, d3.zoomIdentity.translate(config.width / 2, 50));
  }, [config.animationDuration, config.width]);

  const handleFitToView = useCallback(() => {
    if (!svgRef.current || !zoomBehavior.current || layoutedNodes.length === 0) return;

    // Calculate bounds
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (const node of layoutedNodes) {
      minX = Math.min(minX, node.x - config.nodeSize);
      maxX = Math.max(maxX, node.x + config.nodeSize);
      minY = Math.min(minY, node.y - config.nodeSize);
      maxY = Math.max(maxY, node.y + config.nodeSize);
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const scale = Math.min((config.width - 40) / width, (config.height - 40) / height, 2);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    d3.select(svgRef.current)
      .transition()
      .duration(config.animationDuration)
      .call(
        zoomBehavior.current.transform,
        d3.zoomIdentity
          .translate(config.width / 2, config.height / 2)
          .scale(scale)
          .translate(-centerX, -centerY)
      );
  }, [layoutedNodes, config]);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        width={config.width}
        height={config.height}
        style={{ background: '#fafafa', border: '1px solid #e0e0e0' }}
      >
        <defs>
          {/* Arrowhead marker */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
          </marker>
        </defs>

        <g ref={gRef}>
          {/* Edges */}
          {edges.map((edge) => {
            const source = layoutedNodes.find((n) => n.id === edge.source);
            const target = layoutedNodes.find((n) => n.id === edge.target);
            if (!source || !target) return null;

            const isHighlighted =
              selection.highlightedIds.has(edge.source) &&
              selection.highlightedIds.has(edge.target);

            return (
              <line
                key={edge.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={isHighlighted ? '#2196F3' : '#ccc'}
                strokeWidth={isHighlighted ? 2 : 1}
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Nodes */}
          {layoutedNodes.map((node) => (
            <TypeNode
              key={node.id}
              node={node}
              radius={config.nodeSize}
              isSelected={selection.selectedId === node.id}
              isHighlighted={selection.highlightedIds.has(node.id)}
              color={confidenceToColor(node.confidence)}
              onClick={() => handleNodeClick(node)}
              onMouseEnter={(e: React.MouseEvent) => handleNodeMouseEnter(node, e)}
              onMouseLeave={handleNodeMouseLeave}
            />
          ))}
        </g>
      </svg>

      {/* Controls */}
      <LatticeControls
        scale={zoomState.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onFitToView={handleFitToView}
      />

      {/* Tooltip */}
      {tooltipNode && (
        <TypeTooltip
          node={tooltipNode}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
          visible={true}
        />
      )}
    </div>
  );
}

/**
 * Layout Utilities
 *
 * Functions for computing lattice layout.
 */

import type {
  VisualizationNode,
  VisualizationEdge,
  VisualizationData,
  VisualizationConfig,
} from '../types.js';

/**
 * Create visualization data from raw lattice data
 */
export function createVisualizationData(
  nodes: readonly VisualizationNode[],
  rootId: string,
  bottomId: string
): VisualizationData {
  const edges = computeEdges(
    nodes,
    nodes.flatMap((n) =>
      n.children.map((c) => ({
        id: `${n.id}->${c}`,
        source: n.id,
        target: c,
        type: 'subtype' as const,
        weight: 1,
      }))
    )
  );

  return {
    nodes,
    edges,
    rootId,
    bottomId,
  };
}

/**
 * Layout nodes in a hierarchical structure
 */
export function layoutLattice(
  nodes: readonly VisualizationNode[],
  config: VisualizationConfig
): VisualizationNode[] {
  if (nodes.length === 0) return [];

  const { levelSpacing, siblingSpacing } = config;

  // Group nodes by depth
  const levels = new Map<number, VisualizationNode[]>();
  let maxDepth = 0;

  for (const node of nodes) {
    const level = levels.get(node.depth) ?? [];
    level.push({ ...node });
    levels.set(node.depth, level);
    maxDepth = Math.max(maxDepth, node.depth);
  }

  const result: VisualizationNode[] = [];

  // Layout each level
  for (let depth = 0; depth <= maxDepth; depth++) {
    const level = levels.get(depth);
    if (!level) continue;

    const levelWidth = (level.length - 1) * siblingSpacing;
    const startX = -levelWidth / 2;

    for (let i = 0; i < level.length; i++) {
      const node = level[i];
      result.push({
        ...node,
        x: startX + i * siblingSpacing,
        y: depth * levelSpacing,
      });
    }
  }

  return result;
}

/**
 * Compute edges from node relationships
 */
export function computeEdges(
  nodes: readonly VisualizationNode[],
  existingEdges: readonly VisualizationEdge[]
): VisualizationEdge[] {
  // Use existing edges if provided
  if (existingEdges.length > 0) {
    return [...existingEdges];
  }

  // Otherwise, compute from node parent/child relationships
  const edges: VisualizationEdge[] = [];
  const edgeSet = new Set<string>();

  for (const node of nodes) {
    for (const childId of node.children) {
      const edgeId = `${node.id}->${childId}`;
      if (!edgeSet.has(edgeId)) {
        edges.push({
          id: edgeId,
          source: node.id,
          target: childId,
          type: 'subtype',
          weight: 1,
        });
        edgeSet.add(edgeId);
      }
    }
  }

  return edges;
}

/**
 * Apply force-directed layout
 */
export function applyForceLayout(
  nodes: VisualizationNode[],
  edges: readonly VisualizationEdge[],
  iterations: number = 100
): VisualizationNode[] {
  // Simple force-directed simulation
  const nodeMap = new Map<string, { x: number; y: number; vx: number; vy: number }>();

  // Initialize positions
  for (const node of nodes) {
    nodeMap.set(node.id, {
      x: node.x + (Math.random() - 0.5) * 10,
      y: node.y + (Math.random() - 0.5) * 10,
      vx: 0,
      vy: 0,
    });
  }

  const alpha = 0.3;
  const repulsion = 500;
  const attraction = 0.01;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all nodes
    for (const [id1, pos1] of nodeMap) {
      for (const [id2, pos2] of nodeMap) {
        if (id1 >= id2) continue;

        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        pos1.vx -= fx;
        pos1.vy -= fy;
        pos2.vx += fx;
        pos2.vy += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * attraction;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    // Apply velocities
    for (const pos of nodeMap.values()) {
      pos.x += pos.vx * alpha;
      pos.y += pos.vy * alpha;
      pos.vx *= 0.9;
      pos.vy *= 0.9;
    }
  }

  // Update node positions
  return nodes.map((node) => {
    const pos = nodeMap.get(node.id);
    return pos ? { ...node, x: pos.x, y: pos.y } : node;
  });
}

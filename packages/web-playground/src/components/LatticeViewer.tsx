/**
 * Lattice Viewer Component
 *
 * Modal for viewing the type lattice visualization.
 */

import { useRef, useEffect, useCallback } from 'react';
import { usePlaygroundStore } from '../store';

interface LatticeNode {
  id: string;
  label: string;
  x: number;
  y: number;
  level: number;
}

interface LatticeEdge {
  from: string;
  to: string;
}

// Sample type lattice structure
const sampleLattice: { nodes: LatticeNode[]; edges: LatticeEdge[] } = {
  nodes: [
    { id: 'top', label: 'unknown', x: 400, y: 50, level: 0 },
    { id: 'object', label: 'object', x: 250, y: 150, level: 1 },
    { id: 'function', label: 'function', x: 400, y: 150, level: 1 },
    { id: 'primitive', label: 'primitive', x: 550, y: 150, level: 1 },
    { id: 'array', label: 'Array<T>', x: 150, y: 250, level: 2 },
    { id: 'record', label: 'Record', x: 350, y: 250, level: 2 },
    { id: 'string', label: 'string', x: 450, y: 250, level: 2 },
    { id: 'number', label: 'number', x: 550, y: 250, level: 2 },
    { id: 'boolean', label: 'boolean', x: 650, y: 250, level: 2 },
    { id: 'stringArray', label: 'string[]', x: 100, y: 350, level: 3 },
    { id: 'numberArray', label: 'number[]', x: 200, y: 350, level: 3 },
    { id: 'user', label: 'User', x: 350, y: 350, level: 3 },
    { id: 'stringLiteral', label: '"hello"', x: 450, y: 350, level: 3 },
    { id: 'numberLiteral', label: '42', x: 550, y: 350, level: 3 },
    { id: 'true', label: 'true', x: 650, y: 350, level: 3 },
    { id: 'never', label: 'never', x: 400, y: 450, level: 4 },
  ],
  edges: [
    { from: 'top', to: 'object' },
    { from: 'top', to: 'function' },
    { from: 'top', to: 'primitive' },
    { from: 'object', to: 'array' },
    { from: 'object', to: 'record' },
    { from: 'primitive', to: 'string' },
    { from: 'primitive', to: 'number' },
    { from: 'primitive', to: 'boolean' },
    { from: 'array', to: 'stringArray' },
    { from: 'array', to: 'numberArray' },
    { from: 'record', to: 'user' },
    { from: 'string', to: 'stringLiteral' },
    { from: 'number', to: 'numberLiteral' },
    { from: 'boolean', to: 'true' },
    { from: 'stringArray', to: 'never' },
    { from: 'numberArray', to: 'never' },
    { from: 'user', to: 'never' },
    { from: 'stringLiteral', to: 'never' },
    { from: 'numberLiteral', to: 'never' },
    { from: 'true', to: 'never' },
  ],
};

export function LatticeViewer() {
  const { toggleLattice, analysis } = usePlaygroundStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get colors from inferences
  const getNodeColor = useCallback(
    (node: LatticeNode) => {
      const inference = analysis.inferences.find((i) => i.type === node.label);
      if (inference) {
        if (inference.confidence >= 0.85) return '#22c55e';
        if (inference.confidence >= 0.6) return '#eab308';
        return '#ef4444';
      }
      return '#6b7280';
    },
    [analysis.inferences]
  );

  // Draw the lattice
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    ctx.strokeStyle = '#3e3e42';
    ctx.lineWidth = 1;
    sampleLattice.edges.forEach((edge) => {
      const fromNode = sampleLattice.nodes.find((n) => n.id === edge.from);
      const toNode = sampleLattice.nodes.find((n) => n.id === edge.to);
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    sampleLattice.nodes.forEach((node) => {
      const color = getNodeColor(node);

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#252526';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#d4d4d4';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });
  }, [getNodeColor]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-ptl-surface rounded-lg shadow-xl border border-ptl-border w-[900px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ptl-border">
          <div>
            <h2 className="text-lg font-semibold">Type Lattice</h2>
            <p className="text-sm text-ptl-text/60">Hierarchical view of type relationships</p>
          </div>
          <button onClick={toggleLattice} className="p-2 rounded hover:bg-ptl-bg transition-colors">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-4 overflow-auto">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="rounded border border-ptl-border"
          />
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-ptl-border flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-ptl-high" />
            <span className="text-ptl-text/60">High Confidence (&gt;85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-ptl-medium" />
            <span className="text-ptl-text/60">Medium (60-85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-ptl-low" />
            <span className="text-ptl-text/60">Low (&lt;60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-ptl-text/60">Not Inferred</span>
          </div>
        </div>
      </div>
    </div>
  );
}

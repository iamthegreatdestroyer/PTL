/**
 * Header Component
 *
 * Top navigation bar with actions.
 */

import { usePlaygroundStore } from '../store';

interface HeaderProps {
  onAnalyze: () => void;
}

export function Header({ onAnalyze }: HeaderProps) {
  const { analysis, toggleLattice, toggleSettings, loadExample } = usePlaygroundStore();

  return (
    <header className="h-14 bg-ptl-surface border-b border-ptl-border flex items-center px-4 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <svg
          className="w-8 h-8 text-ptl-accent"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 4L28 10v12l-12 6L4 22V10l12-6z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="16" cy="16" r="4" fill="currentColor" />
          <path
            d="M16 4v8M16 20v8M4 10l8 6M20 16l8 6M4 22l8-6M20 16l8-6"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        <h1 className="text-lg font-semibold text-white">
          PTL <span className="text-ptl-text/60 font-normal">Playground</span>
        </h1>
      </div>

      {/* Examples dropdown */}
      <select
        className="bg-ptl-bg border border-ptl-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-ptl-accent"
        onChange={(e) => loadExample(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>
          Load example...
        </option>
        <option value="basic">Basic</option>
        <option value="functions">Functions</option>
        <option value="objects">Objects</option>
        <option value="generics">Generics</option>
      </select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status */}
      <div className="flex items-center gap-2 text-sm text-ptl-text/60">
        {analysis.isAnalyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-ptl-accent border-t-transparent rounded-full animate-spin" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-ptl-high" />
            <span>{analysis.inferences.length} types inferred</span>
            <span className="text-ptl-text/40">({analysis.analysisTime.toFixed(0)}ms)</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAnalyze}
          disabled={analysis.isAnalyzing}
          className="px-4 py-1.5 bg-ptl-accent text-white rounded text-sm font-medium hover:bg-ptl-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Analyze
        </button>

        <button
          onClick={toggleLattice}
          className="p-2 rounded hover:bg-ptl-bg transition-colors"
          title="View Type Lattice"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="4" r="2" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="18" cy="12" r="2" />
            <circle cx="12" cy="20" r="2" />
            <path d="M12 6v4M6 14l6 4M18 14l-6 4" />
          </svg>
        </button>

        <button
          onClick={toggleSettings}
          className="p-2 rounded hover:bg-ptl-bg transition-colors"
          title="Settings"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
        </button>
      </div>
    </header>
  );
}

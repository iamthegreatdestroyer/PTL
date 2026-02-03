/**
 * Results Panel Component
 *
 * Shows analysis results and type details.
 */

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { usePlaygroundStore } from '../store';

export function ResultsPanel() {
  const { analysis, selectedInferenceId, selectInference } = usePlaygroundStore();
  const { inferences, isAnalyzing, error } = analysis;

  // Calculate statistics
  const stats = useMemo(() => {
    if (inferences.length === 0) {
      return {
        total: 0,
        high: 0,
        medium: 0,
        low: 0,
        average: 0,
      };
    }

    const high = inferences.filter((i) => i.confidence >= 0.85).length;
    const medium = inferences.filter((i) => i.confidence >= 0.6 && i.confidence < 0.85).length;
    const low = inferences.filter((i) => i.confidence < 0.6).length;
    const average = inferences.reduce((sum, i) => sum + i.confidence, 0) / inferences.length;

    return {
      total: inferences.length,
      high,
      medium,
      low,
      average,
    };
  }, [inferences]);

  // Confidence distribution data for chart
  const chartData = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${(i + 1) * 10}%`,
      count: 0,
    }));

    inferences.forEach((inf) => {
      const bucket = Math.min(Math.floor(inf.confidence * 10), 9);
      buckets[bucket].count++;
    });

    return buckets;
  }, [inferences]);

  // Find selected inference
  const selectedInference = selectedInferenceId
    ? inferences.find((i) => i.id === selectedInferenceId)
    : null;

  if (isAnalyzing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ptl-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-ptl-text/60">Analyzing types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="bg-ptl-low/10 border border-ptl-low/30 rounded-lg p-4 text-center">
          <p className="text-ptl-low font-medium">Analysis Error</p>
          <p className="text-sm text-ptl-text/60 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Statistics */}
      <div className="p-4 border-b border-ptl-border">
        <h2 className="text-sm font-medium text-ptl-text/60 mb-3">Summary</h2>
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Total" value={stats.total} color="text-white" />
          <StatCard label="High" value={stats.high} color="text-ptl-high" />
          <StatCard label="Medium" value={stats.medium} color="text-ptl-medium" />
          <StatCard label="Low" value={stats.low} color="text-ptl-low" />
        </div>

        {/* Average confidence bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-ptl-text/60 mb-1">
            <span>Average Confidence</span>
            <span>{Math.round(stats.average * 100)}%</span>
          </div>
          <div className="h-2 bg-ptl-bg rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${stats.average * 100}%`,
                backgroundColor:
                  stats.average >= 0.85 ? '#22c55e' : stats.average >= 0.6 ? '#eab308' : '#ef4444',
              }}
            />
          </div>
        </div>
      </div>

      {/* Distribution chart */}
      <div className="p-4 border-b border-ptl-border">
        <h2 className="text-sm font-medium text-ptl-text/60 mb-3">Confidence Distribution</h2>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis
                dataKey="range"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#252526',
                  border: '1px solid #3e3e42',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#007acc"
                fill="#007acc"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selected inference details */}
      {selectedInference && (
        <div className="p-4 border-b border-ptl-border bg-ptl-accent/5">
          <h2 className="text-sm font-medium text-ptl-accent mb-2">Selected Type</h2>
          <div className="bg-ptl-bg rounded p-3">
            <code className="text-lg text-white">{selectedInference.type}</code>
            <div className="flex items-center gap-2 mt-2">
              <ConfidenceBadge confidence={selectedInference.confidence} />
              <span className="text-xs text-ptl-text/60">
                Line {selectedInference.location.line}
              </span>
            </div>
            {selectedInference.alternatives.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-ptl-text/60 mb-1">Alternatives:</p>
                <div className="space-y-1">
                  {selectedInference.alternatives.map((alt, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <code className="text-ptl-text/80">{alt.type}</code>
                      <span className="text-xs text-ptl-text/40">
                        {Math.round(alt.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inferences list */}
      <div className="flex-1 overflow-auto">
        <h2 className="text-sm font-medium text-ptl-text/60 p-4 pb-2 sticky top-0 bg-ptl-surface">
          All Inferences
        </h2>
        <div className="px-4 pb-4 space-y-2">
          {inferences.map((inf) => (
            <button
              key={inf.id}
              onClick={() => selectInference(inf.id)}
              className={`w-full text-left type-card ${
                selectedInferenceId === inf.id ? 'border-ptl-accent' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <code className="text-sm">{inf.type}</code>
                <ConfidenceBadge confidence={inf.confidence} />
              </div>
              <p className="text-xs text-ptl-text/40 mt-1">
                Line {inf.location.line}, Col {inf.location.column}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-ptl-bg rounded p-2 text-center">
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
      <p className="text-xs text-ptl-text/40">{label}</p>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100);
  let className = 'confidence-badge ';

  if (confidence >= 0.85) {
    className += 'confidence-high';
  } else if (confidence >= 0.6) {
    className += 'confidence-medium';
  } else {
    className += 'confidence-low';
  }

  return <span className={className}>{percent}%</span>;
}

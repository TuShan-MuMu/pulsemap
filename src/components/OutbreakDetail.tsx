"use client";

import { OutbreakGeoFeature, Severity } from "@/types";

interface OutbreakDetailProps {
  feature: OutbreakGeoFeature | null;
  onClose: () => void;
}

const severityColors: Record<Severity, string> = {
  low: "bg-heat-low",
  moderate: "bg-heat-moderate",
  severe: "bg-heat-severe",
  critical: "bg-heat-critical",
};

const severityTextColors: Record<Severity, string> = {
  low: "text-heat-low",
  moderate: "text-heat-moderate",
  severe: "text-heat-severe",
  critical: "text-heat-critical",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function OutbreakDetail({ feature, onClose }: OutbreakDetailProps) {
  if (!feature) return null;

  const { properties: p } = feature;

  return (
    <div className="absolute top-0 right-0 z-20 h-full w-80 bg-bg-surface border-l border-border shadow-2xl animate-slide-in overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-2.5 h-2.5 rounded-full ${severityColors[p.severity]} ${
                  p.severity === "critical" ? "animate-pulse" : ""
                }`}
              />
              <span
                className={`text-xs font-medium uppercase tracking-wider ${severityTextColors[p.severity]}`}
              >
                {p.severity}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              {p.disease_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-4 text-sm text-text-secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>
            {p.region ? `${p.region}, ` : ""}
            {p.country}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-bg-primary rounded-lg p-3">
            <div className="text-xs text-text-secondary mb-1">Cases</div>
            <div className="text-xl font-bold text-text-primary">
              {formatNumber(p.case_count)}
            </div>
          </div>
          <div className="bg-bg-primary rounded-lg p-3">
            <div className="text-xs text-text-secondary mb-1">Severity Score</div>
            <div className={`text-xl font-bold ${severityTextColors[p.severity]}`}>
                          <span>{(p.severity_score * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              p.status === "active"
                ? "bg-heat-severe/20 text-heat-severe"
                : p.status === "monitoring"
                ? "bg-heat-moderate/20 text-heat-moderate"
                : "bg-heat-low/20 text-heat-low"
            }`}
          >
            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
          </div>
        </div>

        {/* Summary */}
        {p.summary && (
          <div className="mb-4">
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
              Summary
            </div>
            <p className="text-sm text-text-primary leading-relaxed">
              {p.summary}
            </p>
          </div>
        )}

        {/* Coordinates */}
        <div className="text-xs text-text-secondary border-t border-border pt-3">
          <span>
            {feature.geometry.coordinates[1].toFixed(4)},{" "}
            {feature.geometry.coordinates[0].toFixed(4)}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

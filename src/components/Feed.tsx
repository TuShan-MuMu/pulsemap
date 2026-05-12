"use client";

import { Severity } from "@/types";
import { FeedItem } from "@/lib/seed-data";

interface FeedProps {
  items: FeedItem[];
  searchQuery: string;
  onItemClick: (outbreakId: string) => void;
}

const sourceIcons: Record<string, string> = {
  who: "🛡️",
  cdc: "🏛️",
  news: "📰",
  user: "👤",
};

const severityDotColors: Record<Severity, string> = {
  low: "bg-heat-low",
  moderate: "bg-heat-moderate",
  severe: "bg-heat-severe",
  critical: "bg-heat-critical",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function Feed({ items, searchQuery, onItemClick }: FeedProps) {
  const filtered = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.disease_name.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.source_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Live Feed</h2>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-heat-severe animate-pulse" />
            <span className="text-xs text-text-secondary">
              {filtered.length} reports
            </span>
          </div>
        </div>
      </div>

      {/* Feed Items */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-text-secondary">
            No reports match your search.
          </div>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item.outbreak_id)}
              className="w-full text-left px-4 py-3 border-b border-border hover:bg-bg-surface transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-base mt-0.5">
                  {sourceIcons[item.source_type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-accent">
                      {item.source_name}
                    </span>
                    <span className="text-xs text-text-secondary">·</span>
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${severityDotColors[item.severity]}`}
                      />
                      <span className="text-xs text-text-secondary">
                        {item.disease_name}
                      </span>
                    </div>
                    <span className="text-xs text-text-secondary">·</span>
                    <span className="text-xs text-text-secondary">
                      {item.location}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary leading-snug truncate">
                    {item.title}
                  </p>
                  <span className="text-xs text-text-secondary mt-1 block">
                    {timeAgo(item.published_at)}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

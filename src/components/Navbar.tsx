"use client";

import { useState } from "react";

interface NavbarProps {
  onSearch: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 border-b border-border bg-bg-primary/90 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
        <span className="text-lg font-semibold tracking-tight text-text-primary">
          PulseMap
        </span>
        <span className="text-xs text-text-secondary hidden sm:inline">
          Global Disease Radar
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 max-w-md mx-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch(e.target.value);
            }}
            placeholder="Search diseases, countries..."
            className="w-full pl-10 pr-4 py-1.5 text-sm bg-bg-surface border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
          />
        </div>
      </form>

      <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary border border-border rounded-lg hover:bg-bg-surface hover:text-text-primary transition-colors">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="hidden sm:inline">Sign In</span>
      </button>
    </nav>
  );
}

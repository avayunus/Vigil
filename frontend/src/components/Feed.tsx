'use client';

import type { Event, Severity } from '@/types';

const colors: Record<Severity, string> = {
  critical: '#ff3b30',
  high: '#ff9500',
  medium: '#ffcc00',
  low: '#34c759',
};

interface Props {
  events: Event[];
  filter: Severity | null;
}

export default function Feed({ events, filter }: Props) {
  const filtered = filter ? events.filter(e => e.severity === filter) : events;
  
  if (filtered.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-dim)] text-sm">
        No events
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      {filtered.slice(0, 50).map(e => (
        <a
          key={e.id}
          href={e.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 rounded-lg hover:bg-white/[0.02] transition-colors group"
        >
          <div className="flex gap-3">
            <div 
              className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
              style={{ backgroundColor: colors[e.severity] }}
            />
            <div className="min-w-0">
              <p className="text-sm text-[var(--text)] leading-snug line-clamp-2 group-hover:text-white">
                {e.title}
              </p>
              <p className="text-xs text-[var(--text-dim)] mt-1">
                {e.source}
              </p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

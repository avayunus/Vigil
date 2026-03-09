'use client';

import type { MonitorEvent, Severity } from '@/types';

const colors: Record<Severity, string> = {
  critical: 'var(--critical)',
  high: 'var(--high)',
  medium: 'var(--medium)',
  low: 'var(--low)',
};

interface Props {
  events: MonitorEvent[];
}

function formatTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'live';
  }

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Feed({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="panel flex h-full items-center justify-center p-6 text-sm text-[var(--ink-muted)]">
        No live signals matched the current filters.
      </div>
    );
  }

  return (
    <div className="panel p-3">
      <div className="mb-3 flex items-end justify-between gap-3 px-2">
        <div>
          <p className="section-kicker">Signal Feed</p>
          <h2 className="font-serif-display text-2xl text-[var(--ink-strong)]">Live reporting</h2>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">
          Region-filtered headlines with mapped locations
        </p>
      </div>

      <div className="space-y-2">
        {events.slice(0, 36).map((event) => (
          <a
            key={event.id}
            href={event.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-[22px] border border-transparent bg-white/50 p-4 transition-all hover:border-[var(--line-strong)] hover:bg-white"
          >
            <div className="flex gap-3">
              <div
                className="mt-2 h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: colors[event.severity] }}
              />
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-snug text-[var(--ink-strong)]">
                    {event.title}
                  </p>
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                    {event.severity}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                  {event.summary}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {event.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-[var(--ink-muted)]">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                  <span>{event.source}</span>
                  <span>{event.location}</span>
                  <span>{formatTime(event.published_at)}</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

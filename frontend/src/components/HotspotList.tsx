'use client';

import type { Hotspot, Severity } from '@/types';

const accentBySeverity: Record<Severity, string> = {
  critical: 'bg-[var(--critical)]',
  high: 'bg-[var(--high)]',
  medium: 'bg-[var(--medium)]',
  low: 'bg-[var(--low)]',
};

interface Props {
  hotspots: Hotspot[];
}

function formatDate(value: string | null) {
  if (!value) {
    return 'curated baseline';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'curated baseline';
  }

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HotspotList({ hotspots }: Props) {
  const topHotspots = hotspots.slice(0, 8);

  return (
    <div className="panel p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Priority Hotspots</p>
          <h2 className="font-serif-display text-2xl text-[var(--ink-strong)]">What to watch first</h2>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">
          Ranked by recent signal density and baseline exposure
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {topHotspots.map((hotspot) => (
          <div key={hotspot.id} className="rounded-[24px] border border-[var(--line)] bg-white/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">{hotspot.region}</p>
                <h3 className="mt-1 text-base font-semibold text-[var(--ink-strong)]">{hotspot.name}</h3>
              </div>
              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${accentBySeverity[hotspot.severity]}`} />
            </div>

            <p className="mt-2 text-sm leading-6 text-[var(--ink)]">{hotspot.summary}</p>

            <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-[var(--ink-faint)]">
              <span>{hotspot.event_count} linked live signals</span>
              <span>{formatDate(hotspot.last_update)}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {hotspot.watch.slice(0, 3).map((item) => (
                <span key={item} className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--ink-muted)]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

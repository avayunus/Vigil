'use client';

import type { Briefing, Severity } from '@/types';

const severityClasses: Record<Severity, string> = {
  critical: 'bg-[var(--critical-soft)] text-[var(--critical-ink)] border-[var(--critical-line)]',
  high: 'bg-[var(--high-soft)] text-[var(--high-ink)] border-[var(--high-line)]',
  medium: 'bg-[var(--medium-soft)] text-[var(--medium-ink)] border-[var(--medium-line)]',
  low: 'bg-[var(--surface-2)] text-[var(--ink-muted)] border-[var(--line)]',
};

interface Props {
  briefings: Briefing[];
}

export default function Briefings({ briefings }: Props) {
  if (!briefings.length) {
    return (
      <div className="panel p-5 text-sm text-[var(--ink-muted)]">
        No matching briefings for the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {briefings.map((briefing) => (
        <article key={briefing.id} className="panel p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-kicker">{briefing.region}</p>
              <h3 className="font-serif-display text-[1.15rem] leading-tight text-[var(--ink-strong)]">
                {briefing.title}
              </h3>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${severityClasses[briefing.severity]}`}>
              {briefing.severity}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-[var(--ink)]">{briefing.summary}</p>

          <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--ink)]">
            {briefing.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-2xl bg-[var(--surface-2)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)]">
              Watchpoints
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-[var(--ink)]">
              {briefing.watchpoints.map((watchpoint) => (
                <li key={watchpoint}>{watchpoint}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {briefing.hotspots_preview.map((hotspot) => (
              <span key={hotspot.id} className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--ink-muted)]">
                {hotspot.name}
              </span>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
            {briefing.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-[var(--line)] bg-white/50 px-3 py-3 text-sm transition-colors hover:border-[var(--line-strong)] hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-[var(--ink-strong)]">{source.label}</span>
                  <span className="text-xs text-[var(--ink-faint)]">{source.date}</span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                  {source.publisher || 'Source'}
                </p>
              </a>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

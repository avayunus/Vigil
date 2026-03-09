'use client';

import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Briefings from '@/components/Briefings';
import Feed from '@/components/Feed';
import HotspotList from '@/components/HotspotList';
import type { MonitorData, Severity } from '@/types';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

const severities: Severity[] = ['critical', 'high', 'medium', 'low'];
const colors: Record<Severity, string> = {
  critical: 'var(--critical)',
  high: 'var(--high)',
  medium: 'var(--medium)',
  low: 'var(--low)',
};

export default function Home() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const payload = await fetch('/api/v1/monitor').then((response) => response.json());
      setData(payload);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 300000);
    return () => clearInterval(i);
  }, []);

  const deferredSeverity = useDeferredValue(severityFilter);
  const deferredRegion = useDeferredValue(regionFilter);

  const filteredEvents = (data?.events || []).filter((event) => {
    const severityPass = !deferredSeverity || event.severity === deferredSeverity;
    const regionPass = deferredRegion === 'all' || event.region_id === deferredRegion;
    return severityPass && regionPass;
  });

  const filteredHotspots = (data?.hotspots || []).filter((hotspot) => {
    const severityPass = !deferredSeverity || hotspot.severity === deferredSeverity;
    const regionPass = deferredRegion === 'all' || hotspot.region_id === deferredRegion;
    return severityPass && regionPass;
  });

  const filteredBriefings = (data?.briefings || []).filter((briefing) => {
    const severityPass = !deferredSeverity || briefing.severity === deferredSeverity;
    const regionPass = deferredRegion === 'all' || briefing.region_id === deferredRegion;
    return severityPass && regionPass;
  });

  const updatedAt = data?.generated_at
    ? new Date(data.generated_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : 'waiting for data';

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-5 text-[var(--ink)] lg:px-6">
      <div className="mx-auto max-w-[1580px]">
        <section className="hero-shell">
          <div className="hero-copy">
            <p className="section-kicker">Middle East Monitor</p>
            <h1 className="font-serif-display text-4xl leading-[1.05] text-[var(--ink-strong)] sm:text-5xl">
              {data?.headline.title || 'Middle East pressure map'}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink)] sm:text-lg">
              {data?.headline.summary || 'Tracking the military, political, and humanitarian pressure points that are moving together across Iraq, Kurdistan, Syria, Lebanon, Gaza, Yemen, and the Gulf.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">
              <span>{updatedAt}</span>
              <span>{data?.stats.live_signals || 0} live signals</span>
              <span>{data?.stats.active_hotspots || 0} active hotspots</span>
              <span>{data?.stats.briefings || 0} curated briefings</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="metric-card">
              <span className="metric-label">Live signals</span>
              <strong className="metric-value">{data?.stats.live_signals || 0}</strong>
              <p className="metric-copy">Region-filtered articles mapped to monitored locations.</p>
            </div>
            <div className="metric-card">
              <span className="metric-label">Critical hotspots</span>
              <strong className="metric-value">{data?.stats.critical_hotspots || 0}</strong>
              <p className="metric-copy">Flashpoints where military or humanitarian escalation is already acute.</p>
            </div>
            <div className="metric-card">
              <span className="metric-label">Regions watched</span>
              <strong className="metric-value">{data?.stats.monitored_regions || 0}</strong>
              <p className="metric-copy">Iraq, Kurdistan, Syria, Lebanon, Gaza, Yemen, and Gulf lanes.</p>
            </div>
            <div className="metric-card">
              <span className="metric-label">Curated briefs</span>
              <strong className="metric-value">{data?.stats.briefings || 0}</strong>
              <p className="metric-copy">Manual context layered over live reporting so quiet feeds do not erase the actual picture.</p>
            </div>
          </div>

          <div className="panel flex flex-col gap-4 p-4">
            <div>
              <p className="section-kicker">Filter by region</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => startTransition(() => setRegionFilter('all'))}
                  className={`pill ${regionFilter === 'all' ? 'pill-active' : ''}`}
                >
                  All theaters
                </button>
                {data?.stats.regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => startTransition(() => setRegionFilter(region.id))}
                    className={`pill ${regionFilter === region.id ? 'pill-active' : ''}`}
                  >
                    {region.label} <span className="opacity-60">{region.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="section-kicker">Filter by severity</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => startTransition(() => setSeverityFilter(null))}
                  className={`pill ${severityFilter === null ? 'pill-active' : ''}`}
                >
                  All severities
                </button>
                {severities.map((severity) => (
                  <button
                    key={severity}
                    onClick={() => startTransition(() => setSeverityFilter(severityFilter === severity ? null : severity))}
                    className={`pill ${severityFilter === severity ? 'pill-active' : ''}`}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[severity] }} />
                    <span className="capitalize">{severity}</span>
                    <span className="opacity-60">{data?.stats.severity[severity] || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)_minmax(0,390px)]">
          <div className="space-y-4">
            <Briefings briefings={filteredBriefings} />
          </div>

          <div className="space-y-4">
            <div className="panel overflow-hidden p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="section-kicker">Operational Picture</p>
                  <h2 className="font-serif-display text-2xl text-[var(--ink-strong)]">Mapped pressure points</h2>
                </div>
                <p className="max-w-md text-right text-sm leading-6 text-[var(--ink-muted)]">
                  This map stays centered on the Middle East and uses named hotspots rather than raw point spam, which keeps Kurdistan, U.S. military nodes, and shipping lanes visible even when article geocoding is weak.
                </p>
              </div>

              <div className="mt-5 h-[540px] overflow-hidden rounded-[28px] border border-[var(--line)]">
                <Map hotspots={filteredHotspots} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                <span>{filteredHotspots.length} mapped hotspots in view</span>
                <span>{filteredEvents.length} linked live signals</span>
                {loading && <span>refreshing</span>}
              </div>
            </div>

            <HotspotList hotspots={filteredHotspots} />
          </div>

          <div className="space-y-4">
            <Feed events={filteredEvents} />

            <div className="panel p-5">
              <p className="section-kicker">Method</p>
              <h2 className="font-serif-display text-2xl text-[var(--ink-strong)]">How this monitor reads the region</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--ink)]">
                <p>
                  Live reporting is filtered down to theaters that matter for the current escalation: Iraq and Kurdistan, Syria, Lebanon, Gaza, Yemen, and the Gulf.
                </p>
                <p>
                  A curated briefing layer keeps official and high-signal reporting visible, especially for U.S. military activity, Iranian attacks, and lower-volume places in Kurdistan that generic dashboards usually miss.
                </p>
                <p>
                  Hotspots are ranked by baseline exposure plus recent reporting so a quiet hour does not make a serious place disappear.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Event, GeoPoint, Stats, Severity } from '@/types';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });
import Feed from '@/components/Feed';

const severities: Severity[] = ['critical', 'high', 'medium', 'low'];
const colors: Record<Severity, string> = {
  critical: '#ff3b30',
  high: '#ff9500',
  medium: '#ffcc00',
  low: '#34c759',
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<Severity | null>(null);
  const [loading, setLoading] = useState(true);
  
  const load = async () => {
    try {
      const [evRes, geoRes, statsRes] = await Promise.all([
        fetch('/api/v1/events').then(r => r.json()),
        fetch('/api/v1/events/geo').then(r => r.json()),
        fetch('/api/v1/events/stats').then(r => r.json()),
      ]);
      setEvents(evRes.events || []);
      setPoints(geoRes.points || []);
      setStats(statsRes);
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
  
  const filteredCount = filter 
    ? points.filter(p => p.severity === filter).length 
    : points.length;
  
  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <header className="flex-shrink-0 h-12 border-b border-[var(--border)] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-black" />
          </div>
          <span className="font-medium text-sm">Vigil</span>
        </div>
        
        <div className="flex items-center gap-4">
          {loading && (
            <div className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" />
          )}
          <span className="text-xs text-[var(--text-dim)] mono">
            {stats?.total || 0} events
          </span>
        </div>
      </header>
      
      {/* Filter bar */}
      <div className="flex-shrink-0 h-10 border-b border-[var(--border)] flex items-center gap-1 px-4">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            filter === null 
              ? 'bg-white text-black' 
              : 'text-[var(--text-dim)] hover:text-white'
          }`}
        >
          All
        </button>
        {severities.map(s => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? null : s)}
            className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5 ${
              filter === s 
                ? 'bg-white/10 text-white' 
                : 'text-[var(--text-dim)] hover:text-white'
            }`}
          >
            <span 
              className="w-1.5 h-1.5 rounded-full" 
              style={{ backgroundColor: colors[s] }}
            />
            <span className="capitalize">{s}</span>
            <span className="opacity-50">{stats?.severity[s] || 0}</span>
          </button>
        ))}
      </div>
      
      {/* Main */}
      <div className="flex-1 flex min-h-0">
        {/* Map */}
        <div className="flex-1 relative">
          <Map points={points} filter={filter} />
          <div className="absolute bottom-4 left-4 text-xs text-[var(--text-dim)] mono">
            {filteredCount} mapped
          </div>
        </div>
        
        {/* Feed */}
        <div className="w-80 border-l border-[var(--border)] flex flex-col">
          <div className="flex-shrink-0 h-10 border-b border-[var(--border)] flex items-center px-4">
            <span className="text-xs text-[var(--text-dim)]">Feed</span>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <Feed events={events} filter={filter} />
          </div>
        </div>
      </div>
    </div>
  );
}

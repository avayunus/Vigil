'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Hotspot, Severity } from '@/types';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then(m => m.Polygon), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(m => m.Tooltip), { ssr: false });

const colors: Record<Severity, string> = {
  critical: '#b93c2f',
  high: '#cc6d32',
  medium: '#c79f42',
  low: '#4f6f5b',
};

const focusZones = [
  {
    label: 'Kurdistan pressure arc',
    positions: [
      [36.9, 43.2],
      [36.9, 44.9],
      [35.2, 45.6],
      [35.1, 43.7],
    ],
  },
  {
    label: 'Eastern Syria detention corridor',
    positions: [
      [37.0, 39.8],
      [37.0, 41.5],
      [34.7, 41.5],
      [34.7, 39.8],
    ],
  },
  {
    label: 'South Lebanon border belt',
    positions: [
      [33.55, 35.0],
      [33.55, 35.65],
      [33.0, 35.65],
      [33.0, 35.0],
    ],
  },
  {
    label: 'Gaza access strip',
    positions: [
      [31.64, 34.18],
      [31.64, 34.58],
      [31.18, 34.58],
      [31.18, 34.18],
    ],
  },
];

const seaLanes = [
  {
    label: 'Bab el-Mandeb shipping lane',
    positions: [
      [12.2, 43.8],
      [12.6, 43.2],
      [13.2, 42.9],
      [14.1, 43.4],
    ],
  },
  {
    label: 'Hormuz tanker lane',
    positions: [
      [26.2, 56.6],
      [26.5, 56.0],
      [26.8, 55.5],
      [27.1, 55.0],
    ],
  },
];

interface Props {
  hotspots: Hotspot[];
}

export default function Map({ hotspots }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  if (!ready) {
    return <div className="h-full w-full rounded-[28px] bg-[var(--surface-2)]" />;
  }

  return (
    <MapContainer
      center={[31.6, 43.8]}
      zoom={5}
      minZoom={4}
      maxZoom={8}
      maxBounds={[[8, 28], [40, 62]]}
      maxBoundsViscosity={0.85}
      className="h-full w-full"
      style={{ background: '#e8decf' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        noWrap
      />

      {focusZones.map((zone) => (
        <Polygon
          key={zone.label}
          positions={zone.positions as [number, number][]}
          pathOptions={{
            // These are framing zones, not pretend front lines.
            color: '#8d7962',
            weight: 1,
            dashArray: '4 6',
            fillColor: '#d7c6ab',
            fillOpacity: 0.16,
          }}
        >
          <Tooltip sticky>{zone.label}</Tooltip>
        </Polygon>
      ))}

      {seaLanes.map((lane) => (
        <Polyline
          key={lane.label}
          positions={lane.positions as [number, number][]}
          pathOptions={{
            color: '#365a74',
            weight: 2,
            dashArray: '6 8',
            opacity: 0.75,
          }}
        >
          <Tooltip sticky>{lane.label}</Tooltip>
        </Polyline>
      ))}

      {hotspots.map((hotspot) => (
        <CircleMarker
          key={hotspot.id}
          center={[hotspot.lat, hotspot.lng]}
          radius={Math.min(9 + hotspot.event_count * 1.5, 18)}
          pathOptions={{
            fillColor: colors[hotspot.severity],
            fillOpacity: 0.78,
            color: '#f8f3eb',
            weight: 1.2,
          }}
        >
          {(hotspot.severity === 'critical' || hotspot.activity_score >= 10) && (
            <Tooltip direction="top" offset={[0, -10]} opacity={1} className="map-tooltip">
              {hotspot.name}
            </Tooltip>
          )}

          <Popup>
            <div className="min-w-[240px] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">{hotspot.region}</p>
              <p className="mt-1 text-base font-semibold text-[var(--ink-strong)]">{hotspot.name}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink)]">{hotspot.summary}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {hotspot.watch.slice(0, 3).map((item) => (
                  <span key={item} className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-[var(--ink-muted)]">
                    {item}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                {hotspot.event_count} linked live signals
              </p>

              {hotspot.sources[0] && (
                <a
                  href={hotspot.sources[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-xs py-2 bg-white/5 rounded hover:bg-white/10"
                >
                  Open latest source
                </a>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { GeoPoint, Severity } from '@/types';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

const colors: Record<Severity, string> = {
  critical: '#ff3b30',
  high: '#ff9500',
  medium: '#ffcc00',
  low: '#34c759',
};

const sizes: Record<Severity, number> = {
  critical: 10,
  high: 8,
  medium: 6,
  low: 5,
};

interface Props {
  points: GeoPoint[];
  filter: Severity | null;
}

export default function Map({ points, filter }: Props) {
  const [ready, setReady] = useState(false);
  
  useEffect(() => { setReady(true); }, []);
  
  if (!ready) {
    return <div className="h-full w-full bg-black" />;
  }
  
  const filtered = filter ? points.filter(p => p.severity === filter) : points;
  
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={10}
      maxBounds={[[-85, -180], [85, 180]]}
      maxBoundsViscosity={1}
      className="h-full w-full"
      style={{ background: '#000' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        noWrap
      />
      
      {filtered.map(p => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={sizes[p.severity]}
          fillColor={colors[p.severity]}
          fillOpacity={0.9}
          stroke={false}
        >
          <Popup>
            <div className="p-3 min-w-[180px]">
              <p className="text-sm mb-2">{p.title}</p>
              <p className="text-xs text-[var(--text-dim)] mb-3">{p.country}</p>
              {p.source_url && (
                <a 
                  href={p.source_url} 
                  target="_blank"
                  className="block text-center text-xs py-2 bg-white/5 rounded hover:bg-white/10"
                >
                  Read source
                </a>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

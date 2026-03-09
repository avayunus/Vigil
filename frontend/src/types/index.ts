export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Category = 'military' | 'shipping' | 'humanitarian' | 'energy' | 'political' | 'security';

export interface MonitorEvent {
  id: string;
  title: string;
  summary: string;
  source: string;
  source_url: string;
  severity: Severity;
  category: Category;
  region_id: string;
  region: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  tags: string[];
  published_at: string;
  hotspot_ids: string[];
}

export interface HotspotEventLink {
  id: string;
  title: string;
  source_url: string;
  source: string;
}

export interface SourceLink {
  label: string;
  publisher?: string;
  date?: string;
  url: string;
}

export interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  severity: Severity;
  name: string;
  region_id: string;
  region: string;
  country: string;
  summary: string;
  watch: string[];
  event_count: number;
  linked_events: HotspotEventLink[];
  linked_briefs: string[];
  sources: SourceLink[];
  last_update: string | null;
  activity_score: number;
}

export interface Briefing {
  id: string;
  title: string;
  region_id: string;
  region: string;
  severity: Severity;
  last_verified: string;
  summary: string;
  bullets: string[];
  watchpoints: string[];
  hotspot_count: number;
  hotspots_preview: Hotspot[];
  sources: SourceLink[];
}

export interface RegionStat {
  id: string;
  label: string;
  count: number;
}

export interface Stats {
  live_signals: number;
  active_hotspots: number;
  critical_hotspots: number;
  briefings: number;
  monitored_regions: number;
  severity: Record<Severity, number>;
  category: Record<string, number>;
  regions: RegionStat[];
}

export interface MonitorData {
  generated_at: string;
  headline: {
    title: string;
    summary: string;
  };
  events: MonitorEvent[];
  hotspots: Hotspot[];
  briefings: Briefing[];
  stats: Stats;
}

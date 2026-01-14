export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Event {
  id: string;
  title: string;
  source: string;
  source_url: string;
  severity: Severity;
}

export interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  severity: Severity;
  title: string;
  country: string;
  source_url: string;
}

export interface Stats {
  total: number;
  mapped: number;
  severity: Record<Severity, number>;
}

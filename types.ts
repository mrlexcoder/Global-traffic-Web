
export interface TrafficNode {
  id: string;
  country: string;
  lat: number;
  lng: number;
  ip: string;
  status: 'active' | 'idle' | 'failed';
}

export interface SimulationStats {
  totalRequests: number;
  successRate: number;
  avgLatency: number;
  activeNodes: number;
  requestsPerSecond: number;
}

export interface TargetAnalysis {
  title: string;
  serverInfo: string;
  technologies: string[];
  vulnerabilityScore: number;
  summary: string;
}

export interface HistoryItem {
  timestamp: string;
  url: string;
  requests: number;
}

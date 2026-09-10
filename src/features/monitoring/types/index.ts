export interface HealthMetric {
  service: string;
  status: 'Healthy' | 'Degraded' | 'Down';
  latencyMs: number;
  uptime: string;
}

export interface AiOpsInsight {
  id: string;
  issue: string;
  impact: string;
  recommendation: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string;
}

export interface SyncQueueItem {
  id: string;
  action: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  status: 'Pending' | 'Syncing' | 'Failed' | 'Conflict';
  errorMessage?: string;
}

export interface KpiData {
  totalBooks: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  revenue: number;
  trends: {
    books: number;
    members: number;
    loans: number;
    revenue: number;
  };
}

export interface ChartDataPoint {
  date: string;
  checkouts: number;
  returns: number;
  newMembers: number;
}

export interface TopReader {
  id: string;
  name: string;
  borrowCount: number;
}

export interface DashboardOverview {
  kpis: KpiData;
  circulationTrend: ChartDataPoint[];
  topReaders: TopReader[];
}

export interface DashboardInsight {
  summary: string;
  anomalies: string[];
  recommendations: string[];
}

export interface ReportDataset {
  id: string;
  name: string;
  description: string;
}

export interface ReportFilter {
  dateRange: string;
  branchId: string;
  groupBy: string;
}

export interface ReportResultRow {
  [key: string]: any;
}

export interface ReportSummary {
  totalLoans: number;
  totalReturns: number;
  overdueBooks: number;
  totalFines: number;
}

export interface ReportPreview {
  columns: string[];
  rows: ReportResultRow[];
  totalRows: number;
  summary?: ReportSummary;
}

export interface ReportAiInsight {
  summary: string;
  significantTrends: string[];
  anomalies: string[];
  actionableInsights: string[];
}

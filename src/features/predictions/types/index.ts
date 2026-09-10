export interface ForecastPoint {
  date: string;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
}

export interface RiskAlert {
  id: string;
  title: string;
  description: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  confidenceScore: number;
  suggestedActions: string[];
  type: 'Shortage' | 'Overdue' | 'Loss';
}

export interface PredictionSummary {
  lastRunAt: string;
  totalAlerts: number;
  highRiskCount: number;
}

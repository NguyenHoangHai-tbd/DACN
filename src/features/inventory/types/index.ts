export interface InventorySession {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  status: 'Open' | 'Closed';
  expectedCount: number;
  scannedCount: number;
  createdBy: string;
  createdAt: string;
  closedAt?: string;
  notes?: string;
}

export interface Discrepancy {
  id: string;
  sessionId: string;
  bookId: string;
  bookTitle: string;
  copyBarcode: string;
  expectedStatus: string;
  actualStatus: string;
  condition: string;
  resolution?: 'Approve Loss' | 'Change Condition' | 'Reject' | 'Pending';
  note?: string;
}

export interface InventoryInsight {
  highRiskSections: string[];
  anomalies: string[];
  suggestions: string[];
}

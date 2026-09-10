export interface ImportJob {
  id: string;
  tenantId: string;
  fileName: string;
  entityType: 'Books' | 'Members' | 'Copies';
  status: 'Uploading' | 'Mapping' | 'Ready' | 'Processing' | 'Completed' | 'Failed';
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  createdAt: string;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
}

export interface AiMappingSuggestion {
  suggestedMappings: ColumnMapping[];
  confidence: number;
  notes: string[];
}

export interface ImportErrorRow {
  rowNumber: number;
  data: any;
  errorMessage: string;
}

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number;
}

export interface OcrResult {
  id: string;
  status: 'Processing' | 'Completed' | 'Failed';
  imageUrl: string;
  extractedFields: ExtractedField[];
  overallConfidence: number;
  errorMessage?: string;
}

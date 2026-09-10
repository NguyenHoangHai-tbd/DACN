export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  description?: string;
  publisher?: string;
  shelf?: string;
  tenantId: string;
  coverUrl?: string;
  barcode?: string;
}

export interface AiEnrichBookRequest {
  isbn: string;
  title?: string;
}

export interface AiEnrichBookResponse {
  description: string;
  suggestedCategories: string[];
  tags: string[];
  coverUrl?: string;
}

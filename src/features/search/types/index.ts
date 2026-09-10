import { Book } from '../../books/types';

export interface BookSearchFilters {
  query: string;
  category?: string;
  branch?: string;
  availableOnly?: boolean;
}

export interface AiSearchResult {
  book: Book;
  matchReason: string;
  confidence: number;
}

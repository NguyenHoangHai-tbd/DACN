export interface RecommendedBook {
  id: string;
  bookId: string;
  title: string;
  author: string;
  coverImage?: string;
  coverUrl?: string;
  reason: string;
  matchScore: number;
  availableCopies: number;
  category?: string;
  isbn?: string;
  totalCopies?: number;
}

export interface AllocationSuggestion {
  id: string;
  bookId: string;
  title: string;
  sourceBranch: { id: string; name: string };
  targetBranch: { id: string; name: string };
  suggestedQuantity: number;
  reason: string;
  confidenceScore: number;
}

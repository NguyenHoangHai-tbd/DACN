export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  checkoutDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Active' | 'Overdue' | 'Returned';
  tenantId: string;
  fineAmount?: number;
  finePaid?: boolean;
  finePaidAt?: string;
  paymentMethod?: string;
  coverUrl?: string;
  overdueDays?: number;
}

export interface CheckOutRequest {
  userId: string;
  copyId: string;
}

export interface CheckInRequest {
  userId?: string;
  copyId: string;
}

export interface CheckInResponse {
  loan: Loan;
  fine: number;
}

export interface AiCirculationInsightRequest {
  userId: string;
}

export interface AiCirculationInsightResponse {
  insight: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  suggestedActions: string[];
}

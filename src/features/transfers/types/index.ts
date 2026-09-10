export interface TransferItem {
  id: string;
  bookId: string;
  bookTitle: string;
  copyBarcode: string;
}

export interface BookTransfer {
  id: string;
  tenantId: string;
  sourceBranchId: string;
  sourceBranchName: string;
  destinationBranchId: string;
  destinationBranchName: string;
  status: 'Pending' | 'InTransit' | 'Received' | 'Cancelled';
  items: TransferItem[];
  reason: string;
  requestedBy: string;
  createdDate: string;
  shippedDate?: string;
  receivedDate?: string;
}

export interface AiTransferSuggestion {
  recommendedBranchId: string;
  recommendedBranchName: string;
  reasoning: string;
  distanceOrCost: string;
  availableCopies: number;
}

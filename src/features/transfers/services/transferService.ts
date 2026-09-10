import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { BookTransfer, AiTransferSuggestion } from '../types';

export const transferService = {
  getTransfers: async (params?: { branchId?: string; status?: string }): Promise<BookTransfer[]> => {
    const res = await axiosInstance.get<ApiResponse<BookTransfer[]>>('/transfers', { params });
    return res.data.data;
  },
  
  createTransfer: async (data: { destinationBranchId: string; sourceBranchId: string; barcodeList: string[]; reason: string }): Promise<BookTransfer> => {
    const res = await axiosInstance.post<ApiResponse<BookTransfer>>('/transfers', data);
    return res.data.data;
  },
  
  receiveTransfer: async (id: string, branchId: string): Promise<BookTransfer> => {
    const res = await axiosInstance.post<ApiResponse<BookTransfer>>(`/transfers/${id}/receive`, { branchId });
    return res.data.data;
  },
  
  getAiSuggestions: async (bookId: string, destinationBranchId: string): Promise<AiTransferSuggestion[]> => {
    const res = await axiosInstance.get<ApiResponse<AiTransferSuggestion[]>>('/ai/transfer-suggestions', { 
      params: { bookId, destinationBranchId } 
    });
    return res.data.data;
  }
};

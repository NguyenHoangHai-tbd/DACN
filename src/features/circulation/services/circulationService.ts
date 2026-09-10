import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Loan, CheckOutRequest, CheckInRequest, CheckInResponse, AiCirculationInsightRequest, AiCirculationInsightResponse } from '../types';
import { ApiResponse } from '../../auth/types';

export const circulationService = {
  getActiveLoans: async (): Promise<Loan[]> => {
    const res = await axiosInstance.get<ApiResponse<Loan[]>>('/loans/active');
    return res.data.data;
  },
  checkOut: async (data: CheckOutRequest): Promise<Loan> => {
    const res = await axiosInstance.post<ApiResponse<Loan>>('/loans/check-out', data);
    return res.data.data;
  },
  checkIn: async (data: CheckInRequest): Promise<CheckInResponse> => {
    const res = await axiosInstance.post<ApiResponse<CheckInResponse>>('/loans/check-in', data);
    return res.data.data;
  },
  renew: async (loanId: string): Promise<Loan> => {
    const res = await axiosInstance.post<ApiResponse<Loan>>('/loans/renew', { loanId });
    return res.data.data;
  },
  createHold: async (data: { userId: string, bookId: string }): Promise<any> => {
    const res = await axiosInstance.post<ApiResponse<any>>('/holds', data);
    return res.data.data;
  },
  getActiveHolds: async (): Promise<any[]> => {
    const res = await axiosInstance.get<ApiResponse<any[]>>('/holds/active');
    return res.data.data;
  },
  getReturnedUnpaidFines: async (): Promise<Loan[]> => {
    const res = await axiosInstance.get<ApiResponse<Loan[]>>('/loans/unpaid-fines');
    return res.data.data;
  },
  fulfillHold: async (holdId: string): Promise<any> => {
    const res = await axiosInstance.post<ApiResponse<any>>('/holds/fulfill', { holdId });
    return res.data.data;
  },
  getAiInsight: async (data: AiCirculationInsightRequest): Promise<AiCirculationInsightResponse> => {
    const res = await axiosInstance.post<ApiResponse<AiCirculationInsightResponse>>('/ai/circulation-insight', data);
    return res.data.data;
  }
};

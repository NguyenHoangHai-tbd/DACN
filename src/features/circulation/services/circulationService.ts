import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Loan, CheckOutRequest, CheckInRequest, CheckInResponse, AiCirculationInsightRequest, AiCirculationInsightResponse } from '../types';
import { ApiResponse } from '../../auth/types';

export const circulationService = {
  getActiveLoans: async (): Promise<Loan[]> => {
    let res;
    try {
      res = await axiosInstance.get<ApiResponse<any[]>>('/circulation/loans?activeOnly=true');
    } catch {
      res = await axiosInstance.get<ApiResponse<any[]>>('/loans/active');
    }
    const rawList = res.data.data || [];
    return rawList.map((raw: any) => ({
      id: raw.id,
      bookId: raw.bookId || raw.bookCopyId || '',
      bookTitle: raw.bookTitle || 'Tài liệu thư viện',
      userId: raw.userId || raw.memberId || '',
      userName: raw.userName || raw.memberName || 'Độc giả',
      checkoutDate: raw.checkoutDate || raw.loanedAt || new Date().toISOString(),
      dueDate: raw.dueDate || raw.dueAt || new Date().toISOString(),
      returnDate: raw.returnDate || raw.returnedAt,
      status: raw.status || 'Active',
      tenantId: raw.tenantId || '',
      fineAmount: raw.fineAmount || 0,
      finePaid: raw.finePaid || false,
      finePaidAt: raw.finePaidAt,
      paymentMethod: raw.paymentMethod,
      coverUrl: raw.coverUrl,
      overdueDays: raw.overdueDays || 0
    }));
  },
  checkOut: async (data: CheckOutRequest): Promise<Loan> => {
    let res;
    try {
      res = await axiosInstance.post<ApiResponse<Loan>>('/circulation/loans', {
        memberId: data.userId,
        copyBarcode: data.copyId
      });
    } catch (primaryErr: any) {
      if (primaryErr?.response?.status === 404 || primaryErr?.response?.status === 501) {
        res = await axiosInstance.post<ApiResponse<Loan>>('/loans/check-out', data);
      } else {
        throw primaryErr;
      }
    }
    return res.data.data;
  },
  checkIn: async (data: CheckInRequest): Promise<CheckInResponse> => {
    try {
      const res = await axiosInstance.post<ApiResponse<any>>('/circulation/returns', {
        copyBarcode: data.copyId
      });
      return {
        loan: res.data.data,
        fine: res.data.data?.fineAmount || 0
      };
    } catch (primaryErr: any) {
      if (primaryErr?.response?.status === 404 || primaryErr?.response?.status === 501) {
        const fallbackRes = await axiosInstance.post<ApiResponse<CheckInResponse>>('/loans/check-in', data);
        return fallbackRes.data.data;
      }
      throw primaryErr;
    }
  },
  renew: async (loanId: string): Promise<Loan> => {
    let res;
    try {
      res = await axiosInstance.post<ApiResponse<Loan>>('/circulation/renewals', { loanId });
    } catch (primaryErr: any) {
      if (primaryErr?.response?.status === 404 || primaryErr?.response?.status === 501) {
        res = await axiosInstance.post<ApiResponse<Loan>>(`/member/loans/${loanId}/renew`);
      } else {
        throw primaryErr;
      }
    }
    return res.data.data;
  },
  createHold: async (data: { userId: string, bookId: string }): Promise<any> => {
    let res;
    try {
      res = await axiosInstance.post<ApiResponse<any>>('/member/holds', { bookId: data.bookId });
    } catch {
      res = await axiosInstance.post<ApiResponse<any>>('/holds', data);
    }
    return res.data.data;
  },
  getActiveHolds: async (): Promise<any[]> => {
    let res;
    try {
      res = await axiosInstance.get<ApiResponse<any[]>>('/circulation/holds');
    } catch {
      res = await axiosInstance.get<ApiResponse<any[]>>('/holds/active');
    }
    return res.data.data || [];
  },
  getReturnedUnpaidFines: async (): Promise<Loan[]> => {
    const res = await axiosInstance.get<ApiResponse<Loan[]>>('/loans/unpaid-fines');
    return res.data.data;
  },
  fulfillHold: async (holdId: string): Promise<any> => {
    let res;
    try {
      res = await axiosInstance.post<ApiResponse<any>>(`/circulation/holds/${holdId}/fulfill`);
    } catch {
      res = await axiosInstance.post<ApiResponse<any>>('/holds/fulfill', { holdId });
    }
    return res.data.data;
  },
  getAiInsight: async (data: AiCirculationInsightRequest): Promise<AiCirculationInsightResponse> => {
    const res = await axiosInstance.post<ApiResponse<AiCirculationInsightResponse>>('/ai/circulation-insight', data);
    return res.data.data;
  }
};

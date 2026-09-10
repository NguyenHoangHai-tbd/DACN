import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { InventorySession, Discrepancy, InventoryInsight } from '../types';

export const inventoryService = {
  getSessions: async (branchId?: string): Promise<InventorySession[]> => {
    const res = await axiosInstance.get<ApiResponse<InventorySession[]>>('/inventory/sessions', { params: { branchId } });
    return res.data.data;
  },
  
  createSession: async (data: { name: string; branchId: string; notes?: string }): Promise<InventorySession> => {
    const res = await axiosInstance.post<ApiResponse<InventorySession>>('/inventory/sessions', data);
    return res.data.data;
  },

  getSessionDetails: async (id: string): Promise<InventorySession> => {
    const res = await axiosInstance.get<ApiResponse<InventorySession>>(`/inventory/sessions/${id}`);
    return res.data.data;
  },
  
  scanBarcode: async (sessionId: string, barcode: string, condition?: string): Promise<{ success: boolean; message: string }> => {
    const res = await axiosInstance.post<ApiResponse<{ success: boolean; message: string }>>('/inventory/scan', { sessionId, barcode, condition });
    return res.data.data;
  },
  
  getDiscrepancies: async (sessionId: string): Promise<Discrepancy[]> => {
    const res = await axiosInstance.get<ApiResponse<Discrepancy[]>>(`/inventory/${sessionId}/discrepancies`);
    return res.data.data;
  },

  resolveDiscrepancy: async (id: string, resolution: string): Promise<Discrepancy> => {
    const res = await axiosInstance.post<ApiResponse<Discrepancy>>(`/inventory/discrepancies/${id}/resolve`, { resolution });
    return res.data.data;
  },
  
  closeSession: async (sessionId: string): Promise<InventorySession> => {
    const res = await axiosInstance.post<ApiResponse<InventorySession>>(`/inventory/sessions/${sessionId}/close`);
    return res.data.data;
  },
  
  getAiInsights: async (sessionId?: string): Promise<InventoryInsight> => {
    const res = await axiosInstance.get<ApiResponse<InventoryInsight>>('/ai/inventory-insights', { params: { sessionId } });
    return res.data.data;
  }
};

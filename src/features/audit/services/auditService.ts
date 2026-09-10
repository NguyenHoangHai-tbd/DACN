import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { AuditLog, AuditLogDetail, AuditInsight } from '../types';

export const auditService = {
  getLogs: async (params?: { startDate?: string; endDate?: string; entity?: string; action?: string; search?: string }): Promise<AuditLog[]> => {
    const res = await axiosInstance.get<ApiResponse<AuditLog[]>>('/audit-logs', { params });
    return res.data.data;
  },
  getLogDetail: async (id: string): Promise<AuditLogDetail> => {
    const res = await axiosInstance.get<ApiResponse<AuditLogDetail>>(`/audit-logs/${id}`);
    return res.data.data;
  },
  exportLogs: async (params?: any): Promise<{ url: string }> => {
    const res = await axiosInstance.post<ApiResponse<{ url: string }>>('/audit-logs/export', params);
    return res.data.data;
  },
  getAiInsight: async (params?: any): Promise<AuditInsight> => {
    const res = await axiosInstance.get<ApiResponse<AuditInsight>>('/ai/audit-insight', { params });
    return res.data.data;
  }
};

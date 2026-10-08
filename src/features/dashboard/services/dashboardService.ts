import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { DashboardOverview, DashboardInsight } from '../types';

export const dashboardService = {
  getOverview: async (timeRange: string = '30d'): Promise<DashboardOverview> => {
    const res = await axiosInstance.get<ApiResponse<DashboardOverview>>('/dashboard/overview', { params: { timeRange } });
    return res.data.data;
  },
  getAiInsights: async (timeRange: string = '30d'): Promise<DashboardInsight> => {
    const res = await axiosInstance.get<ApiResponse<DashboardInsight>>('/ai/dashboard-insights', { params: { timeRange } });
    return res.data.data;
  },
  exportReport: async (timeRange: string = '30d'): Promise<Blob> => {
    const res = await axiosInstance.post(
      '/reports/export',
      {
        datasetId: 'ds-circulation',
        filters: {
          dateRange: timeRange,
          branchId: null,
          groupBy: 'date',
        },
      },
      {
        responseType: 'blob',
      }
    );
    return res.data;
  }
};

import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { ReportDataset, ReportFilter, ReportPreview, ReportAiInsight } from '../types';

export const reportService = {
  getDatasets: async (): Promise<ReportDataset[]> => {
    const res = await axiosInstance.get<ApiResponse<ReportDataset[]>>('/reports/datasets');
    return res.data.data;
  },

  runReport: async (datasetId: string, filters: ReportFilter): Promise<ReportPreview> => {
    const res = await axiosInstance.post<ApiResponse<ReportPreview>>('/reports/run', { datasetId, filters });
    return res.data.data;
  },

  exportReport: async (datasetId: string, filters: ReportFilter, format: 'excel' | 'pdf' | 'csv'): Promise<{ jobId: string, message: string, url?: string }> => {
    const res = await axiosInstance.post<ApiResponse<{ jobId: string, message: string, url?: string }>>('/reports/export', { datasetId, filters, format });
    return res.data.data;
  },

  getReportInsights: async (datasetId: string, filters: ReportFilter): Promise<ReportAiInsight> => {
    const res = await axiosInstance.post<ApiResponse<ReportAiInsight>>('/ai/report-insights', { datasetId, filters });
    return res.data.data;
  }
};

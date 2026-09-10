import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { ImportJob, ColumnMapping, AiMappingSuggestion, ImportErrorRow } from '../types';

export const importService = {
  uploadFile: async (file: File, entityType: string): Promise<ImportJob> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    const res = await axiosInstance.post<ApiResponse<ImportJob>>('/imports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
  },

  getJobDetails: async (id: string): Promise<ImportJob> => {
    const res = await axiosInstance.get<ApiResponse<ImportJob>>(`/imports/${id}`);
    return res.data.data;
  },

  getAiMappingSuggestions: async (id: string): Promise<AiMappingSuggestion> => {
    const res = await axiosInstance.post<ApiResponse<AiMappingSuggestion>>(`/ai/imports/${id}/suggest-mapping`);
    return res.data.data;
  },
  
  saveMapping: async (id: string, mappings: ColumnMapping[]): Promise<{ success: boolean; job: ImportJob }> => {
    const res = await axiosInstance.post<ApiResponse<{ success: boolean; job: ImportJob }>>(`/imports/${id}/map`, { mappings });
    return res.data.data;
  },

  runImport: async (id: string): Promise<{ success: boolean }> => {
    const res = await axiosInstance.post<ApiResponse<{ success: boolean }>>(`/imports/${id}/run`);
    return res.data.data;
  },

  getErrors: async (id: string): Promise<ImportErrorRow[]> => {
    const res = await axiosInstance.get<ApiResponse<ImportErrorRow[]>>(`/imports/${id}/errors`);
    return res.data.data;
  }
};

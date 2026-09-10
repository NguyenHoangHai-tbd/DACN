import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { OcrResult } from '../types';

export const ocrService = {
  uploadImage: async (file: File): Promise<{ jobId: string, imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post<ApiResponse<{ jobId: string, imageUrl: string }>>('/ai/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
  },

  getResult: async (id: string): Promise<OcrResult> => {
    const res = await axiosInstance.get<ApiResponse<OcrResult>>(`/ai/ocr/${id}`);
    return res.data.data;
  },

  createBookFromOcr: async (data: Record<string, string>): Promise<boolean> => {
    const res = await axiosInstance.post<ApiResponse<boolean>>('/books/from-ocr', data);
    return res.data.data;
  }
};

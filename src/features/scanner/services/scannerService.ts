import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { ScanResult, PrintJob } from '../types';

export const scannerService = {
  resolveScan: async (code: string): Promise<ScanResult> => {
    const res = await axiosInstance.post<ApiResponse<ScanResult>>('/scan/resolve', { code });
    return res.data.data;
  },
  resolveFromImage: async (imageFile: File): Promise<ScanResult> => {
    // In reality this would be multipart/form-data
    // Mocking with base64 for preview simplicity
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const res = await axiosInstance.post<ApiResponse<ScanResult>>('/ai/scan-image', { image: reader.result });
        resolve(res.data.data);
      };
      reader.readAsDataURL(imageFile);
    });
  },
  generateCodes: async (itemIds: string[], type: 'Book' | 'Member'): Promise<PrintJob> => {
    const res = await axiosInstance.post<ApiResponse<PrintJob>>('/codes/generate', { itemIds, type });
    return res.data.data;
  },
  getMyQr: async (): Promise<{ code: string }> => {
    const res = await axiosInstance.get<ApiResponse<{ code: string }>>('/me/card-qr');
    return res.data.data;
  }
};

import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { LibraryPolicy, AiPolicyImpact } from '../types';

export const policyService = {
  getPolicy: async (): Promise<LibraryPolicy> => {
    const res = await axiosInstance.get<ApiResponse<LibraryPolicy>>('/policies/current');
    return res.data.data;
  },
  
  updatePolicy: async (data: Partial<LibraryPolicy>): Promise<LibraryPolicy> => {
    const res = await axiosInstance.put<ApiResponse<LibraryPolicy>>('/policies/current', data);
    return res.data.data;
  },

  previewImpact: async (data: Partial<LibraryPolicy>): Promise<AiPolicyImpact> => {
    const res = await axiosInstance.post<ApiResponse<AiPolicyImpact>>('/ai/policies/impact-preview', data);
    return res.data.data;
  }
};

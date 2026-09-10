import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { RecommendedBook, AllocationSuggestion } from '../types';

export const recommendationService = {
  getBookRecommendations: async (): Promise<RecommendedBook[]> => {
    const res = await axiosInstance.get<ApiResponse<RecommendedBook[]>>('/recommendations/books');
    return res.data.data;
  },

  getAllocationSuggestions: async (): Promise<AllocationSuggestion[]> => {
    const res = await axiosInstance.get<ApiResponse<AllocationSuggestion[]>>('/recommendations/branches');
    return res.data.data;
  },

  sendFeedback: async (id: string, isPositive: boolean): Promise<boolean> => {
    const res = await axiosInstance.post<ApiResponse<boolean>>('/recommendations/feedback', { id, isPositive });
    return res.data.data;
  }
};

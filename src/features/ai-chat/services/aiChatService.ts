import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { Conversation } from '../types';

export const aiChatService = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await axiosInstance.get<ApiResponse<Conversation[]>>('/ai/conversations');
    return res.data.data;
  },

  sendMessage: async (message: string, conversationId?: string): Promise<{ messageId: string, conversationId: string }> => {
    const res = await axiosInstance.post<ApiResponse<{ messageId: string, conversationId: string }>>('/ai/chat', { message, conversationId });
    return res.data.data;
  },

  sendFeedback: async (messageId: string, isPositive: boolean, reason?: string): Promise<boolean> => {
    const res = await axiosInstance.post<ApiResponse<boolean>>('/ai/feedback', { messageId, isPositive, reason });
    return res.data.data;
  }
};

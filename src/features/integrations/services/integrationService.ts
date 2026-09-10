import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { Integration, ApiKey, WebhookConfig, WebhookLog, AiLogAnalysis } from '../types';

export const integrationService = {
  getIntegrations: async (): Promise<Integration[]> => {
    const res = await axiosInstance.get<ApiResponse<Integration[]>>('/integrations');
    return res.data.data;
  },
  
  saveIntegration: async (integration: Partial<Integration>): Promise<Integration> => {
    const res = await axiosInstance.post<ApiResponse<Integration>>('/integrations', integration);
    return res.data.data;
  },

  getApiKeys: async (): Promise<ApiKey[]> => {
    const res = await axiosInstance.get<ApiResponse<ApiKey[]>>('/api-keys');
    return res.data.data;
  },

  createApiKey: async (name: string): Promise<{ key: string, newKey: ApiKey }> => {
    const res = await axiosInstance.post<ApiResponse<{ key: string, newKey: ApiKey }>>('/api-keys', { name });
    return res.data.data;
  },

  deleteApiKey: async (id: string): Promise<boolean> => {
    const res = await axiosInstance.delete<ApiResponse<boolean>>(`/api-keys/${id}`);
    return res.data.data;
  },

  getWebhooks: async (): Promise<WebhookConfig[]> => {
    const res = await axiosInstance.get<ApiResponse<WebhookConfig[]>>('/webhooks');
    return res.data.data;
  },

  saveWebhook: async (webhook: Partial<WebhookConfig>): Promise<WebhookConfig> => {
    const res = await axiosInstance.post<ApiResponse<WebhookConfig>>('/webhooks', webhook);
    return res.data.data;
  },

  testWebhook: async (id: string): Promise<boolean> => {
    const res = await axiosInstance.post<ApiResponse<boolean>>(`/webhooks/${id}/test`);
    return res.data.data;
  },

  getWebhookLogs: async (): Promise<WebhookLog[]> => {
    const res = await axiosInstance.get<ApiResponse<WebhookLog[]>>('/webhooks/logs');
    return res.data.data;
  },

  analyzeLog: async (logId: string): Promise<AiLogAnalysis> => {
    const res = await axiosInstance.post<ApiResponse<AiLogAnalysis>>('/ai/integrations/analyze', { logId });
    return res.data.data;
  }
};

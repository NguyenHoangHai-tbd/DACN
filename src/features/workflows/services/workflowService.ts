import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { WorkflowRule, WorkflowLog, AiWorkflowSuggestion } from '../types';

export const workflowService = {
  getRules: async (): Promise<WorkflowRule[]> => {
    const res = await axiosInstance.get<ApiResponse<WorkflowRule[]>>('/workflows');
    return res.data.data;
  },

  createRule: async (rule: Omit<WorkflowRule, 'id'>): Promise<WorkflowRule> => {
    const res = await axiosInstance.post<ApiResponse<WorkflowRule>>('/workflows', rule);
    return res.data.data;
  },

  updateRule: async (id: string, rule: Partial<WorkflowRule>): Promise<WorkflowRule> => {
    const res = await axiosInstance.put<ApiResponse<WorkflowRule>>(`/workflows/${id}`, rule);
    return res.data.data;
  },

  testRule: async (id: string): Promise<boolean> => {
    const res = await axiosInstance.post<ApiResponse<boolean>>('/workflows/test', { ruleId: id });
    return res.data.data;
  },

  getLogs: async (): Promise<WorkflowLog[]> => {
    const res = await axiosInstance.get<ApiResponse<WorkflowLog[]>>('/workflows/logs');
    return res.data.data;
  },

  getAiSuggestion: async (trigger: string, condition: string): Promise<AiWorkflowSuggestion> => {
    const res = await axiosInstance.post<ApiResponse<AiWorkflowSuggestion>>('/ai/workflows/suggest', { trigger, condition });
    return res.data.data;
  }
};

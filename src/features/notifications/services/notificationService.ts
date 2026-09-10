import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { AppNotification, NotificationTemplate, NotificationPreference } from '../types';

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    try {
      const res = await axiosInstance.get<ApiResponse<AppNotification[]>>('/notifications');
      return res.data.data || [];
    } catch {
      return [];
    }
  },
  markAsRead: async (id: string): Promise<void> => {
    await axiosInstance.put(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await axiosInstance.put(`/notifications/read-all`);
  },
  getPreferences: async (): Promise<NotificationPreference> => {
    const res = await axiosInstance.get<ApiResponse<NotificationPreference>>('/preferences/notifications');
    return res.data.data;
  },
  updatePreferences: async (data: NotificationPreference): Promise<NotificationPreference> => {
    const res = await axiosInstance.put<ApiResponse<NotificationPreference>>('/preferences/notifications', data);
    return res.data.data;
  },
  getTemplates: async (): Promise<NotificationTemplate[]> => {
    const res = await axiosInstance.get<ApiResponse<NotificationTemplate[]>>('/notifications/templates');
    return res.data.data;
  },
  saveTemplate: async (id: string | null, data: any): Promise<NotificationTemplate> => {
    const res = id 
      ? await axiosInstance.put<ApiResponse<NotificationTemplate>>(`/notifications/templates/${id}`, data)
      : await axiosInstance.post<ApiResponse<NotificationTemplate>>('/notifications/templates', data);
    return res.data.data;
  },
  generateAiTemplate: async (context: string, tone: string): Promise<{ subject: string, body: string }> => {
    const res = await axiosInstance.post<ApiResponse<{ subject: string, body: string }>>('/ai/generate-template', { context, tone });
    return res.data.data;
  }
};

import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { HealthMetric, AiOpsInsight, SyncQueueItem } from '../types';

export const monitoringService = {
  getHealth: async (): Promise<HealthMetric[]> => {
    const res = await axiosInstance.get<ApiResponse<HealthMetric[]>>('/admin/monitoring/health');
    return res.data.data;
  },
  
  getAiInsights: async (): Promise<AiOpsInsight[]> => {
    const res = await axiosInstance.get<ApiResponse<AiOpsInsight[]>>('/ai/monitoring/insights');
    return res.data.data;
  },

  getSyncQueue: async (): Promise<SyncQueueItem[]> => {
    // In a real app this would use IndexedDB or MMKV. Mocking with localStorage
    const q = localStorage.getItem('offline_queue');
    return q ? JSON.parse(q) : [];
  },

  addSyncItem: async (action: string, payload: any): Promise<void> => {
     const ext = await monitoringService.getSyncQueue();
     ext.push({
        id: `async-${Date.now()}`,
        action,
        payload,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'Pending'
     });
     localStorage.setItem('offline_queue', JSON.stringify(ext));
  },

  syncNow: async (): Promise<boolean> => {
    const q = await monitoringService.getSyncQueue();
    if (q.length === 0) return true;
    
    // Attempt to sync
    const res = await axiosInstance.post<ApiResponse<boolean>>('/sync', { items: q });
    if (res.data.success) {
       localStorage.setItem('offline_queue', '[]');
       return true;
    }
    return false;
  },

  clearQueue: async (): Promise<void> => {
     localStorage.setItem('offline_queue', '[]');
  }
};

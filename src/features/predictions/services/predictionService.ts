import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { ForecastPoint, RiskAlert, PredictionSummary } from '../types';

export const predictionService = {
  getSummary: async (): Promise<PredictionSummary> => {
    const res = await axiosInstance.get<ApiResponse<PredictionSummary>>('/ai/predictions/summary');
    return res.data.data;
  },

  getAlerts: async (): Promise<RiskAlert[]> => {
    const res = await axiosInstance.get<ApiResponse<RiskAlert[]>>('/ai/predictions/alerts');
    return res.data.data;
  },

  getForecast: async (type: string): Promise<ForecastPoint[]> => {
    const res = await axiosInstance.get<ApiResponse<ForecastPoint[]>>(`/ai/predictions/forecast?type=${type}`);
    return res.data.data;
  },

  runModel: async (): Promise<boolean> => {
    const res = await axiosInstance.post<ApiResponse<boolean>>('/ai/predictions/run', {});
    return res.data.data;
  }
};

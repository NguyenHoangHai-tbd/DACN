import { axiosInstance } from '../../../shared/api/axiosInstance';
import { AuthResponse, ApiResponse } from '../types';
import { LoginFormData, ChangePasswordFormData } from '../schemas';

export const authService = {
  async login(data: LoginFormData): Promise<AuthResponse> {
    const res = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data;
  },

  async logout(): Promise<void> {
    await axiosInstance.post('/auth/logout');
  },

  async changePassword(data: ChangePasswordFormData): Promise<void> {
    await axiosInstance.post('/auth/change-password', data);
  }
};

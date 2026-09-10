import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Tenant, User, Branch, AiRoleSuggestionRequest, AiRoleSuggestionResponse } from '../types';
import { ApiResponse } from '../../auth/types';

export const adminService = {
  getTenants: async (): Promise<Tenant[]> => {
    const res = await axiosInstance.get<ApiResponse<Tenant[]>>('/tenants');
    return res.data.data;
  },
  createTenant: async (data: { code: string; name: string; status: string; tenantAdmin?: string; librarian?: string }): Promise<Tenant> => {
    const res = await axiosInstance.post<ApiResponse<Tenant>>('/tenants', data);
    return res.data.data;
  },
  updateTenant: async (id: string, data: { name: string; status: string; tenantAdmin?: string; librarian?: string }): Promise<Tenant> => {
    const res = await axiosInstance.put<ApiResponse<Tenant>>(`/tenants/${id}`, data);
    return res.data.data;
  },
  updateTenantStatus: async (id: string, status: string): Promise<Tenant> => {
    const res = await axiosInstance.patch<ApiResponse<Tenant>>(`/tenants/${id}/status`, { status });
    return res.data.data;
  },
  getUsers: async (): Promise<User[]> => {
    const res = await axiosInstance.get<ApiResponse<User[]>>('/users');
    return res.data.data;
  },
  getBranches: async (): Promise<Branch[]> => {
    const res = await axiosInstance.get<ApiResponse<Branch[]>>('/branches');
    return res.data.data;
  },
  createBranch: async (data: { code: string; name: string }): Promise<Branch> => {
    const res = await axiosInstance.post<ApiResponse<Branch>>('/branches', data);
    return res.data.data;
  },
  updateBranch: async (id: string, data: { name: string; status: 'Active' | 'Inactive' }): Promise<Branch> => {
    const res = await axiosInstance.put<ApiResponse<Branch>>(`/branches/${id}`, data);
    return res.data.data;
  },
  updateBranchStatus: async (id: string, status: 'Active' | 'Inactive'): Promise<Branch> => {
    const res = await axiosInstance.patch<ApiResponse<Branch>>(`/branches/${id}/status`, { status });
    return res.data.data;
  },
  updateUser: async (id: string, data: { role: string; status: string }): Promise<User> => {
    const res = await axiosInstance.put<ApiResponse<User>>(`/users/${id}`, data);
    return res.data.data;
  },
  suggestRoles: async (data: AiRoleSuggestionRequest): Promise<AiRoleSuggestionResponse> => {
    const res = await axiosInstance.post<ApiResponse<AiRoleSuggestionResponse>>('/ai/suggest-roles', data);
    return res.data.data;
  }
};

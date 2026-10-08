import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Tenant, User, Branch, AiRoleSuggestionRequest, AiRoleSuggestionResponse } from '../types';
import { ApiResponse } from '../../auth/types';

export interface CreateTenantPayload {
  code: string;
  name: string;
  status: string;
}

export interface UpdateTenantPayload {
  key: string;
  name: string;
  plan?: string;
  defaultLocale?: string;
  primaryColor?: string;
  isActive: boolean;
}

export const adminService = {
  getTenants: async (): Promise<Tenant[]> => {
    const res = await axiosInstance.get<ApiResponse<any[]>>('/tenants');
    const items = res.data?.data || [];
    return items.map((item: any): Tenant => ({
      id: String(item.id || item.key),
      code: item.key || item.code || '',
      name: item.name || '',
      status: item.isActive !== undefined ? (item.isActive ? 'Active' : 'Inactive') : (item.status || 'Active'),
      createdAt: item.createdAt || new Date().toISOString(),
      plan: item.plan || 'Standard',
      defaultLocale: item.defaultLocale || 'vi',
      primaryColor: item.primaryColor || '#0d9488',
      totalBooks: item.totalBooks ?? 0,
      totalMembers: item.totalMembers ?? 0,
      activeLoans: item.activeLoans ?? 0,
      overdueLoans: item.overdueLoans ?? 0,
      tenantAdmin: item.tenantAdmin || '',
      librarian: item.librarian || '',
    } as Tenant));
  },

  createTenant: async (data: { code: string; name: string; status: string }): Promise<Tenant> => {
    const payload = {
      key: data.code,
      name: data.name,
      plan: 'Standard',
      defaultLocale: 'vi',
      isActive: data.status === 'Active',
    };
    const res = await axiosInstance.post<ApiResponse<any>>('/tenants', payload);
    const item = res.data?.data;
    if (!item) return payload as any;
    return {
      id: String(item.id || item.key),
      code: item.key || item.code || data.code,
      name: item.name || data.name,
      status: item.isActive !== undefined ? (item.isActive ? 'Active' : 'Inactive') : data.status,
      createdAt: item.createdAt || new Date().toISOString(),
      plan: item.plan || 'Standard',
      defaultLocale: item.defaultLocale || 'vi',
      primaryColor: item.primaryColor || '#0d9488',
      totalBooks: item.totalBooks ?? 0,
      totalMembers: item.totalMembers ?? 0,
      activeLoans: item.activeLoans ?? 0,
      overdueLoans: item.overdueLoans ?? 0,
      tenantAdmin: item.tenantAdmin || '',
      librarian: item.librarian || '',
    } as Tenant;
  },

  updateTenant: async (id: string, data: UpdateTenantPayload): Promise<Tenant> => {
    const payload = {
      key: data.key,
      name: data.name,
      plan: data.plan || 'Standard',
      defaultLocale: data.defaultLocale || 'vi',
      primaryColor: data.primaryColor || '#0d9488',
      isActive: data.isActive,
    };
    const res = await axiosInstance.put<ApiResponse<any>>(`/tenants/${id}`, payload);
    const item = res.data?.data;
    if (!item) return payload as any;
    return {
      id: String(item.id || item.key || id),
      code: item.key || item.code || data.key,
      name: item.name || data.name,
      status: item.isActive !== undefined ? (item.isActive ? 'Active' : 'Inactive') : (data.isActive ? 'Active' : 'Inactive'),
      createdAt: item.createdAt || new Date().toISOString(),
      plan: item.plan || data.plan || 'Standard',
      defaultLocale: item.defaultLocale || data.defaultLocale || 'vi',
      primaryColor: item.primaryColor || data.primaryColor || '#0d9488',
      totalBooks: item.totalBooks ?? 0,
      totalMembers: item.totalMembers ?? 0,
      activeLoans: item.activeLoans ?? 0,
      overdueLoans: item.overdueLoans ?? 0,
      tenantAdmin: item.tenantAdmin || '',
      librarian: item.librarian || '',
    } as Tenant;
  },

  updateTenantStatus: async (
    id: string,
    tenant: { key: string; name: string; plan?: string; defaultLocale?: string; primaryColor?: string },
    isActive: boolean
  ): Promise<Tenant> => {
    return adminService.updateTenant(id, {
      key: tenant.key,
      name: tenant.name,
      plan: tenant.plan || 'Standard',
      defaultLocale: tenant.defaultLocale || 'vi',
      primaryColor: tenant.primaryColor || '#0d9488',
      isActive,
    });
  },

  deleteTenant: async (id: string): Promise<void> => {
    await axiosInstance.delete<ApiResponse<any>>(`/tenants/${id}`);
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

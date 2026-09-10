import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { Member, MemberHistory, MemberInsight } from '../types';

export const memberService = {
  getMembers: async (search?: string): Promise<Member[]> => {
    const res = await axiosInstance.get<ApiResponse<Member[]>>('/members', { params: { search } });
    return res.data.data;
  },
  getMember: async (id: string): Promise<Member> => {
    const res = await axiosInstance.get<ApiResponse<Member>>(`/members/${id}`);
    return res.data.data;
  },
  createMember: async (data: any): Promise<Member> => {
    const res = await axiosInstance.post<ApiResponse<Member>>('/members', data);
    return res.data.data;
  },
  updateMember: async (id: string, data: any): Promise<Member> => {
    const res = await axiosInstance.put<ApiResponse<Member>>(`/members/${id}`, data);
    return res.data.data;
  },
  getMemberHistory: async (id: string): Promise<MemberHistory[]> => {
    const res = await axiosInstance.get<ApiResponse<MemberHistory[]>>(`/members/${id}/history`);
    return res.data.data;
  },
  getAiInsights: async (id: string): Promise<MemberInsight> => {
    const res = await axiosInstance.get<ApiResponse<MemberInsight>>(`/members/${id}/insights`);
    return res.data.data;
  }
};

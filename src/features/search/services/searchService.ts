import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Book } from '../../books/types';
import { AiSearchResult, BookSearchFilters } from '../types';
import { ApiResponse } from '../../auth/types';

export const searchService = {
  searchBooks: async (params: BookSearchFilters): Promise<Book[]> => {
    const res = await axiosInstance.get<ApiResponse<Book[]>>('/books/search', { params });
    return res.data.data;
  },
  aiSearch: async (query: string): Promise<AiSearchResult[]> => {
    const res = await axiosInstance.post<ApiResponse<AiSearchResult[]>>('/ai/search', { query });
    return res.data.data;
  },
  requestHold: async (bookId: string): Promise<any> => {
    const res = await axiosInstance.post<ApiResponse<any>>('/member/holds', { bookId });
    return res.data.data;
  }
};

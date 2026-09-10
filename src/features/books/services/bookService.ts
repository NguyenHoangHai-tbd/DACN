import { axiosInstance } from '../../../shared/api/axiosInstance';
import { Book, AiEnrichBookRequest, AiEnrichBookResponse } from '../types';
import { BookFormData } from '../schemas';
import { ApiResponse } from '../../auth/types';

export const bookService = {
  getBooks: async (): Promise<Book[]> => {
    const res = await axiosInstance.get<ApiResponse<Book[]>>('/books');
    return res.data.data;
  },
  createBook: async (data: BookFormData): Promise<Book> => {
    const res = await axiosInstance.post<ApiResponse<Book>>('/books', data);
    return res.data.data;
  },
  updateBook: async (id: string, data: Partial<BookFormData>): Promise<Book> => {
    const res = await axiosInstance.put<ApiResponse<Book>>(`/books/${id}`, data);
    return res.data.data;
  },
  deleteBook: async (id: string): Promise<void> => {
    await axiosInstance.delete<ApiResponse<any>>(`/books/${id}`);
  },
  aiEnrichBook: async (data: AiEnrichBookRequest): Promise<AiEnrichBookResponse> => {
    const res = await axiosInstance.post<ApiResponse<AiEnrichBookResponse>>('/ai/enrich-book', data);
    return res.data.data;
  }
};

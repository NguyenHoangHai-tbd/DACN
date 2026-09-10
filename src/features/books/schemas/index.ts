import { z } from 'zod';

export const bookSchema = z.object({
  isbn: z.string().min(1, 'Mã ISBN/Sách không được phép để trống'),
  title: z.string().min(1, 'Tên sách không được phép để trống'),
  author: z.string().min(1, 'Tác giả không được phép để trống'),
  category: z.string().min(1, 'Thể loại không được phép để trống'),
  publisher: z.string().optional(),
  shelf: z.string().optional(),
  copies: z.coerce.number({ message: 'Vui lòng nhập số lượng hợp lệ' }).min(0, 'Tổng số bản không được phép < 0'),
  availableCopies: z.coerce.number({ message: 'Vui lòng nhập số lượng hợp lệ' }).min(0, 'Số bản khả dụng không được phép < 0'),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  barcode: z.string().optional()
}).refine(data => data.availableCopies <= data.copies, {
  message: "Số bản khả dụng không được lớn hơn tổng số bản",
  path: ["availableCopies"]
});

export type BookFormData = z.infer<typeof bookSchema>;

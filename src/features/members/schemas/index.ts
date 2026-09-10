import { z } from 'zod';

export const memberSchema = z.object({
  memberCode: z.string().min(1, 'Mã thẻ độc giả không được để trống'),
  fullName: z.string().min(1, 'Họ tên độc giả không được để trống'),
  email: z.string().email('Địa chỉ email không đúng định dạng').optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9+()#&.\s-]*$/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  memberType: z.enum(['Student', 'Teacher', 'Staff', 'External']),
  status: z.enum(['Active', 'Inactive', 'Suspended']),
  expiryDate: z.string().min(1, 'Vui lòng nhập ngày hết hạn thẻ')
});

export type MemberFormData = z.infer<typeof memberSchema>;

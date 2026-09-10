import { z } from 'zod';

export const checkOutSchema = z.object({
  userId: z.string().min(1, 'Mã độc giả không được để trống'),
  copyId: z.string().min(1, 'Mã sách/bản sao không được để trống')
});

export type CheckOutFormData = z.infer<typeof checkOutSchema>;

export const checkInSchema = z.object({
  userId: z.string().optional(),
  copyId: z.string().min(1, 'Mã sách hoặc mã phiếu mượn cần trả không được để trống')
});

export type CheckInFormData = z.infer<typeof checkInSchema>;

import { z } from 'zod';

export const templateSchema = z.object({
  code: z.string().min(1, 'Mã template (Code) là bắt buộc'),
  name: z.string().min(1, 'Tên template là bắt buộc'),
  subjectTemplate: z.string().min(1, 'Tiêu đề là bắt buộc'),
  bodyTemplate: z.string().min(1, 'Nội dung thông báo là bắt buộc'),
  channels: z.array(z.string()).min(1, 'Chọn ít nhất 1 kênh nhận thông báo')
});

export type TemplateFormData = z.infer<typeof templateSchema>;

export const preferenceSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  inApp: z.boolean(),
  reminderDays: z.number().min(1).max(7)
});

export type PreferenceFormData = z.infer<typeof preferenceSchema>;

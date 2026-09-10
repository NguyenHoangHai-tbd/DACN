import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'common.validation.required'),
  password: z.string().min(1, 'common.validation.required'),
  tenantCode: z.string().min(1, 'common.validation.required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'common.validation.required'),
  newPassword: z.string().min(8, 'common.validation.min_length'),
  confirmPassword: z.string().min(1, 'common.validation.required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "auth.password.mismatch",
  path: ["confirmPassword"],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { changePasswordSchema, ChangePasswordFormData } from '../schemas';
import { authService } from '../services/authService';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChangePasswordProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordProps> = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();

  const { register, handleSubmit, formState: { errors } } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const mutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      toast.success(t('auth.password.change_success'));
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Mật khẩu hiện tại không đúng hoặc đã xảy ra lỗi. Vui lòng thử lại.'));
    }
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="currentPassword" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
          {t('auth.password.current_password')}
        </Label>
        <Input 
          id="currentPassword" 
          type="password"
          {...register('currentPassword')} 
          className={`w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all ${errors.currentPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        {errors.currentPassword && (
          <p className="text-xs text-red-500 font-medium">{t(errors.currentPassword.message as string)}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="newPassword" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
          {t('auth.password.new_password')}
        </Label>
        <Input 
          id="newPassword" 
          type="password"
          {...register('newPassword')} 
          className={`w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all ${errors.newPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        {errors.newPassword && (
          <p className="text-xs text-red-500 font-medium">
            {t('common.validation.min_length', { length: 8 })}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
          {t('auth.password.confirm_password')}
        </Label>
        <Input 
          id="confirmPassword" 
          type="password"
          {...register('confirmPassword')} 
          className={`w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 font-medium">{t(errors.confirmPassword.message as string)}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" className="h-11 rounded-xl font-bold text-sm" onClick={onCancel} disabled={mutation.isPending}>
            {t('common.button.cancel')}
          </Button>
        )}
        <Button type="submit" className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('common.button.save')}
        </Button>
      </div>
    </form>
  );
}

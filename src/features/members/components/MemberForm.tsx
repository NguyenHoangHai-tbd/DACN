import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memberSchema, MemberFormData } from '../schemas';
import { memberService } from '../services/memberService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

interface MemberFormProps {
  onSuccess: () => void;
  initialData?: any;
}

export const MemberForm: React.FC<MemberFormProps> = ({ onSuccess, initialData }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: initialData || {
      memberCode: '',
      fullName: '',
      email: '',
      phone: '',
      memberType: 'Student',
      status: 'Active',
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    }
  });

  const memberType = watch('memberType');
  const status = watch('status');

  const mutation = useMutation({
    mutationFn: initialData ? (data: any) => memberService.updateMember(initialData.id, data) : memberService.createMember,
    onSuccess: () => {
      toast.success(initialData ? t('member.toast_update_success', 'Cập nhật thông tin thành công') : t('member.toast_create_success', 'Thêm độc giả thành công'));
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (initialData) queryClient.invalidateQueries({ queryKey: ['member', initialData.id] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, initialData ? 'Cập nhật thông tin độc giả không thành công.' : 'Thêm độc giả mới không thành công.'));
    }
  });

  const onSubmit = (data: MemberFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="memberCode">{t('member.form_code', 'Mã thẻ độc giả*')}</Label>
          <Input id="memberCode" {...register('memberCode')} className={errors.memberCode ? 'border-red-500' : ''} />
          {errors.memberCode && <p className="text-red-500 text-xs">{errors.memberCode.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fullName">{t('member.form_name', 'Họ tên*')}</Label>
          <Input id="fullName" {...register('fullName')} className={errors.fullName ? 'border-red-500' : ''} />
          {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">{t('member.form_email', 'Email')}</Label>
          <Input id="email" type="email" {...register('email')} className={errors.email ? 'border-red-500' : ''} />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">{t('member.form_phone', 'Số điện thoại')}</Label>
          <Input id="phone" {...register('phone')} className={errors.phone ? 'border-red-500' : ''} />
          {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t('member.form_type', 'Loại độc giả*')}</Label>
          <Select value={memberType} onValueChange={(value) => setValue('memberType', value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Student">{t('member.type_student', 'Học sinh / Sinh viên')}</SelectItem>
              <SelectItem value="Teacher">{t('member.type_teacher', 'Giáo viên / Giảng viên')}</SelectItem>
              <SelectItem value="Staff">{t('member.type_staff', 'Nhân viên')}</SelectItem>
              <SelectItem value="External">{t('member.type_external', 'Khách ngoài')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('member.form_status', 'Trạng thái*')}</Label>
          <Select value={status} onValueChange={(value) => setValue('status', value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">{t('member.status_active', 'Hoạt động')}</SelectItem>
              <SelectItem value="Inactive">{t('member.status_inactive', 'Ngừng hoạt động')}</SelectItem>
              <SelectItem value="Suspended">{t('member.status_suspended', 'Bị khóa / Đình chỉ')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="expiryDate">{t('member.form_expiry', 'Ngày hết hạn*')}</Label>
          <Input id="expiryDate" type="date" {...register('expiryDate')} className={errors.expiryDate ? 'border-red-500 w-full sm:max-w-[200px]' : 'w-full sm:max-w-[200px]'} />
          {errors.expiryDate && <p className="text-red-500 text-xs">{errors.expiryDate.message}</p>}
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onSuccess} 
          className="mr-2"
        >
          {t('common.button.cancel', 'Hủy')}
        </Button>
        <Button type="submit" disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? t('common.button.update', 'Cập nhật') : t('common.button.add', 'Thêm mới')}
        </Button>
      </div>
    </form>
  );
};

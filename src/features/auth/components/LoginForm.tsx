import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Building, User, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';

import { loginSchema, LoginFormData } from '../schemas';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useRoleStore } from '../../../shared/store/roleStore';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const normalizeUiRole = (apiRole?: string): string => {
  if (apiRole === 'SuperAdmin') return 'super_admin';
  if (apiRole === 'TenantAdmin') return 'tenant_admin';
  if (apiRole === 'Librarian') return 'librarian';
  if (apiRole === 'Member') return 'member';
  return 'member'; // Fallback on invalid role
};

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setAuth = useAuthStore(state => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantCode: 'hq',
      username: '',
      password: '',
    }
  });

  const getFriendlyRoleLabel = (r: string) => {
    if (r === 'SuperAdmin') return 'Super Admin - Quản trị hệ thống';
    if (r === 'TenantAdmin') return 'Tenant Admin - Admin thư viện';
    if (r === 'Librarian') return 'Librarian - Thủ thư';
    if (r === 'Member') return 'Member - Độc giả';
    return r;
  };

  const mutation = useMutation({
    mutationFn: (data: LoginFormData) => {
      const apiData = { ...data };
      if (apiData.tenantCode === 'global') {
        apiData.tenantCode = 'hq'; // Map 'global' System view to default 'hq' (tenant-1) in backend
      }
      return authService.login(apiData);
    },
    onSuccess: (data, variables) => {
      const apiRole = data.user.roles?.[0] || (data.user as any).role;
      const uiRole = normalizeUiRole(apiRole);
      
      // Store 'global' as selected scope for superadmin, otherwise use submitted scope
      const storedTenantCode = uiRole === 'super_admin' ? 'global' : variables.tenantCode;
      setAuth(data.accessToken, data.refreshToken, data.user, storedTenantCode);
      
      useRoleStore.getState().setRole(uiRole);
      
      // If AI detects a risk on login
      if (data.riskAlert) {
        toast.warning(data.riskAlert, { duration: 8000 });
      } else {
        const primaryRole = apiRole || '';
        toast.success(`Đăng nhập thành công với vai trò: ${getFriendlyRoleLabel(primaryRole)}`);
      }
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Không thể đăng nhập. Tên đăng nhập hoặc mật khẩu không chính xác.'));
    }
  });

  const onSubmit = (data: LoginFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 text-slate-900 antialiased selection:bg-teal-600 selection:text-white">
      <div className="w-full max-w-[440px] bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/80 p-6 sm:p-8 space-y-6">
        {/* Top bar: Back to Home */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors cursor-pointer group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-teal-600" />
            <span>Về trang chủ</span>
          </button>
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Cổng Xác Thực
          </span>
        </div>

        {/* Brand Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <img
              src="https://lms.tbd.edu.vn/pluginfile.php/1/theme_edumy/headerlogo2/1786323723/logo-TBD-VI.png"
              alt="Đại học Thái Bình Dương"
              className="h-9 sm:h-10 object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="h-5 w-px bg-slate-200" />
            <span className="text-sm sm:text-base font-bold tracking-wider text-teal-600 uppercase">
              THƯ VIỆN SỐ
            </span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              Đăng nhập hệ thống
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              Cổng thông tin &amp; học liệu số Trường Đại học Thái Bình Dương (TBD)
            </p>
          </div>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {mutation.isError && (
            <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
              <AlertDescription>
                {parseFriendlyError(mutation.error, 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.')}
              </AlertDescription>
            </Alert>
          )}

          {/* 1. Phạm vi đăng nhập */}
          <div className="space-y-1.5">
            <Label htmlFor="tenantCode" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Phạm vi đăng nhập
            </Label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <select 
                id="tenantCode" 
                {...register('tenantCode')} 
                className="w-full h-11 px-3 pl-10 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm font-medium text-slate-900 transition-all cursor-pointer"
              >
                <option value="global">Hệ thống tổng</option>
                <option value="hq">Hà Nội HQ</option>
                <option value="lib-hcm">Thư viện TP.HCM</option>
              </select>
            </div>
            {errors.tenantCode && (
              <p className="text-xs text-rose-600 font-medium">
                {t(errors.tenantCode.message || '', 'Vui lòng chọn phạm vi đăng nhập')}
              </p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              Super Admin dùng Hệ thống tổng. Các tài khoản còn lại dùng thư viện/khu vực được phân công.
            </p>
          </div>

          {/* 2. Tên đăng nhập / Mã thẻ */}
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Tên đăng nhập / Mã thẻ
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <Input 
                id="username" 
                {...register('username')} 
                className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm" 
                placeholder="Nhập tên đăng nhập hoặc mã thẻ"
                autoComplete="username"
              />
            </div>
            {errors.username && (
              <p className="text-xs text-rose-600 font-medium">
                {t(errors.username.message || '', 'Vui lòng nhập tên đăng nhập hoặc mã thẻ')}
              </p>
            )}
          </div>

          {/* 3. Mật khẩu */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Mật khẩu
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <Input 
                id="password" 
                type={showPassword ? 'text' : 'password'} 
                {...register('password')} 
                className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm" 
                placeholder="••••••••" 
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-600 font-medium">
                {t(errors.password.message || '', 'Vui lòng nhập mật khẩu')}
              </p>
            )}
          </div>

          {/* 4. Nút đăng nhập */}
          <Button 
            type="submit" 
            className="w-full h-11 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-teal-950/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 text-sm mt-2" 
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

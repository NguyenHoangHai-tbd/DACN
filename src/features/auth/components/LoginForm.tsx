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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-900 antialiased selection:bg-teal-600 selection:text-white">
      <div className="w-full max-w-4xl lg:max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Cột 1: Khối trực quan thương hiệu TBD (Chiếm 5/12 cột bên trái, ẩn trên mobile) */}
        <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-8 xl:p-10 overflow-hidden text-white">
          {/* Nền ảnh trường TBD + lớp gradient tối */}
          <img
            src="https://lms.tbd.edu.vn/pluginfile.php/27963/block_cocoon_slider_8/slides/1/httpstbd.edu.vnwp-contentuploads202008TBD-m%25E1%25BB%259Bi-1.jpg"
            alt="Đại học Thái Bình Dương"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-teal-950/80" />

          {/* Nội dung bên trên */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-teal-300 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Đại học Thái Bình Dương (TBD)</span>
            </div>

            <div className="space-y-3">
              <img
                src="https://lms.tbd.edu.vn/pluginfile.php/1/theme_edumy/headerlogo1/1786323723/logo-TBD-white%20%282%29.png"
                alt="Logo Đại học Thái Bình Dương"
                className="h-11 w-auto object-contain drop-shadow"
                referrerPolicy="no-referrer"
              />
              <h2 className="text-2xl xl:text-3xl font-black tracking-tight text-white uppercase">
                CỔNG THƯ VIỆN SỐ
              </h2>
            </div>
          </div>

          {/* Slogan & chú thích bên dưới */}
          <div className="relative z-10 space-y-3 pt-6 border-t border-white/15">
            <p className="text-sm xl:text-base text-slate-200 leading-relaxed font-medium">
              “Khơi nguồn tri thức – Nuôi dưỡng đam mê nghiên cứu và sáng tạo tại Đại học Thái Bình Dương.”
            </p>
            <p className="text-xs text-slate-400">
              Hệ thống Quản lý Thư viện Số &amp; Học liệu Thông minh
            </p>
          </div>
        </div>

        {/* Cột 2: Form Đăng Nhập Chính (Chiếm 7/12 cột bên phải) */}
        <div className="col-span-1 lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Góc trên cùng: Nút Về trang chủ & Huy hiệu */}
            <div className="flex items-center justify-between pb-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors cursor-pointer group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-teal-600" />
                <span>Về trang chủ</span>
              </button>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Cổng Xác Thực
              </span>
            </div>

            {/* Tiêu đề form & lời dẫn ngắn */}
            <div className="space-y-1.5 mb-6">
              <div className="flex lg:hidden items-center gap-2 mb-3">
                <img
                  src="https://lms.tbd.edu.vn/pluginfile.php/1/theme_edumy/headerlogo2/1786323723/logo-TBD-VI.png"
                  alt="Đại học Thái Bình Dương"
                  className="h-8 object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold tracking-wider text-teal-600 uppercase">
                  THƯ VIỆN SỐ
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Đăng nhập hệ thống
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Cổng thông tin &amp; học liệu số Trường Đại học Thái Bình Dương (TBD)
              </p>
            </div>

            {/* Form đăng nhập */}
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
                className="w-full h-11 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-teal-950/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 text-sm mt-3" 
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

          <div className="pt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Trường Đại học Thái Bình Dương (TBD). All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

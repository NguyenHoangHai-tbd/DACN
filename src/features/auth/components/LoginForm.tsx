import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookMarked, Eye, EyeOff, Loader2, Building, User, Lock, Zap, ArrowLeft } from 'lucide-react';

import { loginSchema, LoginFormData } from '../schemas';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useRoleStore } from '../../../shared/store/roleStore';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantCode: 'hq',
      username: '',
      password: '',
    }
  });

  const fillAndSubmit = (tenant: string, user: string, pass: string) => {
    setValue('tenantCode', tenant);
    setValue('username', user);
    setValue('password', pass);
    handleSubmit(onSubmit)();
  };

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-[960px] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Column: Login Form */}
        <div className="p-6 lg:p-8 space-y-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors group cursor-pointer"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Về trang chủ Thư viện TBD</span>
          </button>

          <header className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">Hệ thống quản lý thư viện</h1>
            <p className="text-slate-500">Đăng nhập để sử dụng hệ thống demo</p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mutation.isError && (
              <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                <AlertDescription>
                  {parseFriendlyError(mutation.error, 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.')}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="tenantCode" className="text-xs font-bold text-slate-600 uppercase tracking-wide">Phạm vi đăng nhập</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 text-slate-400" size={18} />
                <select 
                  id="tenantCode" 
                  {...register('tenantCode')} 
                  className="w-full h-11 px-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all cursor-pointer"
                >
                  <option value="global">Hệ thống tổng</option>
                  <option value="hq">Hà Nội HQ</option>
                  <option value="lib-hcm">Thư viện TP.HCM</option>
                </select>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed italic">
                Super Admin dùng Hệ thống tổng. Các tài khoản còn lại dùng thư viện/khu vực được phân công.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-bold text-slate-600 uppercase tracking-wide">Tên đăng nhập / Mã thẻ</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <Input id="username" {...register('username')} className="pl-10 h-11" placeholder="admin" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <Input id="password" type="password" {...register('password')} className="pl-10 h-11" placeholder="••••••••" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
              <Label htmlFor="remember" className="text-sm font-medium cursor-pointer">Duy trì đăng nhập</Label>
            </div>

            <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" size={20} /> : 'Đăng nhập'}
            </Button>
          </form>
        </div>

        {/* Right Column: Quick Demo Login */}
        <div className="bg-slate-50 p-6 lg:p-8 border-l border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Zap size={14} />
            <span>Đăng nhập thử nghiệm nhanh</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { username: 'superadmin', password: 'password', label: '👑 Tài khoản superadmin', tenant: 'global' },
              { username: 'admin', password: 'password', label: '🏛️ Tài khoản admin', tenant: 'hq' },
              { username: 'librarian', password: 'password', label: '📚 Tài khoản librarian', tenant: 'hq' },
              { username: 'U002', password: 'password', label: '👤 Tài khoản U002', tenant: 'hq' },
            ].map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => fillAndSubmit(acc.tenant, acc.username, acc.password)}
                className="p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl transition-all text-left flex flex-col gap-0.5"
              >
                <span className="text-xs font-bold text-slate-800">{acc.label}</span>
                <span className="text-[10px] text-slate-500 font-mono">{acc.username} / {acc.password}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

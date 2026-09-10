import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useRoleStore } from '../store/roleStore';
import { authService } from '../../features/auth/services/authService';
import { toast } from 'sonner';
import { ChevronDown, Loader2, Users } from 'lucide-react';

const accounts = [
  {
    id: 'superadmin',
    label: '👑 Super Admin',
    username: 'superadmin',
    password: 'password',
    tenantCode: 'global',
    subtext: 'superadmin / password',
  },
  {
    id: 'admin',
    label: '🏛️ Admin thư viện',
    username: 'admin',
    password: 'password',
    tenantCode: 'hq',
    subtext: 'admin / password',
  },
  {
    id: 'librarian',
    label: '📚 Thủ thư',
    username: 'librarian',
    password: 'password',
    tenantCode: 'hq',
    subtext: 'librarian / password',
  },
  {
    id: 'member',
    label: '👤 Độc giả',
    username: 'U002',
    password: 'password',
    tenantCode: 'hq',
    subtext: 'U002 / password',
  },
];

const normalizeUiRole = (apiRole?: string): string => {
  if (apiRole === 'SuperAdmin') return 'super_admin';
  if (apiRole === 'TenantAdmin') return 'tenant_admin';
  if (apiRole === 'Librarian') return 'librarian';
  if (apiRole === 'Member') return 'member';
  return 'member';
};

export const QuickDemoAccountSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { user, setAuth } = useAuthStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (acc: typeof accounts[0]) => {
    if (isLoading) return;
    setIsLoading(acc.id);
    try {
      const data = await authService.login({
        tenantCode: acc.tenantCode === 'global' ? 'hq' : acc.tenantCode,
        username: acc.username,
        password: acc.password,
      });

      // Update auth store
      setAuth(data.accessToken, data.refreshToken, data.user, acc.tenantCode);

      // Map role and update role store
      const apiRole = data.user.roles?.[0] || (data.user as any).role;
      const uiRole = normalizeUiRole(apiRole);
      useRoleStore.getState().setRole(uiRole);

      toast.success(`Đã chuyển sang tài khoản ${acc.username}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Demo account switch error:', error);
      toast.error('Không thể chuyển tài khoản demo');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer select-none"
      >
        <Users size={14} className="text-indigo-600 shrink-0" />
        <span className="hidden sm:inline">Chuyển tài khoản demo</span>
        <span className="sm:hidden">Switch</span>
        <ChevronDown size={12} className={`text-indigo-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demo Quick Switch</p>
          </div>
          <div className="p-1 space-y-0.5">
            {accounts.map((acc) => {
              const isCurrent = user?.username === acc.username;
              return (
                <button
                  key={acc.id}
                  onClick={() => handleSwitch(acc)}
                  disabled={isLoading !== null}
                  className={`w-full flex flex-col text-left px-3 py-2 rounded-lg text-xs transition-colors relative cursor-pointer disabled:opacity-50 ${
                    isCurrent 
                      ? 'bg-indigo-50/70 text-indigo-900 border-l-2 border-indigo-500 rounded-l-none' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold">{acc.label}</span>
                    {isLoading === acc.id && (
                      <Loader2 size={12} className="text-indigo-500 animate-spin" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">{acc.subtext}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

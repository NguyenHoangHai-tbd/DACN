import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AiRoleSuggestion: React.FC = () => {
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: () => adminService.suggestRoles({ libraryType: 'standard' }),
  });

  const getFriendlyRoleLabel = (role: string) => {
    if (role === 'SuperAdmin') return 'Super Admin - Quản trị hệ thống';
    if (role === 'TenantAdmin') return 'Tenant Admin - Admin thư viện';
    if (role === 'Librarian') return 'Librarian - Thủ thư';
    if (role === 'Member') return 'Member - Độc giả';
    return role;
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col gap-4">
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <Sparkles size={80} strokeWidth={1} />
      </div>
      <div className="flex items-center gap-2 relative z-10">
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">AI gợi ý phân quyền</span>
      </div>
      
      <div className="relative z-10 space-y-1">
        <h3 className="text-lg font-semibold leading-tight">Gợi ý mô hình 4 vai trò</h3>
        <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
          AI hỗ trợ giải thích mô hình phân quyền gọn cho hệ thống quản lý thư viện.
        </p>
      </div>

      <div className="relative z-10 flex gap-2">
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg w-full sm:w-auto"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Tạo gợi ý
        </Button>
      </div>

      {mutation.isSuccess && mutation.data && (
        <div className="relative z-10 bg-indigo-500/20 rounded-xl p-4 border border-indigo-400/30 mt-2 space-y-3">
          <p className="text-xs text-indigo-100 font-medium leading-relaxed">{mutation.data.suggestion}</p>
          <div className="flex flex-wrap gap-2">
            {mutation.data.roles.map(r => (
              <Badge key={r} variant="outline" className="text-indigo-200 border-indigo-400/50 bg-indigo-900/50 text-[10px] uppercase font-mono">
                {getFriendlyRoleLabel(r)}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {mutation.isError && (
        <div className="relative z-10 text-xs text-red-300 bg-red-900/30 p-3 rounded-xl border border-red-900/50">
          Không thể tạo gợi ý AI, vui lòng thử lại
        </div>
      )}
    </div>
  );
};

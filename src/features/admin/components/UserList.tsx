import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Users, Shield, Edit2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { User } from '../types';
import { useRoleStore } from '../../../shared/store/roleStore';
import { useAuthStore } from '../../auth/store/authStore';

const getFriendlyRoleLabel = (role: string) => {
  if (role === 'SuperAdmin') return 'Super Admin - Quản trị hệ thống';
  if (role === 'TenantAdmin') return 'Tenant Admin - Admin thư viện';
  if (role === 'Librarian') return 'Librarian - Thủ thư';
  if (role === 'Member') return 'Member - Độc giả';
  return role;
};

const getRoleBadgeStyle = (role: string) => {
  if (role === 'SuperAdmin') return 'text-purple-700 bg-purple-50 border-purple-200';
  if (role === 'TenantAdmin') return 'text-sky-700 bg-sky-50 border-sky-200';
  if (role === 'Librarian') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (role === 'Member') return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-slate-700 bg-slate-50 border-slate-200';
};

export const UserList: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const hasUserManage = useRoleStore(state => state.hasPermission('user.manage'));
  const currentRole = useRoleStore(state => state.currentRole);
  const { user: currentUser } = useAuthStore();

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: adminService.getUsers,
    enabled: hasUserManage
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role: string; status: string } }) =>
      adminService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['members'] }); // Keep members in sync
      toast.success('Cập nhật phân quyền thành công');
      setIsOpen(false);
    },
    onError: (error: any) => {
      const serverMessage = error?.response?.data?.message;
      if (serverMessage === 'Bạn không có quyền phân quyền tài khoản này' || error?.response?.status === 403) {
        toast.error(t('admin.user.no_permission', 'Bạn không có quyền phân quyền tài khoản này'));
      } else if (serverMessage === 'Vai trò không hợp lệ' || error?.response?.status === 400) {
        toast.error(t('admin.user.invalid_role', 'Vai trò không hợp lệ'));
      } else {
        toast.error(t('admin.user.update_failed', 'Cập nhật phân quyền thất bại!'));
      }
    }
  });

  const handleEditClick = (user: User) => {
    // Double check constraints
    const isEditable = !(currentRole === 'tenant_admin' && (user.role === 'SuperAdmin' || user.role === 'TenantAdmin'));
    if (!isEditable) {
      toast.error(t('admin.user.cannot_edit_role', 'Bạn không có quyền sửa tài khoản quản trị viên này'));
      return;
    }
    
    setSelectedUser(user);
    setRole(user.role);
    setStatus(user.status);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!selectedUser) return;
    updateMutation.mutate({
      id: selectedUser.id,
      data: { role, status }
    });
  };

  if (!hasUserManage) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl text-red-600 font-semibold shadow-sm">
        Bạn không có quyền truy cập chức năng này
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-red-500 bg-red-50 rounded-xl border border-red-100">{t('common.state.error')}</div>;
  }

  if (!users || users.length === 0) {
    return <div className="p-8 text-center text-slate-500">{t('common.state.empty')}</div>;
  }

  const availableRolesForSelection = currentRole === 'super_admin'
    ? ['TenantAdmin', 'Librarian', 'Member']
    : ['Librarian', 'Member'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Users className="text-indigo-600" size={18} />
            <h3 className="font-bold text-slate-800">{t('admin.user.title', 'Quản lý tài khoản')}</h3>
          </div>
          <p className="text-xs text-slate-500">
            {currentRole === 'tenant_admin' 
              ? 'Quản lý thủ thư và độc giả thuộc thư viện hiện tại' 
              : 'Quản lý tài khoản và phân quyền người dùng trong toàn hệ thống'}
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider">Tên đăng nhập</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider">Email</TableHead>
              {currentRole === 'super_admin' && (
                <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider">Thư viện / Tenant</TableHead>
              )}
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider">Quyền hạn</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider">Trạng thái</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => {
              const isSelf = user.username === currentUser?.username || user.id === currentUser?.id;
              const isForbiddenByTenantAdmin = currentRole === 'tenant_admin' && (user.role === 'SuperAdmin' || user.role === 'TenantAdmin');
              const isEditable = !isSelf && !isForbiddenByTenantAdmin;
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-slate-800">{user.username}</TableCell>
                  <TableCell className="text-slate-500">{user.email}</TableCell>
                  {currentRole === 'super_admin' && (
                    <TableCell className="text-xs font-semibold text-slate-600">
                      {user.tenantId === 'tenant-1' ? 'Hà Nội HQ (hq)' : 'TP.HCM (lib-hcm)'}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline" className={`font-semibold text-xs px-2.5 py-0.5 rounded-full ${getRoleBadgeStyle(user.role)}`}>
                      {getFriendlyRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className={user.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none border-none' : ''}>
                      {user.status === 'Active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditable ? (
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)} className="h-8 w-8 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <Edit2 size={14} />
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-slate-400 bg-slate-50 border-slate-100 flex items-center justify-center gap-1 w-fit ml-auto">
                        <Lock size={10} /> Không thể chỉnh sửa
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-6 bg-white border border-slate-100 shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800 font-bold">
              <Shield className="text-indigo-600" size={20} />
              {t('admin.user.edit_title', 'Cập nhật quyền tài khoản')}
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (() => {
            const isSelf = selectedUser.id === currentUser?.id || selectedUser.username === currentUser?.username;
            return (
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400 uppercase tracking-wider">{t('admin.user.username_label', 'Tên đăng nhập')}</Label>
                  <div className="font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-150">{selectedUser.username}</div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-400 uppercase tracking-wider">{t('admin.user.email', 'Email')}</Label>
                  <div className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-150">{selectedUser.email}</div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400 uppercase tracking-wider">{t('admin.user.role_label', 'Vai trò / Quyền hạn')}</Label>
                  <Select value={role} onValueChange={setRole} disabled={isSelf}>
                    <SelectTrigger className="w-full bg-white border-slate-200 text-slate-700 rounded-lg">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 shadow-lg rounded-lg">
                      {availableRolesForSelection.map(roleOption => (
                        <SelectItem key={roleOption} value={roleOption}>
                          {getFriendlyRoleLabel(roleOption)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-[10.5px] text-slate-400 italic leading-relaxed">
                    {isSelf ? "Bạn không thể tự hạ quyền của chính mình" : "Vai trò quyết định menu và chức năng mà tài khoản được sử dụng sau khi đăng nhập."}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-400 uppercase tracking-wider">{t('admin.user.status_label', 'Trạng thái hoạt động')}</Label>
                  <Select value={status} onValueChange={setStatus} disabled={isSelf}>
                    <SelectTrigger className="w-full bg-white border-slate-200 text-slate-700 rounded-lg">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 shadow-lg rounded-lg">
                      <SelectItem value="Active">Hoạt động</SelectItem>
                      <SelectItem value="Inactive">Ngừng hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSelf && (
                    <div className="text-[10.5px] text-slate-400 italic leading-relaxed">
                      Bạn không thể tự khóa tài khoản của chính mình
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <DialogFooter className="flex gap-2 sm:justify-end border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-medium">
              {t('common.button.cancel', 'Hủy')}
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm">
              {updateMutation.isPending ? t('common.state.loading', 'Đang lưu...') : t('common.button.save', 'Lưu thay đổi')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

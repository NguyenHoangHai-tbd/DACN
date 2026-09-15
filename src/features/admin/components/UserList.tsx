import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Shield,
  Edit2,
  Lock,
  Search,
  Filter,
  RotateCw,
  X,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Mail,
  Building2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { User } from '../types';
import { useRoleStore } from '../../../shared/store/roleStore';
import { useAuthStore } from '../../auth/store/authStore';

const getFriendlyRoleLabel = (role: string) => {
  if (role === 'SuperAdmin') return 'Super Admin - Quản trị hệ thống';
  if (role === 'TenantAdmin') return 'Tenant Admin - Quản lý thư viện';
  if (role === 'Librarian') return 'Librarian - Thủ thư';
  if (role === 'Member') return 'Member - Độc giả';
  return role;
};

const getRoleBadgeStyle = (role: string) => {
  if (role === 'SuperAdmin') return 'text-purple-700 bg-purple-50 border-purple-200/80';
  if (role === 'TenantAdmin') return 'text-teal-700 bg-teal-50 border-teal-200/80';
  if (role === 'Librarian') return 'text-sky-700 bg-sky-50 border-sky-200/80';
  if (role === 'Member') return 'text-slate-700 bg-slate-100 border-slate-200/80';
  return 'text-slate-700 bg-slate-50 border-slate-200/80';
};

export const UserList: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const hasUserManage = useRoleStore(state => state.hasPermission('user.manage'));
  const currentRole = useRoleStore(state => state.currentRole);
  const { user: currentUser } = useAuthStore();

  const { data: users, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['users'],
    queryFn: adminService.getUsers,
    enabled: hasUserManage
  });

  // Dialog state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Search, Filter & Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const term = (searchTerm || '').toLowerCase().trim();
      const matchesSearch = 
        !term ||
        String(user?.username || (user as any)?.userName || '').toLowerCase().includes(term) ||
        String(user?.email || '').toLowerCase().includes(term);
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const hasActiveFilters = searchTerm.trim() !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  if (!hasUserManage) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200/80 rounded-2xl text-slate-800 shadow-xs max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShieldAlert size={24} />
        </div>
        <h4 className="font-bold text-base text-slate-900 mb-1">Không có quyền truy cập</h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          Tài khoản của bạn không có quyền quản lý người dùng (<code className="font-mono text-rose-700">user.manage</code>). Vui lòng liên hệ quản trị viên cấp cao nếu cần cấp phép.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pb-3 border-b border-slate-100">
          <div className="space-y-1.5 w-full max-w-xs">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3.5 w-56 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
        <div className="space-y-2.5 pt-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-rose-50/80 border border-rose-200/80 rounded-2xl text-slate-800 shadow-xs max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={24} />
        </div>
        <h4 className="font-bold text-base text-slate-900 mb-1">Không thể tải danh sách tài khoản</h4>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Hệ thống gặp sự cố khi kết nối tới máy chủ hoặc dữ liệu tài khoản chưa sẵn sàng.
        </p>
        <Button
          onClick={() => refetch()}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl h-9 px-4 cursor-pointer inline-flex items-center gap-2"
        >
          <RotateCw size={14} /> Thử lại
        </Button>
      </div>
    );
  }

  const availableRolesForSelection = currentRole === 'super_admin'
    ? ['TenantAdmin', 'Librarian', 'Member']
    : ['Librarian', 'Member'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
      {/* Header Block */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">{t('admin.user.title', 'Quản lý tài khoản')}</h3>
              <Badge variant="outline" className="text-[11px] font-semibold text-teal-700 bg-teal-50 border-teal-200/80">
                {users?.length ?? 0} tài khoản
              </Badge>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {currentRole === 'tenant_admin' 
              ? 'Quản lý thủ thư và độc giả thuộc thư viện chi nhánh hiện tại' 
              : 'Quản lý tài khoản, định danh và phân quyền người dùng trong toàn hệ thống'}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto h-9 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/80 rounded-xl cursor-pointer"
        >
          <RotateCw size={14} className={`mr-1.5 ${isFetching ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
          Làm mới
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input
              type="text"
              placeholder="Tìm theo tên đăng nhập hoặc email..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-8 bg-slate-50 border-slate-200/80 rounded-xl text-xs h-9 focus-visible:ring-teal-500 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="sm:col-span-3">
            <Select
              value={roleFilter}
              onValueChange={val => {
                setRoleFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-slate-50 border-slate-200/80 text-slate-700 rounded-xl text-xs h-9">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter size={13} className="text-slate-400 shrink-0" />
                  <SelectValue placeholder="Tất cả vai trò" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200/80 shadow-md rounded-xl text-xs">
                <SelectItem value="ALL">Tất cả vai trò</SelectItem>
                <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                <SelectItem value="TenantAdmin">TenantAdmin</SelectItem>
                <SelectItem value="Librarian">Librarian</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3 flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={val => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-slate-50 border-slate-200/80 text-slate-700 rounded-xl text-xs h-9">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200/80 shadow-md rounded-xl text-xs">
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="Active">Đang hoạt động</SelectItem>
                <SelectItem value="Inactive">Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer shrink-0"
                title="Xóa bộ lọc"
              >
                <X size={14} className="mr-1" /> Bỏ lọc
              </Button>
            )}
          </div>
        </div>

        {/* Search Results Summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3">
          <span>
            Hiển thị <strong className="text-slate-800 font-semibold">{filteredUsers.length}</strong> / {users?.length ?? 0} tài khoản
          </span>
          {hasActiveFilters && (
            <span className="text-teal-700 font-medium">
              Đang áp dụng bộ lọc tùy chỉnh
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredUsers.length === 0 ? (
        <div className="p-10 text-center text-slate-500 space-y-2">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users size={22} />
          </div>
          <p className="font-semibold text-slate-800 text-sm">
            {hasActiveFilters ? 'Không tìm thấy tài khoản phù hợp' : t('common.state.empty', 'Chưa có tài khoản nào')}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {hasActiveFilters 
              ? 'Hãy kiểm tra lại từ khóa tìm kiếm hoặc đặt lại các bộ lọc vai trò / trạng thái.'
              : 'Hệ thống chưa có tài khoản người dùng nào được ghi nhận.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-3 text-xs text-teal-700 border-teal-200/80 hover:bg-teal-50 rounded-xl"
            >
              Xóa bộ lọc tìm kiếm
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card View (< md) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {paginatedUsers.map(user => {
              const isSelf = user.username === currentUser?.username || user.id === currentUser?.id;
              const isForbiddenByTenantAdmin = currentRole === 'tenant_admin' && (user.role === 'SuperAdmin' || user.role === 'TenantAdmin');
              const isEditable = !isSelf && !isForbiddenByTenantAdmin;

              return (
                <div key={user.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                  {/* Row 1: User Identity & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100/80 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-xs truncate">{user.username}</h4>
                          {isSelf && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
                              Bạn
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
                        user.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-slate-100 text-slate-500 border-slate-200/80'
                      }`}
                    >
                      {user.status === 'Active' ? 'Hoạt động' : 'Ngừng HĐ'}
                    </Badge>
                  </div>

                  {/* Row 2: Role & Tenant Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={`font-semibold text-[11px] px-2 py-0.5 rounded-md ${getRoleBadgeStyle(user.role)}`}>
                        {getFriendlyRoleLabel(user.role)}
                      </Badge>

                      {currentRole === 'super_admin' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/60">
                          <Building2 size={11} className="text-slate-400" />
                          {user.tenantId === 'tenant-1' ? 'Hà Nội HQ (hq)' : user.tenantId === 'tenant-2' ? 'TP.HCM (lib-hcm)' : user.tenantId}
                        </span>
                      )}
                    </div>

                    <div>
                      {isEditable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(user)}
                          className="h-8 px-2.5 text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg font-medium cursor-pointer"
                        >
                          <Edit2 size={13} className="mr-1" /> Phân quyền
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          <Lock size={11} /> Đã khóa
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block w-full overflow-x-auto">
            <Table className="min-w-full w-full">
              <TableHeader className="bg-slate-50/80 border-b border-slate-200/80">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[26%] tracking-wider pl-6">
                    Tài khoản / Đăng nhập
                  </TableHead>
                  <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[22%] tracking-wider">
                    Email liên hệ
                  </TableHead>
                  {currentRole === 'super_admin' && (
                    <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[18%] tracking-wider">
                      Thư viện / Chi nhánh
                    </TableHead>
                  )}
                  <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[18%] tracking-wider">
                    Vai trò & Quyền hạn
                  </TableHead>
                  <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[12%] tracking-wider text-center">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[14%] tracking-wider text-right pr-6">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map(user => {
                  const isSelf = user.username === currentUser?.username || user.id === currentUser?.id;
                  const isForbiddenByTenantAdmin = currentRole === 'tenant_admin' && (user.role === 'SuperAdmin' || user.role === 'TenantAdmin');
                  const isEditable = !isSelf && !isForbiddenByTenantAdmin;

                  return (
                    <TableRow key={user.id} className="hover:bg-slate-50/70 transition-colors text-xs border-b border-slate-100">
                      {/* Column 1: Username */}
                      <TableCell className="py-3.5 pl-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100/80 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs truncate">{user.username}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {user.id}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Column 2: Email */}
                      <TableCell className="py-3.5 text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </TableCell>

                      {/* Column 3: Tenant (if super_admin) */}
                      {currentRole === 'super_admin' && (
                        <TableCell className="py-3.5 text-slate-700 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-700 text-xs">
                              {user.tenantId === 'tenant-1' ? 'Hà Nội HQ (hq)' : user.tenantId === 'tenant-2' ? 'TP.HCM (lib-hcm)' : user.tenantId}
                            </span>
                          </div>
                        </TableCell>
                      )}

                      {/* Column 4: Role */}
                      <TableCell className="py-3.5">
                        <Badge variant="outline" className={`font-semibold text-xs px-2.5 py-0.5 rounded-full ${getRoleBadgeStyle(user.role)}`}>
                          {getFriendlyRoleLabel(user.role)}
                        </Badge>
                      </TableCell>

                      {/* Column 5: Status */}
                      <TableCell className="py-3.5 text-center">
                        <Badge
                          variant="outline"
                          className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-full border ${
                            user.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-slate-100 text-slate-500 border-slate-200/80'
                          }`}
                        >
                          {user.status === 'Active' ? 'Hoạt động' : 'Ngừng HĐ'}
                        </Badge>
                      </TableCell>

                      {/* Column 6: Actions */}
                      <TableCell className="text-right py-3.5 pr-6 whitespace-nowrap">
                        {isEditable ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                            className="h-8 px-2.5 text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg font-semibold cursor-pointer"
                          >
                            <Edit2 size={13} className="mr-1" /> Phân quyền
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-slate-400 bg-slate-50 border-slate-200/60 inline-flex items-center gap-1">
                            <Lock size={10} /> Không thể sửa
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 text-[11px]">
                Trang <strong className="text-slate-800 font-semibold">{currentPage}</strong> / {totalPages} (Tổng {filteredUsers.length} tài khoản)
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2 text-xs rounded-lg border-slate-200/80 hover:bg-white cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft size={14} className="mr-0.5" /> Trước
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 p-0 text-xs rounded-lg cursor-pointer ${
                      currentPage === page
                        ? 'bg-teal-600 hover:bg-teal-700 text-white font-bold border-teal-600'
                        : 'border-slate-200/80 hover:bg-white text-slate-700'
                    }`}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2 text-xs rounded-lg border-slate-200/80 hover:bg-white cursor-pointer disabled:opacity-40"
                >
                  Sau <ChevronRight size={14} className="ml-0.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit User Permissions & Status Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[430px] rounded-2xl p-6 bg-white border border-slate-200/80 shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Shield size={18} />
              </div>
              <span>{t('admin.user.edit_title', 'Cập nhật quyền tài khoản')}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (() => {
            const isSelf = selectedUser.id === currentUser?.id || selectedUser.username === currentUser?.username;
            return (
              <div className="space-y-4 py-2">
                {/* Account Details Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">{t('admin.user.username_label', 'Tên đăng nhập')}:</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedUser.username}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">{t('admin.user.email', 'Email')}:</span>
                    <span className="text-slate-700 font-medium">{selectedUser.email}</span>
                  </div>
                  {currentRole === 'super_admin' && (
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">Thư viện:</span>
                      <span className="text-teal-700 font-semibold">
                        {selectedUser.tenantId === 'tenant-1' ? 'Hà Nội HQ' : 'TP.HCM (lib-hcm)'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Role Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {t('admin.user.role_label', 'Vai trò / Quyền hạn')}
                  </Label>
                  <Select value={role} onValueChange={setRole} disabled={isSelf}>
                    <SelectTrigger className="w-full bg-slate-50 border-slate-200/80 text-slate-800 rounded-xl text-xs h-9 focus-visible:ring-teal-500">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200/80 shadow-lg rounded-xl text-xs">
                      {availableRolesForSelection.map(roleOption => (
                        <SelectItem key={roleOption} value={roleOption}>
                          {getFriendlyRoleLabel(roleOption)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isSelf
                      ? "Bạn không thể tự hạ quyền quản trị của chính mình."
                      : "Vai trò quyết định phạm vi menu và các chức năng hệ thống tài khoản được phép thực thi."}
                  </p>
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {t('admin.user.status_label', 'Trạng thái hoạt động')}
                  </Label>
                  <Select value={status} onValueChange={setStatus} disabled={isSelf}>
                    <SelectTrigger className="w-full bg-slate-50 border-slate-200/80 text-slate-800 rounded-xl text-xs h-9 focus-visible:ring-teal-500">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200/80 shadow-lg rounded-xl text-xs">
                      <SelectItem value="Active">Hoạt động (Active)</SelectItem>
                      <SelectItem value="Inactive">Ngừng hoạt động (Inactive)</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSelf && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Bạn không thể tự khóa tài khoản đang đăng nhập của chính mình.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          <DialogFooter className="flex gap-2 sm:justify-end border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="rounded-xl border-slate-200/80 hover:bg-slate-50 text-slate-700 font-medium text-xs h-9 cursor-pointer"
            >
              {t('common.button.cancel', 'Hủy')}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-9 px-4 cursor-pointer shadow-xs"
            >
              {updateMutation.isPending ? (
                <span className="flex items-center gap-1.5">
                  <RotateCw size={13} className="animate-spin" /> Đang lưu...
                </span>
              ) : (
                t('common.button.save', 'Lưu thay đổi')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


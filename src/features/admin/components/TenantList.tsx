import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { Tenant } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Building2, Plus, Edit2, Lock, Unlock, Loader2, Eye, Calendar, BookOpen, Users, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const TenantList: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // State local cho Dialog
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // State local cho Chi tiết Dialog
  const [isOpenDetailDialog, setIsOpenDetailDialog] = useState(false);
  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null);

  const handleOpenDetail = (tenant: Tenant) => {
    setDetailTenant(tenant);
    setIsOpenDetailDialog(true);
  };

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Active');
  const [tenantAdmin, setTenantAdmin] = useState('');
  const [librarian, setLibrarian] = useState('');
  const [validationError, setValidationError] = useState('');

  // Fetch tenants
  const { data: tenants, isLoading, isError } = useQuery({
    queryKey: ['tenants'],
    queryFn: adminService.getTenants
  });

  // Fetch users for dropdown assignment when dialog is open
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: adminService.getUsers,
    enabled: isOpenDialog,
  });

  const tenantAdminsList = users?.filter(
    u => u.role === 'TenantAdmin' || u.role === 'Tenant_Admin' || u.role === 'tenant_admin'
  ) || [];

  const librariansList = users?.filter(
    u => u.role === 'Librarian' || u.role === 'librarian'
  ) || [];

  // Mutation create tenant
  const createMutation = useMutation({
    mutationFn: adminService.createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Thêm thư viện thành công');
      setIsOpenDialog(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi thêm thư viện';
      toast.error(msg);
    }
  });

  // Mutation update tenant
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; status: string; tenantAdmin?: string; librarian?: string } }) =>
      adminService.updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Cập nhật thư viện thành công');
      setIsOpenDialog(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thư viện';
      toast.error(msg);
    }
  });

  // Mutation toggle tenant status (Khóa / Mở khóa)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updateTenantStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      if (data.status === 'Active') {
        toast.success('Đã mở khóa thư viện');
      } else {
        toast.success('Đã khóa thư viện');
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi đổi trạng thái thư viện';
      toast.error(msg);
    }
  });

  const resetForm = () => {
    setCode('');
    setName('');
    setStatus('Active');
    setTenantAdmin('');
    setLibrarian('');
    setValidationError('');
    setSelectedTenant(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogMode('create');
    setIsOpenDialog(true);
  };

  const handleOpenEdit = (tenant: Tenant) => {
    resetForm();
    setSelectedTenant(tenant);
    setCode(tenant.code);
    setName(tenant.name);
    setStatus(tenant.status === 'Active' ? 'Active' : 'Inactive');
    setTenantAdmin(tenant.tenantAdmin || '');
    setLibrarian(tenant.librarian || '');
    setDialogMode('edit');
    setIsOpenDialog(true);
  };

  const handleToggleStatus = (tenant: Tenant) => {
    const nextStatus = tenant.status === 'Active' ? 'Inactive' : 'Active';
    toggleStatusMutation.mutate({ id: tenant.id, status: nextStatus });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Client-side validations
    if (!code || code.trim() === '') {
      setValidationError('Mã thư viện không được trống');
      return;
    }
    if (!name || name.trim() === '') {
      setValidationError('Tên thư viện không được trống');
      return;
    }

    if (dialogMode === 'create') {
      // Validate trùng mã
      const isDuplicate = tenants?.some(
        t => t.code.trim().toLowerCase() === code.trim().toLowerCase()
      );
      if (isDuplicate) {
        setValidationError('Mã thư viện đã tồn tại trong hệ thống. Vui lòng nhập mã khác.');
        return;
      }

      createMutation.mutate({
        code: code.trim(),
        name: name.trim(),
        status,
        tenantAdmin: tenantAdmin,
        librarian: librarian
      });
    } else {
      if (!selectedTenant) return;
      updateMutation.mutate({
        id: selectedTenant.id,
        data: {
          name: name.trim(),
          status,
          tenantAdmin: tenantAdmin,
          librarian: librarian
        }
      });
    }
  };

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Building2 className="text-indigo-600" size={18} />
          <h3 className="font-bold text-slate-800">{t('admin.tenant.title', 'Danh sách thư viện')}</h3>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="bg-indigo-600 hover:bg-indigo-700 font-bold shrink-0">
          <Plus size={16} className="mr-1.5" /> Thêm thư viện
        </Button>
      </div>

      <div className="p-4 bg-amber-50/40 border-b border-slate-100 text-xs text-amber-800 font-medium flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
        Super Admin quản lý các thư viện/khu vực và người phụ trách.
      </div>

      <div className="w-full bg-white rounded-b-2xl">
        <Table className="min-w-full w-full table-fixed">
          <TableHeader className="bg-slate-50/70">
            <TableRow>
              <TableHead className="font-bold text-slate-600 uppercase text-[11px] w-[28%] tracking-wider">Thư viện / khu vực</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-[11px] w-[22%] tracking-wider">Người phụ trách</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-[11px] w-[13%] tracking-wider text-center">Trạng thái</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-[11px] w-[20%] tracking-wider">Tổng quan</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-[11px] w-[17%] tracking-wider text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!tenants || tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                  Chưa có thư viện nào được tạo.
                </TableCell>
              </TableRow>
            ) : (
              tenants.map(tenant => (
                <TableRow key={tenant.id} className="hover:bg-slate-50/50 transition-all text-xs border-b border-slate-100">
                  {/* Cột 1: Thư viện / khu vực */}
                  <TableCell className="break-words py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-[13px]">{tenant.name}</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Mã: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[10px] font-semibold">{tenant.code}</code>
                      </span>
                    </div>
                  </TableCell>

                  {/* Cột 2: Người phụ trách */}
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-[10px] font-medium w-11">Admin:</span>
                        {tenant.tenantAdmin ? (
                          <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1 py-0.2 text-[10px]">
                            @{tenant.tenantAdmin}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Chưa phân công</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-[10px] font-medium w-11">Thủ thư:</span>
                        {tenant.librarian ? (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1 py-0.2 text-[10px]">
                            @{tenant.librarian}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Chưa phân công</span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Cột 3: Trạng thái */}
                  <TableCell className="text-center py-3">
                    <Badge
                      variant={tenant.status === 'Active' ? 'default' : 'secondary'}
                      className={
                        tenant.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none shadow-none text-[10px] px-1.5 py-0.5'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-none shadow-none text-[10px] px-1.5 py-0.5'
                      }
                    >
                      {tenant.status === 'Active' ? 'Hoạt động' : 'Tạm khóa'}
                    </Badge>
                  </TableCell>

                  {/* Cột 4: Tổng quan */}
                  <TableCell className="py-3">
                    <div className="flex flex-wrap gap-1 max-w-[190px]">
                      <span className="inline-flex items-center px-1 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100/50">
                        Sách: {tenant.totalBooks ?? 0}
                      </span>
                      <span className="inline-flex items-center px-1 py-0.5 rounded bg-orange-50 text-orange-700 text-[10px] font-semibold border border-orange-100/50">
                        Độc giả: {tenant.totalMembers ?? 0}
                      </span>
                      <span className="inline-flex items-center px-1 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100/50">
                        Mượn: {tenant.activeLoans ?? 0}
                      </span>
                      <span className={`inline-flex items-center px-1 py-0.5 rounded text-[10px] font-semibold border ${
                        (tenant.overdueLoans ?? 0) > 0 
                          ? 'bg-red-50 text-red-700 border-red-100/70 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200/50'
                      }`}>
                        Quá hạn: {tenant.overdueLoans ?? 0}
                      </span>
                    </div>
                  </TableCell>

                  {/* Cột 5: Thao tác */}
                  <TableCell className="text-right py-3 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(tenant)}
                        className="h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-1.5 text-[11px] font-semibold shrink-0"
                      >
                        Chi tiết
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(tenant)}
                        className="h-7 text-slate-700 hover:text-slate-800 hover:bg-slate-100 px-1.5 text-[11px] font-semibold shrink-0"
                      >
                        Sửa
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(tenant)}
                        disabled={toggleStatusMutation.isPending}
                        className={`h-7 font-semibold px-1.5 text-[11px] shrink-0 ${
                          tenant.status === 'Active'
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                            : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {tenant.status === 'Active' ? 'Khóa' : 'Mở khóa'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* dialog Thêm / Sửa Thư viện */}
      <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Building2 className="text-indigo-600 w-5 h-5" />
              {dialogMode === 'create' ? 'Thêm thư viện mới' : 'Cập nhật thư viện'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {validationError && (
              <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100 font-medium">
                {validationError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="tenant-code" className="text-xs font-bold text-slate-600 uppercase">
                Mã thư viện <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tenant-code"
                placeholder="Ví dụ: lib-danang, hq-sub"
                disabled={dialogMode === 'edit'}
                value={code}
                onChange={e => setCode(e.target.value)}
                className="bg-slate-50 border-slate-200"
              />
              {dialogMode === 'edit' && (
                <p className="text-[10px] text-slate-400">Không cho phép thay đổi Mã đối với thư viện đã tồn tại.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tenant-name" className="text-xs font-bold text-slate-600 uppercase">
                Tên thư viện <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tenant-name"
                placeholder="Ví dụ: Thư viện Độc lập Đà Nẵng"
                value={name}
                onChange={e => setName(e.target.value)}
                className="border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tenant-admin" className="text-xs font-bold text-slate-600 uppercase">
                Tenant Admin phụ trách
              </Label>
              <Select value={tenantAdmin || 'unassigned'} onValueChange={(val) => setTenantAdmin(val === 'unassigned' ? '' : val)}>
                <SelectTrigger className="border-slate-200 bg-white">
                  <SelectValue placeholder="Chưa phân công" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Chưa phân công</SelectItem>
                  {tenantAdminsList.map(u => (
                    <SelectItem key={u.id} value={u.username}>
                      @{u.username} (Email: {u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tenant-librarian" className="text-xs font-bold text-slate-600 uppercase">
                Thủ thư phụ trách
              </Label>
              <Select value={librarian || 'unassigned'} onValueChange={(val) => setLibrarian(val === 'unassigned' ? '' : val)}>
                <SelectTrigger className="border-slate-200 bg-white">
                  <SelectValue placeholder="Chưa phân công" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Chưa phân công</SelectItem>
                  {librariansList.map(u => (
                    <SelectItem key={u.id} value={u.username}>
                      @{u.username} (Email: {u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tenant-status" className="text-xs font-bold text-slate-600 uppercase">
                Trạng thái <span className="text-red-500">*</span>
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="border-slate-200 bg-white">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Hoạt động</SelectItem>
                  <SelectItem value="Inactive">Tạm khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpenDialog(false)}
                className="border-slate-200 font-bold"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 size={16} className="animate-spin mr-1.5" />
                )}
                Xác nhận
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* dialog Chi tiết Thư viện */}
      <Dialog open={isOpenDetailDialog} onOpenChange={setIsOpenDetailDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800 font-bold text-lg">
              <Building2 className="text-indigo-600 w-5 h-5" />
              Chi tiết thư viện
            </DialogTitle>
          </DialogHeader>

          {detailTenant && (
            <div className="space-y-5 py-3">
              {/* Basic info box */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 shadow-sm">
                <div className="grid grid-cols-3 gap-1 items-center border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500 text-xs font-semibold uppercase">Mã thư viện</span>
                  <span className="col-span-2 font-mono text-sm font-semibold text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded-md w-fit">
                    {detailTenant.code}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 items-start border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500 text-xs font-semibold uppercase mt-0.5">Tên thư viện</span>
                  <span className="col-span-2 font-bold text-sm text-slate-800 leading-relaxed">
                    {detailTenant.name}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 items-center border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500 text-xs font-semibold uppercase">Trạng thái</span>
                  <div className="col-span-2">
                    <Badge
                      variant={detailTenant.status === 'Active' ? 'default' : 'secondary'}
                      className={
                        detailTenant.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none shadow-none text-xs px-2.5 py-0.5'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-none shadow-none text-xs px-2.5 py-0.5'
                      }
                    >
                      {detailTenant.status === 'Active' ? 'Hoạt động' : 'Tạm khóa'}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 items-center border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500 text-xs font-semibold uppercase">Ngày tạo</span>
                  <span className="col-span-2 text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    {detailTenant.createdAt ? new Date(detailTenant.createdAt).toLocaleDateString('vi-VN') : '---'}
                  </span>
                </div>
              </div>

              {/* Responsible staff (Tenant Admin / Librarian) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50/50 border border-indigo-100/70 p-3.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">Tenant Admin</span>
                    <span className="text-xs text-slate-500 block leading-tight mb-2">Người quản trị</span>
                  </div>
                  {detailTenant.tenantAdmin ? (
                    <span className="font-semibold text-xs text-indigo-800 bg-indigo-100/80 border border-indigo-200 rounded-md px-2 py-0.5 w-fit">
                      @{detailTenant.tenantAdmin}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Chưa phân công</span>
                  )}
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100/70 p-3.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mb-1">Thủ thư</span>
                    <span className="text-xs text-slate-500 block leading-tight mb-2">Thủ thư quản lý</span>
                  </div>
                  {detailTenant.librarian ? (
                    <span className="font-semibold text-xs text-emerald-800 bg-emerald-100/80 border border-emerald-200 rounded-md px-2 py-0.5 w-fit">
                      @{detailTenant.librarian}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Chưa phân công</span>
                  )}
                </div>
              </div>

              {/* Core metrics / statistics dashboard */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tổng sách</span>
                    <span className="text-lg font-extrabold text-slate-800 leading-none mt-1 inline-block">
                      {detailTenant.totalBooks ?? 0}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
                  <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600 shrink-0">
                    <Users size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tổng độc giả</span>
                    <span className="text-lg font-extrabold text-slate-800 leading-none mt-1 inline-block">
                      {detailTenant.totalMembers ?? 0}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                    <ArrowRightLeft size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Đang mượn</span>
                    <span className="text-lg font-extrabold text-slate-800 leading-none mt-1 inline-block">
                      {detailTenant.activeLoans ?? 0}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-600 shrink-0">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Quá hạn</span>
                    <span className="text-lg font-extrabold text-slate-800 leading-none mt-1 inline-block">
                      {detailTenant.overdueLoans ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 mt-2">
            <Button
              type="button"
              onClick={() => setIsOpenDetailDialog(false)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold w-full uppercase"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

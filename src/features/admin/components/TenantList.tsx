import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { Tenant } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Lock, 
  Unlock, 
  Loader2, 
  Eye, 
  Calendar, 
  BookOpen, 
  Users, 
  ArrowRightLeft, 
  ShieldAlert, 
  Search, 
  AlertTriangle, 
  RefreshCw 
} from 'lucide-react';
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

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // State local cho Dialog Thêm / Sửa
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
  const { data: tenants, isLoading, isError, refetch } = useQuery({
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

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    if (!tenants) return [];
    if (!searchTerm || !searchTerm.trim()) return tenants;
    const term = searchTerm.toLowerCase().trim();
    return tenants.filter(
      t => (t?.name ? String(t.name).toLowerCase().includes(term) : false) ||
           (t?.code ? String(t.code).toLowerCase().includes(term) : false) ||
           (t?.tenantAdmin ? String(t.tenantAdmin).toLowerCase().includes(term) : false) ||
           (t?.librarian ? String(t.librarian).toLowerCase().includes(term) : false)
    );
  }, [tenants, searchTerm]);

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
        t => String(t?.code || '').trim().toLowerCase() === String(code || '').trim().toLowerCase()
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <Skeleton className="h-7 w-48 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-2xl border border-slate-200/80 text-center max-w-lg mx-auto shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          {t('admin.tenant.error_title', 'Không thể tải danh sách thư viện')}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">
          {t('common.state.error', 'Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại.')}
        </p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
        >
          <RefreshCw size={14} />
          {t('common.button.retry', 'Thử lại')}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
      {/* Header & Actions */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-100/60 flex items-center justify-center shrink-0">
            <Building2 size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {t('admin.tenant.title', 'Danh sách thư viện')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản trị các đơn vị thư viện, phân quyền và giám sát lưu thông
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm theo tên, mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8.5 pr-3 h-9 text-xs rounded-xl border-slate-200 bg-slate-50/60 focus-visible:ring-teal-500 w-full"
            />
          </div>

          <Button 
            onClick={handleOpenCreate} 
            size="sm" 
            className="h-9 px-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer shrink-0 transition-colors"
          >
            <Plus size={15} className="mr-1.5" /> Thêm thư viện
          </Button>
        </div>
      </div>

      {/* Scope banner */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 text-xs text-slate-600 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>
        <span>Super Admin quản lý tập trung các thư viện thành viên, phân quyền người phụ trách và giám sát quy mô.</span>
      </div>

      {/* Empty State */}
      {filteredTenants.length === 0 ? (
        <div className="p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <Building2 size={22} />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {searchTerm ? 'Không tìm thấy thư viện phù hợp với từ khóa' : 'Chưa có thư viện nào trong hệ thống'}
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {searchTerm ? 'Vui lòng kiểm tra lại từ khóa hoặc xóa bộ lọc tìm kiếm' : 'Bắt đầu bằng việc thêm thư viện đầu tiên'}
          </p>
          {!searchTerm && (
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl h-9 px-4 cursor-pointer"
            >
              <Plus size={14} className="mr-1.5" /> Thêm thư viện mới
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card View (< md) to completely avoid horizontal scroll issues */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredTenants.map(tenant => (
              <div key={tenant.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">{tenant.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] text-slate-500">Mã:</span>
                      <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold">
                        {tenant.code}
                      </code>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] px-2 py-0.5 font-semibold rounded-md border ${
                      tenant.status === 'Active'
                        ? 'bg-teal-50 text-teal-700 border-teal-200/80'
                        : 'bg-amber-50 text-amber-700 border-amber-200/80'
                    }`}
                  >
                    {tenant.status === 'Active' ? 'Hoạt động' : 'Tạm khóa'}
                  </Badge>
                </div>

                {/* Responsible */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Admin:</span>
                    {tenant.tenantAdmin ? (
                      <span className="font-semibold text-teal-700 truncate block">@{tenant.tenantAdmin}</span>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">Chưa phân công</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Thủ thư:</span>
                    {tenant.librarian ? (
                      <span className="font-semibold text-sky-700 truncate block">@{tenant.librarian}</span>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">Chưa phân công</span>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-semibold border border-teal-100/80">
                    Sách: {tenant.totalBooks ?? 0}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-semibold border border-sky-100/80">
                    Độc giả: {tenant.totalMembers ?? 0}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100/80">
                    Mượn: {tenant.activeLoans ?? 0}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                    (tenant.overdueLoans ?? 0) > 0 
                      ? 'bg-rose-50 text-rose-700 border-rose-200/80 font-bold'
                      : 'bg-slate-100 text-slate-600 border-slate-200/60'
                  }`}>
                    Quá hạn: {tenant.overdueLoans ?? 0}
                  </span>
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDetail(tenant)}
                    className="h-8 px-2.5 text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg font-medium cursor-pointer"
                  >
                    <Eye size={13} className="mr-1" /> Chi tiết
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(tenant)}
                    className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                  >
                    <Edit2 size={13} className="mr-1" /> Sửa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(tenant)}
                    disabled={toggleStatusMutation.isPending}
                    className={`h-8 px-2.5 text-xs font-medium rounded-lg cursor-pointer ${
                      tenant.status === 'Active'
                        ? 'text-amber-700 hover:text-amber-800 hover:bg-amber-50'
                        : 'text-teal-700 hover:text-teal-800 hover:bg-teal-50'
                    }`}
                  >
                    {tenant.status === 'Active' ? (
                      <><Lock size={13} className="mr-1" /> Khóa</>
                    ) : (
                      <><Unlock size={13} className="mr-1" /> Mở khóa</>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block w-full overflow-x-auto">
            <Table className="min-w-full w-full">
              <TableHeader className="bg-slate-50/80 border-b border-slate-200/80">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[28%] tracking-wider">
                    Thư viện / khu vực
                  </TableHead>
                  <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[22%] tracking-wider">
                    Người phụ trách
                  </TableHead>
                  <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[13%] tracking-wider text-center">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[20%] tracking-wider">
                    Tổng quan
                  </TableHead>
                  <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[17%] tracking-wider text-right pr-6">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map(tenant => (
                  <TableRow key={tenant.id} className="hover:bg-slate-50/70 transition-colors text-xs border-b border-slate-100">
                    {/* Cột 1: Thư viện / khu vực */}
                    <TableCell className="py-3.5 pl-6">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 text-sm tracking-tight">{tenant.name}</span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          Mã: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold">{tenant.code}</code>
                        </span>
                      </div>
                    </TableCell>

                    {/* Cột 2: Người phụ trách */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[10px] font-medium w-12">Admin:</span>
                          {tenant.tenantAdmin ? (
                            <span className="font-semibold text-teal-800 bg-teal-50 border border-teal-100/80 rounded-md px-1.5 py-0.5 text-[10px]">
                              @{tenant.tenantAdmin}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Chưa phân công</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[10px] font-medium w-12">Thủ thư:</span>
                          {tenant.librarian ? (
                            <span className="font-semibold text-sky-800 bg-sky-50 border border-sky-100/80 rounded-md px-1.5 py-0.5 text-[10px]">
                              @{tenant.librarian}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Chưa phân công</span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Cột 3: Trạng thái */}
                    <TableCell className="text-center py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 font-semibold rounded-md border ${
                          tenant.status === 'Active'
                            ? 'bg-teal-50 text-teal-700 border-teal-200/80'
                            : 'bg-amber-50 text-amber-700 border-amber-200/80'
                        }`}
                      >
                        {tenant.status === 'Active' ? 'Hoạt động' : 'Tạm khóa'}
                      </Badge>
                    </TableCell>

                    {/* Cột 4: Tổng quan */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[210px]">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-semibold border border-teal-100/80">
                          Sách: {tenant.totalBooks ?? 0}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-semibold border border-sky-100/80">
                          Độc giả: {tenant.totalMembers ?? 0}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100/80">
                          Mượn: {tenant.activeLoans ?? 0}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${
                          (tenant.overdueLoans ?? 0) > 0 
                            ? 'bg-rose-50 text-rose-700 border-rose-200/80 font-bold'
                            : 'bg-slate-100 text-slate-600 border-slate-200/60'
                        }`}>
                          Quá hạn: {tenant.overdueLoans ?? 0}
                        </span>
                      </div>
                    </TableCell>

                    {/* Cột 5: Thao tác */}
                    <TableCell className="text-right py-3.5 pr-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(tenant)}
                          className="h-8 text-teal-700 hover:text-teal-800 hover:bg-teal-50 px-2 text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          <Eye size={13} className="mr-1" /> Chi tiết
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(tenant)}
                          className="h-8 text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2 text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          <Edit2 size={13} className="mr-1" /> Sửa
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(tenant)}
                          disabled={toggleStatusMutation.isPending}
                          className={`h-8 px-2 text-xs font-semibold rounded-lg cursor-pointer ${
                            tenant.status === 'Active'
                              ? 'text-amber-700 hover:text-amber-800 hover:bg-amber-50'
                              : 'text-teal-700 hover:text-teal-800 hover:bg-teal-50'
                          }`}
                        >
                          {tenant.status === 'Active' ? (
                            <><Lock size={13} className="mr-1" /> Khóa</>
                          ) : (
                            <><Unlock size={13} className="mr-1" /> Mở khóa</>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Dialog Thêm / Sửa Thư viện */}
      <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <span>{dialogMode === 'create' ? 'Thêm thư viện mới' : 'Cập nhật thư viện'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            {validationError && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200/80 font-medium">
                {validationError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="tenant-code" className="text-xs font-bold text-slate-700 uppercase">
                Mã thư viện <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="tenant-code"
                placeholder="Ví dụ: lib-danang, hq-sub"
                disabled={dialogMode === 'edit'}
                value={code}
                onChange={e => setCode(e.target.value)}
                className="bg-slate-50 border-slate-200/80 rounded-xl text-xs h-9 focus-visible:ring-teal-500"
              />
              {dialogMode === 'edit' && (
                <p className="text-[10px] text-slate-400">Không cho phép thay đổi Mã đối với thư viện đã tồn tại.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tenant-name" className="text-xs font-bold text-slate-700 uppercase">
                Tên thư viện <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="tenant-name"
                placeholder="Ví dụ: Thư viện Độc lập Đà Nẵng"
                value={name}
                onChange={e => setName(e.target.value)}
                className="border-slate-200/80 rounded-xl text-xs h-9 focus-visible:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tenant-admin" className="text-xs font-bold text-slate-700 uppercase">
                Tenant Admin phụ trách
              </Label>
              <Select value={tenantAdmin || 'unassigned'} onValueChange={(val) => setTenantAdmin(val === 'unassigned' ? '' : val)}>
                <SelectTrigger className="border-slate-200/80 bg-white rounded-xl text-xs h-9 focus:ring-teal-500">
                  <SelectValue placeholder="Chưa phân công" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-md">
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
              <Label htmlFor="tenant-librarian" className="text-xs font-bold text-slate-700 uppercase">
                Thủ thư phụ trách
              </Label>
              <Select value={librarian || 'unassigned'} onValueChange={(val) => setLibrarian(val === 'unassigned' ? '' : val)}>
                <SelectTrigger className="border-slate-200/80 bg-white rounded-xl text-xs h-9 focus:ring-teal-500">
                  <SelectValue placeholder="Chưa phân công" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-md">
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
              <Label htmlFor="tenant-status" className="text-xs font-bold text-slate-700 uppercase">
                Trạng thái <span className="text-rose-500">*</span>
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="border-slate-200/80 bg-white rounded-xl text-xs h-9 focus:ring-teal-500">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-md">
                  <SelectItem value="Active">Hoạt động</SelectItem>
                  <SelectItem value="Inactive">Tạm khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpenDialog(false)}
                className="border-slate-200 text-slate-700 font-semibold text-xs rounded-xl h-9 cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl h-9 px-4 cursor-pointer shadow-xs"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 size={15} className="animate-spin mr-1.5" />
                )}
                Xác nhận
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Chi tiết Thư viện */}
      <Dialog open={isOpenDetailDialog} onOpenChange={setIsOpenDetailDialog}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <span>Chi tiết thư viện</span>
            </DialogTitle>
          </DialogHeader>

          {detailTenant && (
            <div className="space-y-4 py-2">
              {/* Basic info box */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-3 gap-1 items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 text-xs font-semibold uppercase">Mã thư viện</span>
                  <span className="col-span-2 font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md w-fit">
                    {detailTenant.code}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 items-start border-b border-slate-100 pb-2">
                  <span className="text-slate-500 text-xs font-semibold uppercase mt-0.5">Tên thư viện</span>
                  <span className="col-span-2 font-bold text-sm text-slate-900 leading-snug">
                    {detailTenant.name}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 text-xs font-semibold uppercase">Trạng thái</span>
                  <div className="col-span-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 font-semibold rounded-md border ${
                        detailTenant.status === 'Active'
                          ? 'bg-teal-50 text-teal-700 border-teal-200/80'
                          : 'bg-amber-50 text-amber-700 border-amber-200/80'
                      }`}
                    >
                      {detailTenant.status === 'Active' ? 'Hoạt động' : 'Tạm khóa'}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 items-center">
                  <span className="text-slate-500 text-xs font-semibold uppercase">Ngày tạo</span>
                  <span className="col-span-2 text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    {detailTenant.createdAt ? new Date(detailTenant.createdAt).toLocaleDateString('vi-VN') : '---'}
                  </span>
                </div>
              </div>

              {/* Responsible staff */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-teal-50/50 border border-teal-100/70 p-3 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block mb-0.5">Tenant Admin</span>
                    <span className="text-[11px] text-slate-500 block leading-tight mb-2">Người quản trị</span>
                  </div>
                  {detailTenant.tenantAdmin ? (
                    <span className="font-semibold text-xs text-teal-800 bg-white border border-teal-200/80 rounded-md px-2 py-0.5 w-fit">
                      @{detailTenant.tenantAdmin}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Chưa phân công</span>
                  )}
                </div>

                <div className="bg-sky-50/50 border border-sky-100/70 p-3 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block mb-0.5">Thủ thư</span>
                    <span className="text-[11px] text-slate-500 block leading-tight mb-2">Thủ thư phụ trách</span>
                  </div>
                  {detailTenant.librarian ? (
                    <span className="font-semibold text-xs text-sky-800 bg-white border border-sky-200/80 rounded-md px-2 py-0.5 w-fit">
                      @{detailTenant.librarian}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Chưa phân công</span>
                  )}
                </div>
              </div>

              {/* Core metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-teal-600 mb-1">
                    <BookOpen size={14} />
                    <span className="text-[10px] uppercase font-bold text-slate-500">Tổng sách</span>
                  </div>
                  <span className="text-base font-extrabold text-slate-900 leading-none">
                    {detailTenant.totalBooks ?? 0}
                  </span>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-sky-600 mb-1">
                    <Users size={14} />
                    <span className="text-[10px] uppercase font-bold text-slate-500">Độc giả</span>
                  </div>
                  <span className="text-base font-extrabold text-slate-900 leading-none">
                    {detailTenant.totalMembers ?? 0}
                  </span>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                    <ArrowRightLeft size={14} />
                    <span className="text-[10px] uppercase font-bold text-slate-500">Đang mượn</span>
                  </div>
                  <span className="text-base font-extrabold text-slate-900 leading-none">
                    {detailTenant.activeLoans ?? 0}
                  </span>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-rose-600 mb-1">
                    <ShieldAlert size={14} />
                    <span className="text-[10px] uppercase font-bold text-slate-500">Quá hạn</span>
                  </div>
                  <span className="text-base font-extrabold text-slate-900 leading-none">
                    {detailTenant.overdueLoans ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button
              type="button"
              onClick={() => setIsOpenDetailDialog(false)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl h-9 w-full cursor-pointer"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


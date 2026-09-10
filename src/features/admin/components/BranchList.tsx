import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { Branch } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Library, Plus, Edit2, Lock, Unlock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export const BranchList: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Dialog States
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Form States
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState('');

  // Fetch branches query
  const { data: branches, isLoading, isError } = useQuery({
    queryKey: ['branches'],
    queryFn: adminService.getBranches
  });

  // Mutation to create branch
  const createMutation = useMutation({
    mutationFn: adminService.createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Thêm chi nhánh thành công');
      setIsOpenDialog(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi thêm chi nhánh';
      toast.error(msg);
    }
  });

  // Mutation to update branch name/details
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; status: 'Active' | 'Inactive' } }) =>
      adminService.updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Cập nhật chi nhánh thành công');
      setIsOpenDialog(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chi nhánh';
      toast.error(msg);
    }
  });

  // Mutation to toggle branch status (Lock/Unlock)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Active' | 'Inactive' }) =>
      adminService.updateBranchStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      if (data.status === 'Active') {
        toast.success('Đã mở khóa chi nhánh');
      } else {
        toast.success('Đã khóa chi nhánh');
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi đổi trạng thái chi nhánh';
      toast.error(msg);
    }
  });

  const resetForm = () => {
    setCode('');
    setName('');
    setValidationError('');
    setSelectedBranch(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogMode('create');
    setIsOpenDialog(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    resetForm();
    setSelectedBranch(branch);
    setCode(branch.code);
    setName(branch.name);
    setDialogMode('edit');
    setIsOpenDialog(true);
  };

  const handleToggleStatus = (branch: Branch) => {
    const nextStatus = branch.status === 'Active' ? 'Inactive' : 'Active';
    toggleStatusMutation.mutate({ id: branch.id, status: nextStatus });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!code || code.trim() === '') {
      setValidationError('Mã chi nhánh không được để trống');
      return;
    }
    if (!name || name.trim() === '') {
      setValidationError('Tên chi nhánh không được để trống');
      return;
    }

    if (dialogMode === 'create') {
      const isDuplicate = branches?.some(
        b => b.code.trim().toLowerCase() === code.trim().toLowerCase()
      );
      if (isDuplicate) {
        setValidationError('Mã chi nhánh đã tồn tại trong thư viện này');
        return;
      }

      createMutation.mutate({
        code: code.trim(),
        name: name.trim()
      });
    } else {
      if (!selectedBranch) return;
      updateMutation.mutate({
        id: selectedBranch.id,
        data: {
          name: name.trim(),
          status: selectedBranch.status
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-slate-500 animate-pulse flex items-center gap-2">
          <Library className="animate-spin text-indigo-600" size={16} />
          Đang tải danh sách chi nhánh thư viện...
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-600 bg-red-50 rounded-xl border border-red-100 font-medium">
        Không thể tải dữ liệu danh sách chi nhánh thư viện. Vui lòng thử lại sau.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table & Listing */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Library className="text-indigo-600" size={18} />
            <h3 className="font-bold text-slate-800">Cấu Hình Danh Sách Chi Nhánh</h3>
          </div>
          <Button 
            onClick={handleOpenCreate}
            className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border-none text-xs gap-1 py-1.5 px-3 rounded-lg"
          >
            <Plus size={14} /> Thêm chi nhánh
          </Button>
        </div>

        {!branches || branches.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Chưa có chi nhánh nào được cấu hình trong hệ thống.
          </div>
        ) : (
          <div className="w-full overflow-x-auto animate-fade-in">
            <Table className="min-w-[700px]">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider">Mã Chi Nhánh</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider">Tên Chi Nhánh Thư Viện</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider text-center">Trạng thái</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider text-center">Ngày tạo</TableHead>
                  <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map(branch => (
                  <TableRow key={branch.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-slate-600">{branch.code}</TableCell>
                    <TableCell className="font-medium text-slate-800 truncate" title={branch.name}>{branch.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`border-none shadow-none font-bold ${
                        branch.status === 'Active' 
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' 
                        : 'bg-red-100 text-red-700 hover:bg-red-100'
                      }`}>
                        {branch.status === 'Active' ? 'Đang hoạt động' : 'Đã khóa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-500 whitespace-nowrap">
                      {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(branch)}
                          className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                          title="Sửa thông tin"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(branch)}
                          className={`h-8 w-8 ${
                            branch.status === 'Active' 
                            ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50' 
                            : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={branch.status === 'Active' ? 'Khóa chi nhánh' : 'Mở khóa chi nhánh'}
                          disabled={toggleStatusMutation.isPending}
                        >
                          {branch.status === 'Active' ? <Lock size={14} /> : <Unlock size={14} />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              {dialogMode === 'create' ? 'Thêm Chi Nhánh Mới' : 'Cập Nhật Chi Nhánh Thư Viện'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {validationError && (
              <div className="text-xs font-semibold bg-red-50 text-red-600 rounded-lg p-3 border border-red-200">
                {validationError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="branch-code" className="text-xs font-bold text-slate-600">
                Mã Chi Nhánh <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="branch-code"
                placeholder="Ví dụ: BR_MAIN, BR_CN1..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={dialogMode === 'edit' || createMutation.isPending || updateMutation.isPending}
                className="col-span-3 text-sm focus-visible:ring-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-name" className="text-xs font-bold text-slate-600">
                Tên Chi Nhánh <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="branch-name"
                placeholder="Ví dụ: Thư viện Trung tâm..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="col-span-3 text-sm focus-visible:ring-indigo-600"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={createMutation.isPending || updateMutation.isPending}
                onClick={() => setIsOpenDialog(false)}
                className="text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs shadow-sm border-none px-4"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="animate-spin mr-1.5" size={14} />
                )}
                Xác nhận
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};


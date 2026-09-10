import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transferService } from '../services/transferService';
import { adminService } from '../../admin/services/adminService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightLeft, PackageCheck, PackageOpen, Truck, Plus, CheckCircle2, AlertCircle, Bot, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { BookTransfer } from '../types';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

export const TransferBoard: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [receiveConfirmId, setReceiveConfirmId] = useState<string | null>(null);

  // For creation
  const [destBranch, setDestBranch] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [barcodes, setBarcodes] = useState('');
  const [reason, setReason] = useState('');
  const [bookIdForAi, setBookIdForAi] = useState('');

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers', filterStatus],
    queryFn: () => transferService.getTransfers(filterStatus !== 'all' ? { status: filterStatus } : undefined)
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: adminService.getBranches
  });

  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['transferSuggestions', bookIdForAi, destBranch],
    queryFn: () => transferService.getAiSuggestions(bookIdForAi, destBranch),
    enabled: !!bookIdForAi && !!destBranch,
  });

  const createMutation = useMutation({
    mutationFn: () => transferService.createTransfer({
      destinationBranchId: destBranch,
      sourceBranchId: sourceBranch,
      barcodeList: barcodes.split(',').map(b => b.trim()).filter(Boolean),
      reason
    }),
    onSuccess: () => {
      toast.success('Đã tạo phiếu luân chuyển thành công');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Không thể tạo phiếu luân chuyển. Vui lòng kiểm tra thông tin và kết nối.'));
    }
  });

  const receiveMutation = useMutation({
    mutationFn: ({ id, branchId }: { id: string, branchId: string }) => transferService.receiveTransfer(id, branchId),
    onSuccess: () => {
      toast.success('Đã xác nhận nhận sách thành công');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      setReceiveConfirmId(null);
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Không thể xác nhận nhận sách. Vui lòng kiểm tra thông tin và kết nối.'));
    }
  });

  const resetForm = () => {
    setDestBranch('');
    setSourceBranch('');
    setBarcodes('');
    setReason('');
    setBookIdForAi('');
  };

  const getStatusBadge = (status: BookTransfer['status']) => {
    switch(status) {
      case 'Pending': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 uppercase text-[10px]"><PackageOpen size={12} className="mr-1" /> Chờ xử lý</Badge>;
      case 'InTransit': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 uppercase text-[10px]"><Truck size={12} className="mr-1" /> Đang vận chuyển</Badge>;
      case 'Received': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 uppercase text-[10px]"><CheckCircle2 size={12} className="mr-1" /> Đã nhận</Badge>;
      case 'Cancelled': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 uppercase text-[10px]">Đã hủy</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] bg-slate-50">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="Pending">Chờ xử lý</SelectItem>
              <SelectItem value="InTransit">Đang vận chuyển</SelectItem>
              <SelectItem value="Received">Đã nhận</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger render={
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold">
              <Plus size={16} className="mr-2" /> Tạo Phiếu Luân Chuyển
            </Button>
          } />
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowRightLeft className="text-indigo-600" /> Tạo Phiếu Luân Chuyển Sách
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-700">Chi nhánh đích (Cần sách)</label>
                   <Select value={destBranch} onValueChange={setDestBranch}>
                     <SelectTrigger>
                       <SelectValue placeholder="Chọn chi nhánh..." />
                     </SelectTrigger>
                     <SelectContent>
                       {branches.map(b => (
                         <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <label className="hidden text-sm font-semibold text-slate-700">Mã sách cần luân chuyển</label>
                   <div className="flex gap-2">
                      <Input 
                        className="hidden" placeholder="VD: BOOK-001" 
                        value={bookIdForAi}
                        onChange={e => setBookIdForAi(e.target.value)}
                      />
                   </div>
                 </div>
              </div>

              {false && suggestions && suggestions.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-800">
                    <Bot size={16} /> AI Gợi ý Chi nhánh Nguồn Tối ưu
                  </h4>
                  <div className="space-y-2">
                    {suggestions.map((s, i) => (
                      <div 
                        key={s.recommendedBranchId}
                        className={`p-3 rounded-lg border text-sm cursor-pointer transition-colors ${sourceBranch === s.recommendedBranchId ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500' : 'bg-white/50 border-indigo-200 hover:bg-white'}`}
                        onClick={() => setSourceBranch(s.recommendedBranchId)}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800">{s.recommendedBranchName}</span>
                          <Badge variant="outline" className="bg-indigo-100/50 text-indigo-700">{s.availableCopies} bản sao sẵn sàng</Badge>
                        </div>
                        <p className="text-slate-600 text-xs mb-1">{s.reasoning}</p>
                        <p className="text-indigo-600 text-xs font-semibold">{s.distanceOrCost}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-700">Chi nhánh nguồn (Gửi sách)</label>
                   <Select value={sourceBranch} onValueChange={setSourceBranch}>
                     <SelectTrigger>
                       <SelectValue placeholder="Chọn chi nhánh..." />
                     </SelectTrigger>
                     <SelectContent>
                       {branches.map(b => (
                         <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Mã vạch bản sao (cách nhau bởi dấu phẩy)</label>
                <Input 
                  placeholder="VD: C-001, C-002"
                  value={barcodes}
                  onChange={e => setBarcodes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Lý do luân chuyển</label>
                <Textarea 
                  placeholder="VD: Bổ sung sách cho học kỳ mới..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={!destBranch || !sourceBranch || !barcodes || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Tạo Phiếu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 shrink-0">
        <div className="overflow-x-auto min-h-[400px]">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-600 uppercase text-xs">Mã Phiếu</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs">Ngày tạo</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs">Từ chi nhánh</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs">Đến chi nhánh</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs">Số lượng</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs">Trạng thái</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</TableCell>
                </TableRow>
              ) : transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <PackageOpen size={32} className="mx-auto mb-3 opacity-20" />
                    Không có phiếu luân chuyển nào.
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs font-semibold text-slate-600">{t.id}</TableCell>
                    <TableCell className="text-sm font-medium text-slate-500">{format(new Date(t.createdDate), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-slate-800">{t.sourceBranchName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-indigo-700">{t.destinationBranchName}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{t.items?.length || 0} sách</TableCell>
                    <TableCell>{getStatusBadge(t.status)}</TableCell>
                    <TableCell className="text-right">
                      {t.status === 'InTransit' && (
                        <Dialog open={receiveConfirmId === t.id} onOpenChange={(open) => !open && setReceiveConfirmId(null)}>
                          <DialogTrigger render={
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setReceiveConfirmId(t.id)}>
                              Nhận Hàng
                            </Button>
                          } />
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Xác nhận nhận sách luân chuyển</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 text-slate-600">
                              Bạn xác nhận đã nhận đủ <span className="font-bold text-slate-800">{t.items?.length}</span> cuốn sách từ phiếu <span className="font-mono font-semibold">{t.id}</span>?
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setReceiveConfirmId(null)}>Hủy</Button>
                              <Button 
                                className="bg-emerald-600 hover:bg-emerald-700" 
                                onClick={() => receiveMutation.mutate({ id: t.id, branchId: t.destinationBranchId })}
                                disabled={receiveMutation.isPending}
                              >
                                {receiveMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <PackageCheck size={16} className="mr-2" />}
                                Xác nhận Nhận
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { circulationService } from '../services/circulationService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Clock, RefreshCw, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSignalRListener } from '../../../shared/signalr/useSignalRListener';
import { parseFriendlyError } from '../../../shared/utils/errorParser';
import { axiosInstance } from '../../../shared/api/axiosInstance';

export const ActiveLoans: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  useSignalRListener('loan.created', () => {
    toast.info('Dữ liệu mượn sách vừa thay đổi, tải lại...');
  }, [['activeLoans']]);

  const { data: loans, isLoading, isError } = useQuery({
    queryKey: ['activeLoans'],
    queryFn: circulationService.getActiveLoans,
    refetchInterval: 15000 // Refetch every 15s to keep UI updated
  });

  const renewMutation = useMutation({
    mutationFn: circulationService.renew,
    onSuccess: () => {
      toast.success(t('circulation.renew_success', 'Gia hạn thành công'));
      queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Gia hạn thất bại. Vui lòng thử lại.'));
    }
  });

  const payFineMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const res = await axiosInstance.post(`/member/fines/${loanId}/pay`, {
        paymentMethod: 'cash'
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Đã ghi nhận thanh toán phạt thành công!');
      queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
      queryClient.invalidateQueries({ queryKey: ['returnedUnpaidFines'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      queryClient.invalidateQueries({ queryKey: ['memberLoans'] });
      queryClient.invalidateQueries({ queryKey: ['memberHistory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reportPreview'] });
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Ghi nhận thanh toán phạt thất bại.'));
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-slate-500 animate-pulse flex items-center gap-2">
          <Clock className="animate-spin text-indigo-600" size={16} />
          Đang tải danh sách phiếu mượn hoạt động...
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-600 bg-red-50 rounded-xl border border-red-100 font-medium">
        Không thể tải dữ liệu danh sách phiếu mượn.
      </div>
    );
  }

  if (!loans || loans.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <Clock className="mx-auto text-slate-300 mb-2" size={40} />
        <p className="font-medium text-slate-700">Chưa có dữ liệu phiếu mượn nào đang hoạt động.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="text-indigo-600" size={18} />
          <h3 className="font-bold text-slate-800">Phiếu Mượn Sách Đang Hoạt Động</h3>
        </div>
        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold">
          Tổng số: {loans.length} lượt đang mượn
        </Badge>
      </div>
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[700px] table-fixed">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[240px]">Tên tài liệu / Sách</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[180px]">Độc giả mượn</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[130px]">Hạn trả sách</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[120px]">Trạng thái</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider text-right w-[110px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map(loan => {
              const isOverdue = loan.status === 'Overdue' || new Date(loan.dueDate) < new Date();
              const overdueDays = loan.overdueDays !== undefined ? loan.overdueDays : (isOverdue ? Math.ceil((Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0);
              const fineAmount = loan.fineAmount !== undefined ? loan.fineAmount : 0;
              const isPaid = loan.finePaid === true;

              return (
                <TableRow key={loan.id} className={`hover:bg-slate-50/50 transition-colors ${isOverdue ? 'bg-rose-50/20' : ''}`}>
                  <TableCell className="font-medium text-slate-800">
                    <div className="flex flex-col pr-2">
                      <span className="font-bold text-slate-800 line-clamp-1" title={loan.bookTitle}>{loan.bookTitle}</span>
                      <span className="font-mono text-[10px] text-slate-400">ID: {loan.bookId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col pr-2">
                      <span className="font-medium text-slate-700 line-clamp-1">{loan.userName}</span>
                      <span className="font-mono text-[10px] text-indigo-500 font-bold">Thẻ: {loan.userId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                      {format(new Date(loan.dueDate), 'dd/MM/yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col align-start">
                      <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider w-fit ${
                        isOverdue ? 'border-red-200 bg-red-50 text-red-700' : 
                        loan.status === 'Returned' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 
                        'border-indigo-200 bg-indigo-50 text-indigo-700'
                      }`}>
                        {isOverdue && loan.status !== 'Returned' ? 'Quá hạn' : 
                         loan.status === 'Active' ? 'Đang mượn' : 
                         loan.status === 'Returned' ? 'Đã trả' : loan.status}
                      </Badge>
                      {fineAmount > 0 && (
                        <span className={`text-[10px] font-bold mt-1.5 leading-none ${isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                          Phạt: {fineAmount.toLocaleString('vi-VN')}đ ({isPaid ? 'Đã thu' : 'Chưa thu'})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex flex-col gap-1 items-end">
                      {loan.status !== 'Returned' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-[11px] text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold w-full"
                          onClick={() => renewMutation.mutate(loan.id)}
                          disabled={renewMutation.isPending}
                        >
                          <RefreshCw className={`w-2.5 h-2.5 mr-1 ${renewMutation.isPending && renewMutation.variables === loan.id ? 'animate-spin' : ''}`} />
                          Gia hạn
                        </Button>
                      )}
                      
                      {fineAmount > 0 && !isPaid && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-7 text-[11px] bg-rose-600 hover:bg-rose-700 text-white font-semibold w-full"
                          onClick={() => payFineMutation.mutate(loan.id)}
                          disabled={payFineMutation.isPending}
                        >
                          <DollarSign className="w-2.5 h-2.5 mr-1" />
                          Ghi nhận thu phạt
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

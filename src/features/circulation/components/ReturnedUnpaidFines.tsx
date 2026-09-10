import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { circulationService } from '../services/circulationService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DollarSign, Clock, Loader2 } from 'lucide-react';
import { axiosInstance } from '../../../shared/api/axiosInstance';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

export const ReturnedUnpaidFines: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: unpaidFines, isLoading, isError } = useQuery({
    queryKey: ['returnedUnpaidFines'],
    queryFn: circulationService.getReturnedUnpaidFines,
    refetchInterval: 15000 // Refetch every 15s to keep UI updated
  });

  const payFineMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const res = await axiosInstance.post(`/member/fines/${loanId}/pay`, {
        paymentMethod: 'cash'
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Đã ghi nhận thu phạt');
      queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
      queryClient.invalidateQueries({ queryKey: ['returnedUnpaidFines'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      queryClient.invalidateQueries({ queryKey: ['memberLoans'] });
      queryClient.invalidateQueries({ queryKey: ['memberHistory'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reportPreview'] });
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Ghi nhận thu phạt thất bại. Vui lòng thử lại.'));
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4 mt-6">
        <div className="text-sm font-medium text-slate-500 animate-pulse flex items-center gap-2">
          <Loader2 className="animate-spin text-rose-600" size={16} />
          Đang tải danh sách phiếu đã trả còn nợ phạt...
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-600 bg-red-50 rounded-xl border border-red-100 font-medium mt-6">
        Không thể tải dữ liệu danh sách phiếu đã trả còn nợ phạt.
      </div>
    );
  }

  if (!unpaidFines || unpaidFines.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-6">
        <div className="p-3 border-b border-slate-100 bg-rose-50/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DollarSign className="text-rose-600" size={16} />
            <span className="font-bold text-slate-800 text-sm">Phiếu đã trả còn nợ phạt</span>
          </div>
        </div>
        <div className="p-4 text-center text-sm text-slate-500">
          Không có phiếu đã trả còn nợ phạt
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-6">
      <div className="p-4 border-b border-slate-100 bg-rose-50/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <DollarSign className="text-rose-600" size={18} />
          <h3 className="font-bold text-slate-800">Phiếu đã trả còn nợ phạt</h3>
        </div>
        <Badge variant="secondary" className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold">
          {unpaidFines.length} phiếu chưa thanh toán
        </Badge>
      </div>
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[700px] table-fixed">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[240px]">Tên sách</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[180px]">Độc giả</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[130px]">Ngày trả</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[120px]">Số tiền phạt</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[100px]">Trạng thái</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider text-right w-[115px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unpaidFines.map((loan) => {
              return (
                <TableRow key={loan.id} className="hover:bg-slate-50/50 transition-colors bg-rose-50/5">
                  <TableCell className="font-medium text-slate-800">
                    <div className="flex flex-col pr-2">
                      <span className="font-bold text-slate-800 line-clamp-1" title={loan.bookTitle}>
                        {loan.bookTitle}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Book ID: {loan.bookId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col pr-2">
                      <span className="font-medium text-slate-700 line-clamp-1">{loan.userName}</span>
                      <span className="text-xs text-indigo-500 font-mono font-bold">Thẻ: {loan.userId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-slate-600">
                      {loan.returnDate ? format(new Date(loan.returnDate), 'dd/MM/yyyy') : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-rose-600">
                      {(loan.fineAmount || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-rose-200 bg-rose-50 text-rose-700">
                      Chưa thu
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => payFineMutation.mutate(loan.id)}
                      disabled={payFineMutation.isPending}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-7 text-[11px] px-2"
                    >
                      {payFineMutation.isPending && payFineMutation.variables === loan.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <DollarSign className="h-3.5 w-3.5 mr-1" />
                      )}
                      Ghi nhận thu phạt
                    </Button>
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

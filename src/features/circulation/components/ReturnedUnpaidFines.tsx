import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { circulationService } from '../services/circulationService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  DollarSign,
  Clock,
  Loader2,
  Receipt,
  BookOpen,
  User,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { axiosInstance } from '../../../shared/api/axiosInstance';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

export const ReturnedUnpaidFines: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    data: unpaidFines,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
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

  const formatDateSafe = (dateStr?: string, fmt = 'dd/MM/yyyy') => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '—' : format(d, fmt);
    } catch {
      return '—';
    }
  };

  const getFineReason = (loan: any) => {
    if (loan.dueDate && loan.returnDate) {
      try {
        const due = new Date(loan.dueDate).getTime();
        const ret = new Date(loan.returnDate).getTime();
        const diffDays = Math.max(1, Math.ceil((ret - due) / (1000 * 60 * 60 * 24)));
        if (diffDays > 0 && ret > due) {
          return `Trả trễ ${diffDays} ngày`;
        }
      } catch {
        // fallback
      }
    }
    if (loan.overdueDays && loan.overdueDays > 0) {
      return `Trả trễ ${loan.overdueDays} ngày`;
    }
    return 'Quá hạn trả sách';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Loader2 className="animate-spin h-5 w-5" />
            </div>
            <div>
              <Skeleton className="h-5 w-52 rounded-lg" />
              <Skeleton className="h-3.5 w-64 mt-1.5 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-7 w-32 rounded-full" />
        </div>
        <div className="space-y-2.5 pt-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-6 p-6 bg-rose-50/70 rounded-2xl border border-rose-200 text-rose-800 space-y-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-rose-900">Không thể tải danh sách phiếu nợ phạt</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Đã xảy ra lỗi khi lấy danh sách phiếu mượn đã trả còn tồn đọng phí. Vui lòng kiểm tra lại kết nối.
            </p>
          </div>
        </div>
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl border-rose-300 text-rose-800 hover:bg-rose-100 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw size={13} className="mr-1.5" />
            Thử tải lại
          </Button>
        </div>
      </div>
    );
  }

  if (!unpaidFines || unpaidFines.length === 0) {
    return (
      <div className="mt-6 p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-2xs">
          <CheckCircle2 size={24} />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h4 className="font-bold text-slate-800 text-sm sm:text-base">Không có phiếu đã trả còn nợ phạt</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Toàn bộ các khoản phạt quá hạn của sách đã hoàn trả đều đã được thu đầy đủ hoặc không phát sinh phí quá hạn tồn đọng.
          </p>
        </div>
      </div>
    );
  }

  const totalUnpaidAmount = unpaidFines.reduce(
    (sum, item) => sum + (item.fineAmount || 0),
    0
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs mt-6">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60 shadow-2xs">
            <Receipt size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Phiếu Đã Trả Còn Nợ Phạt
              </h3>
              {isFetching && (
                <RefreshCw size={13} className="animate-spin text-rose-600" title="Đang đồng bộ..." />
              )}
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Theo dõi và thu các khoản phạt quá hạn sau khi độc giả đã hoàn trả sách vào kho
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {totalUnpaidAmount > 0 && (
            <Badge
              variant="outline"
              className="bg-rose-50 text-rose-800 border-rose-200 text-xs font-bold px-2.5 py-1"
            >
              <AlertTriangle size={12} className="mr-1 text-rose-600" />
              Tổng nợ: {totalUnpaidAmount.toLocaleString('vi-VN')}đ
            </Badge>
          )}
          <Badge
            variant="outline"
            className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-semibold px-2.5 py-1"
          >
            {unpaidFines.length} phiếu chưa nộp
          </Badge>
        </div>
      </div>

      {/* Warning Notice Banner */}
      <div className="px-4 py-2.5 bg-rose-50/50 border-b border-rose-100/80 flex items-center gap-2 text-xs text-rose-800">
        <AlertCircle size={14} className="shrink-0 text-rose-600" />
        <span className="leading-tight">
          <strong>Lưu ý thủ thư:</strong> Các phiếu dưới đây đã ghi nhận nhận lại sách nhưng độc giả chưa hoàn tất nộp phạt quá hạn. Cần thu phí trước khi giải quyết lượt mượn tiếp theo.
        </span>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="divide-y divide-slate-100 block md:hidden">
        {unpaidFines.map((loan) => {
          const isPendingPay =
            payFineMutation.isPending && payFineMutation.variables === loan.id;
          const reason = getFineReason(loan);

          return (
            <div
              key={`mobile-unpaid-${loan.id}`}
              className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors bg-rose-50/10"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-0.5">
                    <BookOpen size={13} className="text-teal-600 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-400">ID: {loan.bookId}</span>
                  </div>
                  <h4
                    className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug"
                    title={loan.bookTitle}
                  >
                    {loan.bookTitle}
                  </h4>
                </div>

                <Badge
                  variant="outline"
                  className="shrink-0 border-rose-200 bg-rose-50 text-rose-700 text-[10px] uppercase font-bold tracking-wider"
                >
                  Chưa thu phạt
                </Badge>
              </div>

              {/* Reader & Timing Details */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                    <User size={11} /> Độc giả:
                  </span>
                  <span className="font-semibold text-slate-800 truncate block mt-0.5">
                    {loan.userName}
                  </span>
                  <span className="font-mono text-[11px] text-teal-700 font-bold block">
                    Thẻ: {loan.userId}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={11} /> Ngày trả / Hạn:
                  </span>
                  <span className="font-semibold text-slate-700 block mt-0.5">
                    Trả: {formatDateSafe(loan.returnDate)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Hạn: {formatDateSafe(loan.dueDate)}
                  </span>
                </div>
              </div>

              {/* Fine Info Box */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <div>
                  <span className="text-[10px] text-rose-600 uppercase font-bold block">
                    Lý do phát sinh
                  </span>
                  <span className="font-semibold text-rose-900">{reason}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-rose-600 uppercase font-bold block">
                    Số tiền phạt
                  </span>
                  <span className="font-mono text-sm font-extrabold text-rose-700">
                    {(loan.fineAmount || 0).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => payFineMutation.mutate(loan.id)}
                  disabled={payFineMutation.isPending}
                  className="w-full h-9 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isPendingPay ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang xử lý thu phạt...</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>Ghi nhận thu tiền phạt</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block w-full overflow-x-auto">
        <Table className="min-w-[800px] table-fixed">
          <TableHeader className="bg-slate-50/90 border-b border-slate-200/80">
            <TableRow>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[240px] pl-5">
                Tài liệu đã trả
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[180px]">
                Độc giả
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[160px]">
                Lịch sử mượn trả
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[140px]">
                Lý do phạt
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[130px]">
                Số tiền phạt
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[110px]">
                Trạng thái
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider text-right w-[140px] pr-5">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {unpaidFines.map((loan) => {
              const isPendingPay =
                payFineMutation.isPending && payFineMutation.variables === loan.id;
              const reason = getFineReason(loan);

              return (
                <TableRow
                  key={loan.id}
                  className="hover:bg-rose-50/20 transition-colors bg-rose-50/5"
                >
                  {/* Book Info */}
                  <TableCell className="pl-5 py-3.5 align-middle">
                    <div className="flex flex-col pr-2">
                      <span
                        className="font-bold text-slate-800 text-sm line-clamp-1 hover:text-teal-700 transition-colors cursor-default"
                        title={loan.bookTitle}
                      >
                        {loan.bookTitle}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: {loan.bookId}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400 font-mono" title={loan.id}>
                          Phiếu: {loan.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Reader Info */}
                  <TableCell className="py-3.5 align-middle">
                    <div className="flex flex-col pr-2">
                      <span className="font-semibold text-slate-800 text-sm line-clamp-1">
                        {loan.userName}
                      </span>
                      <span className="text-xs text-teal-700 font-mono font-bold mt-0.5">
                        Thẻ: {loan.userId}
                      </span>
                    </div>
                  </TableCell>

                  {/* Borrow & Return Timing */}
                  <TableCell className="py-3.5 align-middle">
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-slate-800">
                        Trả ngày: {formatDateSafe(loan.returnDate)}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        Hạn ban đầu: {formatDateSafe(loan.dueDate)}
                      </span>
                    </div>
                  </TableCell>

                  {/* Fine Reason */}
                  <TableCell className="py-3.5 align-middle">
                    <span className="text-xs font-semibold text-rose-800 bg-rose-50/80 px-2 py-1 rounded-md border border-rose-200/60 inline-block">
                      {reason}
                    </span>
                  </TableCell>

                  {/* Fine Amount */}
                  <TableCell className="py-3.5 align-middle">
                    <span className="font-mono text-sm font-extrabold text-rose-700">
                      {(loan.fineAmount || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-3.5 align-middle">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold tracking-wider rounded-md px-2 py-0.5 border-rose-200 bg-rose-50 text-rose-700"
                    >
                      Chưa thu
                    </Badge>
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right pr-5 py-3.5 align-middle">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => payFineMutation.mutate(loan.id)}
                      disabled={payFineMutation.isPending}
                      className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors cursor-pointer w-full max-w-[130px] inline-flex items-center justify-center gap-1"
                    >
                      {isPendingPay ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Đang xử lý</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-3 w-3" />
                          <span>Thu tiền phạt</span>
                        </>
                      )}
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


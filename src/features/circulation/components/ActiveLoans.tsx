import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { circulationService } from '../services/circulationService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  RefreshCw,
  DollarSign,
  BookOpen,
  User,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
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

  const { data: loans, isLoading, isError, refetch, isFetching } = useQuery({
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Clock className="animate-spin h-5 w-5" />
            </div>
            <div>
              <Skeleton className="h-5 w-48 rounded-lg" />
              <Skeleton className="h-3.5 w-64 mt-1.5 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="space-y-2.5 pt-2">
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
      <div className="p-6 bg-rose-50/70 rounded-2xl border border-rose-200 text-rose-800 space-y-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-rose-900">Không thể tải danh sách phiếu mượn</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Đã xảy ra lỗi khi đồng bộ dữ liệu với máy chủ. Vui lòng kiểm tra lại đường truyền mạng.
            </p>
          </div>
        </div>
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl border-rose-300 text-rose-800 hover:bg-rose-100 text-xs font-semibold"
          >
            <RotateCcw size={13} className="mr-1.5" />
            Thử tải lại
          </Button>
        </div>
      </div>
    );
  }

  if (!loans || loans.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-2xs">
          <BookOpen size={28} />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h4 className="font-bold text-slate-800 text-base">Hiện không có phiếu mượn nào</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Toàn bộ sách đã được hoàn trả hoặc chưa phát sinh giao dịch mượn mới. Bạn có thể thực hiện cho mượn tài liệu tại bảng điều khiển bên trên.
          </p>
        </div>
      </div>
    );
  }

  const overdueCount = loans.filter(
    (l) => l.status === 'Overdue' || new Date(l.dueDate) < new Date()
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-2xs">
            <Clock size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Phiếu Mượn Sách Đang Hoạt Động</h3>
              {isFetching && (
                <RefreshCw size={13} className="animate-spin text-teal-600" title="Đang đồng bộ..." />
              )}
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Theo dõi hạn trả, trạng thái quá hạn và gia hạn mượn tức thời
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <Badge
              variant="outline"
              className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-bold px-2.5 py-1"
            >
              <AlertTriangle size={12} className="mr-1" />
              {overdueCount} quá hạn
            </Badge>
          )}
          <Badge
            variant="outline"
            className="bg-teal-50/80 text-teal-800 border-teal-200 text-xs font-semibold px-2.5 py-1"
          >
            Tổng số: {loans.length} phiếu
          </Badge>
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="divide-y divide-slate-100 block md:hidden">
        {loans.map((loan) => {
          const isOverdue = loan.status === 'Overdue' || new Date(loan.dueDate) < new Date();
          const overdueDays =
            loan.overdueDays !== undefined
              ? loan.overdueDays
              : isOverdue
              ? Math.max(1, Math.ceil((Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
              : 0;
          const fineAmount = loan.fineAmount !== undefined ? loan.fineAmount : 0;
          const isPaid = loan.finePaid === true;

          return (
            <div
              key={`mobile-${loan.id}`}
              className={`p-4 space-y-3 transition-colors ${
                isOverdue ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-0.5">
                    <BookOpen size={13} className="text-teal-600 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-400">ID: {loan.bookId}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug" title={loan.bookTitle}>
                    {loan.bookTitle}
                  </h4>
                </div>

                <div className="shrink-0">
                  {isOverdue && loan.status !== 'Returned' ? (
                    <Badge
                      variant="outline"
                      className="border-rose-200 bg-rose-50 text-rose-700 text-[10px] uppercase font-bold tracking-wider"
                    >
                      <AlertTriangle size={11} className="mr-1 text-rose-600" />
                      Quá hạn ({overdueDays} ngày)
                    </Badge>
                  ) : loan.status === 'Returned' ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] uppercase font-bold tracking-wider"
                    >
                      <CheckCircle2 size={11} className="mr-1 text-emerald-600" />
                      Đã trả
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-teal-200 bg-teal-50 text-teal-700 text-[10px] uppercase font-bold tracking-wider"
                    >
                      Đang mượn
                    </Badge>
                  )}
                </div>
              </div>

              {/* Reader & Due Date row */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                    <User size={11} /> Độc giả:
                  </span>
                  <span className="font-semibold text-slate-800 truncate block mt-0.5">
                    {loan.userName}
                  </span>
                  <span className="font-mono text-[10px] text-teal-700 font-medium block">
                    Thẻ: {loan.userId}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={11} /> Hạn trả:
                  </span>
                  <span
                    className={`font-bold block mt-0.5 ${
                      isOverdue ? 'text-rose-600' : 'text-slate-700'
                    }`}
                  >
                    {format(new Date(loan.dueDate), 'dd/MM/yyyy')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Mã phiếu: {loan.id.slice(0, 8)}
                  </span>
                </div>
              </div>

              {/* Fine status if applicable */}
              {fineAmount > 0 && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs">
                  <span className="text-rose-800 font-medium">Tiền phạt quá hạn:</span>
                  <span className={`font-bold ${isPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {fineAmount.toLocaleString('vi-VN')}đ ({isPaid ? 'Đã thu' : 'Chưa nộp'})
                  </span>
                </div>
              )}

              {/* Actions row */}
              <div className="flex items-center gap-2 pt-1">
                {loan.status !== 'Returned' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 rounded-xl text-xs font-semibold text-teal-700 border-teal-200 hover:bg-teal-50 cursor-pointer"
                    onClick={() => renewMutation.mutate(loan.id)}
                    disabled={renewMutation.isPending}
                  >
                    <RefreshCw
                      size={12}
                      className={`mr-1.5 ${
                        renewMutation.isPending && renewMutation.variables === loan.id
                          ? 'animate-spin'
                          : ''
                      }`}
                    />
                    Gia hạn mượn
                  </Button>
                )}

                {fineAmount > 0 && !isPaid && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 flex-1 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    onClick={() => payFineMutation.mutate(loan.id)}
                    disabled={payFineMutation.isPending}
                  >
                    <DollarSign size={12} className="mr-1" />
                    Thu tiền phạt
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block w-full overflow-x-auto">
        <Table className="min-w-[760px] table-fixed">
          <TableHeader className="bg-slate-50/90 border-b border-slate-200/80">
            <TableRow>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[260px] pl-5">
                Tên tài liệu / Sách
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[180px]">
                Độc giả mượn
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[140px]">
                Hạn trả sách
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[140px]">
                Trạng thái
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider text-right w-[140px] pr-5">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {loans.map((loan) => {
              const isOverdue = loan.status === 'Overdue' || new Date(loan.dueDate) < new Date();
              const overdueDays =
                loan.overdueDays !== undefined
                  ? loan.overdueDays
                  : isOverdue
                  ? Math.max(1, Math.ceil((Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
                  : 0;
              const fineAmount = loan.fineAmount !== undefined ? loan.fineAmount : 0;
              const isPaid = loan.finePaid === true;

              return (
                <TableRow
                  key={loan.id}
                  className={`hover:bg-teal-50/20 transition-colors ${
                    isOverdue ? 'bg-rose-50/25' : ''
                  }`}
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
                        <span className="font-mono text-[11px] text-slate-400">
                          ID: {loan.bookId}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-[10px] text-slate-400" title={loan.id}>
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
                      <span className="font-mono text-[11px] text-teal-700 font-semibold mt-0.5">
                        Thẻ: {loan.userId}
                      </span>
                    </div>
                  </TableCell>

                  {/* Due Date */}
                  <TableCell className="py-3.5 align-middle">
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-bold ${
                          isOverdue ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {format(new Date(loan.dueDate), 'dd/MM/yyyy')}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        {isOverdue ? `Đã quá ${overdueDays} ngày` : 'Trong hạn'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status & Fine */}
                  <TableCell className="py-3.5 align-middle">
                    <div className="flex flex-col items-start gap-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-bold tracking-wider rounded-md px-2 py-0.5 ${
                          isOverdue && loan.status !== 'Returned'
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : loan.status === 'Returned'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-teal-200 bg-teal-50 text-teal-700'
                        }`}
                      >
                        {isOverdue && loan.status !== 'Returned' ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={11} />
                            Quá hạn
                          </span>
                        ) : loan.status === 'Active' ? (
                          'Đang mượn'
                        ) : loan.status === 'Returned' ? (
                          'Đã trả'
                        ) : (
                          loan.status
                        )}
                      </Badge>
                      {fineAmount > 0 && (
                        <span
                          className={`text-[11px] font-bold leading-tight ${
                            isPaid ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          Phạt: {fineAmount.toLocaleString('vi-VN')}đ ({isPaid ? 'Đã thu' : 'Chưa nộp'})
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Action Buttons */}
                  <TableCell className="text-right pr-5 py-3.5 align-middle">
                    <div className="flex flex-col gap-1.5 items-end justify-center">
                      {loan.status !== 'Returned' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-teal-700 border-teal-200 hover:bg-teal-50 hover:text-teal-800 font-semibold w-full max-w-[130px] rounded-lg transition-colors cursor-pointer"
                          onClick={() => renewMutation.mutate(loan.id)}
                          disabled={renewMutation.isPending}
                        >
                          <RefreshCw
                            className={`w-3 h-3 mr-1 ${
                              renewMutation.isPending && renewMutation.variables === loan.id
                                ? 'animate-spin'
                                : ''
                            }`}
                          />
                          Gia hạn
                        </Button>
                      )}

                      {fineAmount > 0 && !isPaid && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold w-full max-w-[130px] rounded-lg transition-colors cursor-pointer"
                          onClick={() => payFineMutation.mutate(loan.id)}
                          disabled={payFineMutation.isPending}
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          Thu tiền phạt
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


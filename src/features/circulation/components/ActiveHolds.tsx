import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { circulationService } from '../services/circulationService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import {
  Hand,
  Loader2,
  ArrowRightLeft,
  BookOpen,
  User,
  Calendar,
  Clock,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  Bookmark,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

export const ActiveHolds: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: holds,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['activeHolds'],
    queryFn: circulationService.getActiveHolds,
    refetchInterval: 15000 // Refetch every 15s to keep UI updated
  });

  const fulfillMutation = useMutation({
    mutationFn: circulationService.fulfillHold,
    onSuccess: () => {
      toast.success('Mượn sách thành công cho lượt đặt trước');
      queryClient.invalidateQueries({ queryKey: ['activeHolds'] });
      queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['memberLoans'] });
      queryClient.invalidateQueries({ queryKey: ['memberHolds'] });
      queryClient.invalidateQueries({ queryKey: ['memberHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Không thể tiến hành xử lý cho mượn sách. Vui lòng kiểm tra lại.'));
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Loader2 className="animate-spin h-5 w-5" />
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
            <h4 className="font-bold text-sm text-rose-900">Không thể tải danh sách đặt giữ sách</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Đã xảy ra lỗi khi đồng bộ danh sách hàng chờ. Vui lòng kiểm tra lại kết nối mạng.
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

  if (!holds || holds.length === 0) {
    return (
      <div className="mt-6 p-10 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs">
          <Bookmark size={26} />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h4 className="font-bold text-slate-800 text-base">Chưa có yêu cầu đặt giữ sách nào</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hiện tại không có độc giả nào xếp hàng chờ giữ tài liệu. Khi một cuốn sách hết bản khả dụng và bạn đọc yêu cầu đặt giữ, danh sách sẽ hiển thị tại đây.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs mt-6">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs">
            <Hand size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Danh Sách Yêu Cầu Đặt Giữ Sách (Holds Queue)
              </h3>
              {isFetching && (
                <RefreshCw size={13} className="animate-spin text-amber-600" title="Đang đồng bộ..." />
              )}
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Theo dõi danh sách xếp hàng chờ tài liệu và xuất kho cho mượn khi sách sẵn sàng
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="bg-amber-50/80 text-amber-800 border-amber-200 text-xs font-semibold px-2.5 py-1 w-fit"
        >
          Tổng cộng: {holds.length} lượt đặt giữ
        </Badge>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="divide-y divide-slate-100 block md:hidden">
        {holds.map((hold: any) => {
          const isPendingFulfill =
            fulfillMutation.isPending && fulfillMutation.variables === hold.id;
          const isExpired = hold.expiryDate ? new Date(hold.expiryDate) < new Date() : false;

          return (
            <div key={`mobile-hold-${hold.id}`} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-0.5">
                    <BookOpen size={13} className="text-amber-600 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-400">ID: {hold.bookId}</span>
                  </div>
                  <h4
                    className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug"
                    title={hold.bookTitle || hold.bookId}
                  >
                    {hold.bookTitle || hold.bookId}
                  </h4>
                </div>

                <Badge
                  variant="outline"
                  className="shrink-0 border-amber-200 bg-amber-50 text-amber-700 text-[10px] uppercase font-bold tracking-wider"
                >
                  <Clock size={11} className="mr-1" />
                  Chờ xử lý
                </Badge>
              </div>

              {/* Reader & Date Details */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                    <User size={11} /> Độc giả:
                  </span>
                  <span className="font-bold text-teal-800 font-mono text-xs block mt-0.5">
                    {hold.userId}
                  </span>
                  {hold.userName && (
                    <span className="text-[11px] text-slate-600 truncate block">
                      {hold.userName}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={11} /> Ngày đặt:
                  </span>
                  <span className="font-semibold text-slate-700 block mt-0.5">
                    {formatDateSafe(hold.createdAt)}
                  </span>
                  {hold.expiryDate && (
                    <span
                      className={`text-[10px] font-medium block mt-0.5 ${
                        isExpired ? 'text-rose-600' : 'text-slate-500'
                      }`}
                    >
                      Hạn giữ: {formatDateSafe(hold.expiryDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fulfillMutation.mutate(hold.id)}
                  disabled={fulfillMutation.isPending}
                  className="w-full h-9 rounded-xl text-xs font-bold text-teal-700 border-teal-200 bg-teal-50/60 hover:bg-teal-100 hover:text-teal-800 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  {isPendingFulfill ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang xuất mượn...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      <span>Xác nhận cho mượn sách</span>
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
        <Table className="min-w-[760px] table-fixed">
          <TableHeader className="bg-slate-50/90 border-b border-slate-200/80">
            <TableRow>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[260px] pl-5">
                Tên sách đặt giữ
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[180px]">
                Độc giả
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[140px]">
                Ngày đặt giữ
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[140px]">
                Hạn giữ sách
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider w-[120px]">
                Trạng thái
              </TableHead>
              <TableHead className="font-bold text-slate-700 uppercase text-xs tracking-wider text-right w-[140px] pr-5">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {holds.map((hold: any) => {
              const isPendingFulfill =
                fulfillMutation.isPending && fulfillMutation.variables === hold.id;
              const isExpired = hold.expiryDate ? new Date(hold.expiryDate) < new Date() : false;

              return (
                <TableRow
                  key={hold.id}
                  className="hover:bg-teal-50/20 transition-colors"
                >
                  {/* Book details */}
                  <TableCell className="pl-5 py-3.5 align-middle">
                    <div className="flex flex-col pr-2">
                      <span
                        className="font-bold text-slate-800 text-sm line-clamp-1 hover:text-teal-700 transition-colors cursor-default"
                        title={hold.bookTitle || hold.bookId}
                      >
                        {hold.bookTitle || hold.bookId}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: {hold.bookId}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400 font-mono" title={hold.id}>
                          Yêu cầu: {hold.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Reader */}
                  <TableCell className="py-3.5 align-middle">
                    <div className="flex flex-col pr-2">
                      <span className="font-mono text-sm text-teal-700 font-bold">
                        {hold.userId}
                      </span>
                      {hold.userName && (
                        <span className="text-xs text-slate-600 font-medium truncate mt-0.5">
                          {hold.userName}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Hold Date */}
                  <TableCell className="py-3.5 align-middle">
                    <span className="text-sm font-semibold text-slate-700">
                      {formatDateSafe(hold.createdAt)}
                    </span>
                  </TableCell>

                  {/* Expiration Date */}
                  <TableCell className="py-3.5 align-middle">
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-semibold ${
                          isExpired ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {formatDateSafe(hold.expiryDate)}
                      </span>
                      {hold.expiryDate && (
                        <span
                          className={`text-[11px] mt-0.5 ${
                            isExpired ? 'text-rose-500 font-medium' : 'text-slate-400'
                          }`}
                        >
                          {isExpired ? 'Đã hết hạn giữ' : 'Trong thời hạn'}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5 align-middle">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold tracking-wider rounded-md px-2 py-0.5 border-amber-200 bg-amber-50 text-amber-700"
                    >
                      <Clock size={11} className="mr-1" />
                      Chờ xử lý
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right pr-5 py-3.5 align-middle">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fulfillMutation.mutate(hold.id)}
                      disabled={fulfillMutation.isPending}
                      className="h-8 text-xs text-teal-700 border-teal-200 bg-teal-50/50 hover:bg-teal-100 hover:text-teal-800 font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      {isPendingFulfill ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Đang xử lý</span>
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="h-3 w-3" />
                          <span>Cho mượn</span>
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


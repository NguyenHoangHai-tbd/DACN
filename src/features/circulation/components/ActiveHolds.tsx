import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { circulationService } from '../services/circulationService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Hand, Loader2, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

export const ActiveHolds: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: holds, isLoading, isError } = useQuery({
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-slate-500 animate-pulse flex items-center gap-2">
          <Loader2 className="animate-spin text-amber-600" size={16} />
          Đang tải danh sách đặt giữ sách...
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-600 bg-red-50 rounded-xl border border-red-100 font-medium">
        Không thể tải dữ liệu danh sách đặt giữ sách.
      </div>
    );
  }

  if (!holds || holds.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm mt-6">
        Chưa có yêu cầu đặt giữ sách nào đang chờ duyệt.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-6">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Hand className="text-amber-600" size={18} />
          <h3 className="font-bold text-slate-800">Danh Sách Yêu Cầu Đặt Giữ Sách</h3>
        </div>
        <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold">
          Tổng cộng: {holds.length} lượt đặt giữ
        </Badge>
      </div>
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[700px] table-fixed">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[240px]">Tên sách đặt giữ</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[180px]">Mã độc giả</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[130px]">Ngày đặt giữ</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[120px]">Trạng thái</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider text-right w-[115px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holds.map((hold: any) => {
              return (
                <TableRow key={hold.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-800">
                    <div className="flex flex-col pr-2">
                      <span className="font-bold text-slate-800 line-clamp-1" title={hold.bookTitle || hold.bookId}>
                        {hold.bookTitle || hold.bookId}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Book ID: {hold.bookId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-indigo-600 font-bold">{hold.userId}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-slate-600">
                      {format(new Date(hold.createdAt), 'dd/MM/yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-amber-200 bg-amber-50 text-amber-700">
                      Cần Xử Lý
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fulfillMutation.mutate(hold.id)}
                      disabled={fulfillMutation.isPending}
                      className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold"
                    >
                      {fulfillMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ArrowRightLeft className="h-4 w-4 mr-1"/>}
                      Cho mượn
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

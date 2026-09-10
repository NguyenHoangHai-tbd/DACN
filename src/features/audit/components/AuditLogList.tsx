import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { auditService } from '../services/auditService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, ShieldAlert, Download, Eye, FileSearch, Sparkles, Filter, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export const AuditLogList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['auditLogs', { search, entityFilter, actionFilter }],
    queryFn: () => auditService.getLogs({ search, entity: entityFilter, action: actionFilter }),
    refetchInterval: 30000 
  });

  const { data: logDetail, isLoading: logDetailLoading } = useQuery({
    queryKey: ['auditLogDetail', selectedLogId],
    queryFn: () => auditService.getLogDetail(selectedLogId!),
    enabled: !!selectedLogId
  });

  const exportMutation = useMutation({
    mutationFn: () => auditService.exportLogs(),
    onSuccess: (data) => {
      toast.success('Xuất log thành công. Đang tải xuống...');
      window.open(data.url, '_blank');
    }
  });

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case 'Tenant': return 'Thư viện';
      case 'Report': return 'Báo cáo';
      case 'User': return 'Tài khoản';
      case 'Book': return 'Tài liệu';
      case 'Member': return 'Độc giả';
      case 'Loan': return 'Mượn trả';
      case 'Policy': return 'Chính sách';
      case 'System': return 'Hệ thống';
      default: return entity;
    }
  };

  const getActionBadge = (action: string) => {
    switch(action) {
      case 'Create': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 text-[10px]">Thêm mới</Badge>;
      case 'Update': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/80 text-[10px]">Cập nhật</Badge>;
      case 'Delete': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100/80 text-[10px]">Xóa</Badge>;
      case 'Login': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100/80 text-[10px]">Đăng nhập</Badge>;
      case 'Query': return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100/80 text-[10px]">Truy vấn</Badge>;
      case 'Export': return <Badge className="bg-violet-100 text-violet-800 hover:bg-violet-100/80 text-[10px]">Xuất file</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Tìm user, ID hoặc chi tiết..." 
              className="pl-9 bg-slate-50 border-slate-200"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[140px] bg-white">
              <Filter className="w-4 h-4 mr-2 text-slate-500" />
              <SelectValue placeholder="Đối tượng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả đối tượng</SelectItem>
              <SelectItem value="Book">Tài liệu</SelectItem>
              <SelectItem value="Member">Độc giả</SelectItem>
              <SelectItem value="Loan">Mượn trả</SelectItem>
              <SelectItem value="Policy">Chính sách</SelectItem>
              <SelectItem value="System">Hệ thống</SelectItem>
              <SelectItem value="Tenant">Thư viện</SelectItem>
              <SelectItem value="Report">Báo cáo</SelectItem>
              <SelectItem value="User">Tài khoản</SelectItem>
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Hành động" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả hành động</SelectItem>
              <SelectItem value="Create">Tạo mới</SelectItem>
              <SelectItem value="Update">Cập nhật</SelectItem>
              <SelectItem value="Delete">Xóa</SelectItem>
              <SelectItem value="Login">Đăng nhập</SelectItem>
              <SelectItem value="Query">Truy vấn / chạy báo cáo</SelectItem>
              <SelectItem value="Export">Xuất dữ liệu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="outline" 
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="shrink-0 font-bold"
        >
          {exportMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Download size={16} className="mr-2" />}
          Xuất nhật ký
        </Button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-600 uppercase text-xs">Thời gian</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs">Người thực hiện</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs">Hành động / Đối tượng</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs">Mô tả chi tiết</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs">Địa chỉ IP</TableHead>
              <TableHead className="font-bold text-slate-600 uppercase text-xs text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               Array(5).fill(0).map((_, i) => (
                 <TableRow key={i}>
                   <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                   <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                   <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                   <TableCell><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                   <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                   <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                 </TableRow>
               ))
            ) : !logs || logs.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                   <FileSearch size={32} className="mx-auto mb-3 opacity-20" />
                   Không tìm thấy nhật ký hoạt động nào phù hợp.
                 </TableCell>
               </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className={log.isAnomalous ? 'bg-red-50/50 hover:bg-red-50' : ''}>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500">
                    {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900 text-sm hidden-scrollbar max-w-[150px] truncate">{log.actor}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{getEntityLabel(log.entity)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-600 line-clamp-1 max-w-[200px] xl:max-w-xs">{log.details}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{log.ipAddress}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 hover:bg-slate-100 ${log.isAnomalous ? 'text-red-600 hover:text-red-700' : 'text-indigo-600 hover:text-indigo-700'}`}
                      onClick={() => setSelectedLogId(log.id)}
                    >
                      <Eye size={16} className="mr-1.5" /> Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Log Detail Panel */}
      <Sheet open={!!selectedLogId} onOpenChange={(open: boolean) => !open && setSelectedLogId(null)}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <FileSearch className="text-indigo-600" />
              Chi tiết nhật ký hoạt động
            </SheetTitle>
          </SheetHeader>
          
          {logDetailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : logDetail ? (
            <div className="space-y-6 pb-12">
               <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-4 text-sm">
                 <div>
                   <span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Log ID</span>
                   <span className="font-mono text-slate-800">{logDetail.id}</span>
                 </div>
                 <div>
                   <span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Correlation ID</span>
                   <span className="font-mono text-slate-800">{logDetail.correlationId || 'N/A'}</span>
                 </div>
                 <div>
                   <span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Thời gian</span>
                   <span className="font-medium text-slate-800">{format(new Date(logDetail.timestamp), 'dd/MM/yyyy HH:mm:ss')}</span>
                 </div>
                 <div>
                   <span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">IP Address</span>
                   <span className="font-mono text-slate-800">{logDetail.ipAddress}</span>
                 </div>
                 <div className="col-span-2">
                   <span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Actor</span>
                   <span className="font-medium text-slate-800">{logDetail.actor}</span>
                 </div>
                 <div className="col-span-2 pt-2 border-t border-slate-200">
                   <span className="text-slate-500 block mb-1 uppercase text-[10px] font-bold">Hành động</span>
                   <div className="flex items-center gap-2">
                     {getActionBadge(logDetail.action)}
                     <span className="font-bold text-slate-600 uppercase tracking-widest text-xs"> {getEntityLabel(logDetail.entity)} </span> 
                     <span className="text-slate-500 text-xs">({logDetail.entityId})</span>
                   </div>
                 </div>
               </div>

               <div>
                 <h4 className="font-bold text-slate-800 mb-2">Mô tả</h4>
                 <div className="bg-white border text-sm text-slate-700 border-slate-200 rounded-lg p-3 w-full">
                   {logDetail.details}
                 </div>
               </div>

               {logDetail.oldValues || logDetail.newValues ? (
                 <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                   <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                     <h4 className="font-bold text-slate-800 text-sm">Dữ liệu thay đổi (Diff)</h4>
                   </div>
                   <div className="flex flex-col md:flex-row min-w-0 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                     <div className="flex-1 p-4 bg-red-50/30 overflow-x-auto">
                       <div className="font-bold text-xs uppercase text-red-600 tracking-widest mb-3">Dữ liệu cũ</div>
                       <pre className="text-xs font-mono text-slate-700">
                         {logDetail.oldValues ? JSON.stringify(logDetail.oldValues, null, 2) : 'null'}
                       </pre>
                     </div>
                     <div className="flex-1 p-4 bg-emerald-50/30 overflow-x-auto">
                       <div className="font-bold text-xs uppercase text-emerald-600 tracking-widest mb-3">Dữ liệu mới</div>
                       <pre className="text-xs font-mono text-slate-700">
                         {logDetail.newValues ? JSON.stringify(logDetail.newValues, null, 2) : 'null'}
                       </pre>
                     </div>
                   </div>
                 </div>
               ) : null}

               {logDetail.userAgent && (
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2 text-sm">User Agent</h4>
                    <div className="bg-slate-50 border text-xs font-mono text-slate-500 border-slate-200 rounded-lg p-3 w-full break-all">
                      {logDetail.userAgent}
                    </div>
                  </div>
               )}
            </div>
          ) : (
            <div className="text-center p-8 text-slate-500">Không tìm thấy chi tiết.</div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

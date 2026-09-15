import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { auditService } from '../services/auditService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Search,
  ShieldAlert,
  Download,
  Eye,
  FileSearch,
  Filter,
  RotateCw,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Globe,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AuditLogList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: logs, isLoading, isError, refetch, isFetching } = useQuery({
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
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: () => {
      toast.error('Không thể xuất nhật ký kiểm toán. Vui lòng thử lại sau.');
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
      case 'Create':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200/80 text-[11px] font-semibold px-2 py-0.5 rounded-md">Thêm mới</Badge>;
      case 'Update':
        return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200/80 text-[11px] font-semibold px-2 py-0.5 rounded-md">Cập nhật</Badge>;
      case 'Delete':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200/80 text-[11px] font-semibold px-2 py-0.5 rounded-md">Xóa</Badge>;
      case 'Login':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200/80 text-[11px] font-semibold px-2 py-0.5 rounded-md">Đăng nhập</Badge>;
      case 'Query':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200/80 text-[11px] font-semibold px-2 py-0.5 rounded-md">Truy vấn</Badge>;
      case 'Export':
        return <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200/80 text-[11px] font-semibold px-2 py-0.5 rounded-md">Xuất file</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200/80 text-[11px] font-semibold px-2 py-0.5 rounded-md">{action}</Badge>;
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return format(d, 'dd/MM/yyyy HH:mm:ss');
    } catch {
      return ts;
    }
  };

  // Client-side sort
  const sortedLogs = useMemo(() => {
    if (!logs) return [];
    return [...logs].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [logs, sortOrder]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLogs.slice(start, start + pageSize);
  }, [sortedLogs, currentPage, pageSize]);

  const anomalousCount = useMemo(() => logs?.filter(l => l.isAnomalous).length ?? 0, [logs]);
  const hasActiveFilters = search.trim() !== '' || entityFilter !== 'all' || actionFilter !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setEntityFilter('all');
    setActionFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <FileSearch size={18} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base">Nhật ký kiểm toán & Hệ thống</h3>
              <Badge variant="outline" className="text-[11px] font-semibold text-teal-700 bg-teal-50 border-teal-200/80">
                {logs?.length ?? 0} bản ghi
              </Badge>
              {anomalousCount > 0 && (
                <Badge variant="outline" className="text-[11px] font-semibold text-rose-700 bg-rose-50 border-rose-200/80 flex items-center gap-1">
                  <ShieldAlert size={12} /> {anomalousCount} cảnh báo
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Lưu vết toàn bộ lịch sử truy cập, thay đổi dữ liệu và cảnh báo an ninh trong hệ thống thư viện
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80 rounded-xl cursor-pointer"
          >
            <RotateCw size={14} className={`mr-1.5 ${isFetching ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            Làm mới
          </Button>

          <Button 
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="h-9 px-3.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl cursor-pointer shadow-xs"
          >
            {exportMutation.isPending ? (
              <RotateCw size={14} className="animate-spin mr-1.5" />
            ) : (
              <Download size={14} className="mr-1.5" />
            )}
            Xuất nhật ký
          </Button>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input 
              placeholder="Tìm theo user, chi tiết hoặc IP..." 
              className="pl-9 pr-8 bg-slate-50 border-slate-200/80 rounded-xl text-xs h-9 focus-visible:ring-teal-500 placeholder:text-slate-400"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          {/* Entity Filter */}
          <div className="sm:col-span-3">
            <Select
              value={entityFilter}
              onValueChange={val => {
                setEntityFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-slate-50 border-slate-200/80 text-slate-700 rounded-xl text-xs h-9">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter size={13} className="text-slate-400 shrink-0" />
                  <SelectValue placeholder="Đối tượng" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200/80 shadow-md rounded-xl text-xs">
                <SelectItem value="all">Tất cả đối tượng</SelectItem>
                <SelectItem value="Book">Tài liệu (Book)</SelectItem>
                <SelectItem value="Member">Độc giả (Member)</SelectItem>
                <SelectItem value="Loan">Mượn trả (Loan)</SelectItem>
                <SelectItem value="Policy">Chính sách (Policy)</SelectItem>
                <SelectItem value="System">Hệ thống (System)</SelectItem>
                <SelectItem value="Tenant">Thư viện (Tenant)</SelectItem>
                <SelectItem value="Report">Báo cáo (Report)</SelectItem>
                <SelectItem value="User">Tài khoản (User)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Filter */}
          <div className="sm:col-span-2">
            <Select
              value={actionFilter}
              onValueChange={val => {
                setActionFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-slate-50 border-slate-200/80 text-slate-700 rounded-xl text-xs h-9">
                <SelectValue placeholder="Hành động" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200/80 shadow-md rounded-xl text-xs">
                <SelectItem value="all">Tất cả hành động</SelectItem>
                <SelectItem value="Create">Tạo mới</SelectItem>
                <SelectItem value="Update">Cập nhật</SelectItem>
                <SelectItem value="Delete">Xóa</SelectItem>
                <SelectItem value="Login">Đăng nhập</SelectItem>
                <SelectItem value="Query">Truy vấn</SelectItem>
                <SelectItem value="Export">Xuất dữ liệu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order & Reset */}
          <div className="sm:col-span-2 flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex-1 h-9 px-2 text-xs font-medium text-slate-700 border-slate-200/80 hover:bg-slate-50 rounded-xl cursor-pointer"
              title={`Sắp xếp: ${sortOrder === 'desc' ? 'Mới nhất trước' : 'Cũ nhất trước'}`}
            >
              <ArrowUpDown size={13} className="mr-1 text-slate-500" />
              {sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer shrink-0"
                title="Bỏ lọc"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Summary & Live Feed Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>
              Hiển thị <strong className="text-slate-800 font-semibold">{sortedLogs.length}</strong> bản ghi
            </span>
            {hasActiveFilters && (
              <span className="text-teal-700 font-medium">
                (Đang áp dụng bộ lọc)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tự động cập nhật mỗi 30 giây</span>
          </div>
        </div>
      </div>

      {/* Main Content: Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center bg-rose-50/70 text-slate-800 space-y-3">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-1">
              <AlertCircle size={24} />
            </div>
            <h4 className="font-bold text-base text-slate-900">Không thể tải nhật ký kiểm toán</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Hệ thống gặp sự cố khi kết nối tới máy chủ hoặc dữ liệu nhật ký chưa sẵn sàng.
            </p>
            <Button
              onClick={() => refetch()}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl h-9 px-4 cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCw size={13} /> Thử lại
            </Button>
          </div>
        ) : sortedLogs.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-2">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileSearch size={22} />
            </div>
            <p className="font-semibold text-slate-800 text-sm">
              {hasActiveFilters ? 'Không tìm thấy nhật ký phù hợp' : 'Chưa có nhật ký hoạt động nào'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {hasActiveFilters 
                ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc đối tượng / hành động.'
                : 'Chưa có dữ liệu kiểm toán nào được ghi nhận trong khoảng thời gian này.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-3 text-xs text-teal-700 border-teal-200/80 hover:bg-teal-50 rounded-xl"
              >
                Xóa bộ lọc tìm kiếm
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {paginatedLogs.map(log => (
                <div
                  key={log.id}
                  className={`p-4 space-y-3 transition-colors ${
                    log.isAnomalous 
                      ? 'bg-rose-50/50 hover:bg-rose-50/80 border-l-3 border-l-rose-500' 
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Row 1: Timestamp & Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono">
                      <Clock size={12} className="text-slate-400" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {getActionBadge(log.action)}
                      {log.isAnomalous && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                          <ShieldAlert size={10} /> Cảnh báo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Actor & IP */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                        <User size={12} />
                      </div>
                      <span className="font-semibold text-slate-800 truncate">{log.actor}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 shrink-0">
                      <Globe size={11} className="text-slate-400" />
                      <span>{log.ipAddress}</span>
                    </div>
                  </div>

                  {/* Row 3: Entity & Details */}
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100/80">
                      <span>{getEntityLabel(log.entity)}</span>
                      {log.entityId && <span className="font-mono text-slate-500">#{log.entityId}</span>}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {log.details}
                    </p>
                  </div>

                  {/* Row 4: Action button */}
                  <div className="pt-1 flex justify-end border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLogId(log.id)}
                      className="h-8 px-2.5 text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg font-semibold cursor-pointer"
                    >
                      <Eye size={13} className="mr-1" /> Chi tiết
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
                    <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[18%] tracking-wider pl-6">
                      Thời gian
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[18%] tracking-wider">
                      Người thực hiện
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[20%] tracking-wider">
                      Hành động & Đối tượng
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[24%] tracking-wider">
                      Mô tả chi tiết
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[10%] tracking-wider">
                      Địa chỉ IP
                    </TableHead>
                    <TableHead className="font-bold text-slate-700 uppercase text-[11px] w-[10%] tracking-wider text-right pr-6">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map(log => (
                    <TableRow
                      key={log.id}
                      className={`text-xs border-b border-slate-100 transition-colors ${
                        log.isAnomalous 
                          ? 'bg-rose-50/50 hover:bg-rose-50/80 border-l-3 border-l-rose-500' 
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Column 1: Timestamp */}
                      <TableCell className="py-3.5 pl-6 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-slate-600 text-xs">
                          <Clock size={13} className="text-slate-400 shrink-0" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </TableCell>

                      {/* Column 2: Actor */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <User size={13} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-xs truncate block">{log.actor}</span>
                            {log.tenantId && (
                              <span className="text-[10px] text-slate-400 font-mono">Tenant: {log.tenantId}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Column 3: Action & Entity */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getActionBadge(log.action)}
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                            {getEntityLabel(log.entity)}
                          </span>
                          {log.isAnomalous && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                              <ShieldAlert size={10} /> Cảnh báo
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Column 4: Details */}
                      <TableCell className="py-3.5 text-slate-600 text-xs">
                        <div className="line-clamp-2 leading-relaxed" title={log.details}>
                          {log.details}
                        </div>
                      </TableCell>

                      {/* Column 5: IP */}
                      <TableCell className="py-3.5 font-mono text-slate-500 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Globe size={12} className="text-slate-400 shrink-0" />
                          <span>{log.ipAddress}</span>
                        </div>
                      </TableCell>

                      {/* Column 6: Actions */}
                      <TableCell className="text-right py-3.5 pr-6 whitespace-nowrap">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedLogId(log.id)}
                          className={`h-8 px-2.5 text-xs font-semibold rounded-lg cursor-pointer ${
                            log.isAnomalous 
                              ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50' 
                              : 'text-teal-700 hover:text-teal-800 hover:bg-teal-50'
                          }`}
                        >
                          <Eye size={13} className="mr-1" /> Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-500 text-[11px]">
                  Trang <strong className="text-slate-800 font-semibold">{currentPage}</strong> / {totalPages} (Tổng {sortedLogs.length} bản ghi)
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2 text-xs rounded-lg border-slate-200/80 hover:bg-white cursor-pointer disabled:opacity-40"
                  >
                    <ChevronLeft size={14} className="mr-0.5" /> Trước
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 p-0 text-xs rounded-lg cursor-pointer ${
                        currentPage === page
                          ? 'bg-teal-600 hover:bg-teal-700 text-white font-bold border-teal-600'
                          : 'border-slate-200/80 hover:bg-white text-slate-700'
                      }`}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2 text-xs rounded-lg border-slate-200/80 hover:bg-white cursor-pointer disabled:opacity-40"
                  >
                    Sau <ChevronRight size={14} className="ml-0.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Log Detail Panel Sheet */}
      <Sheet open={!!selectedLogId} onOpenChange={(open: boolean) => !open && setSelectedLogId(null)}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto bg-white border-l border-slate-200/80 p-6">
          <SheetHeader className="mb-5 pb-3 border-b border-slate-100">
            <SheetTitle className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <FileSearch size={18} />
              </div>
              <span>Chi tiết nhật ký kiểm toán</span>
            </SheetTitle>
          </SheetHeader>
          
          {logDetailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-xl" />
            </div>
          ) : logDetail ? (
            <div className="space-y-5 pb-8">
              {/* Anomalous Alert Banner if applicable */}
              {logDetail.isAnomalous && (
                <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>Cảnh báo: Hành động này bị hệ thống đánh dấu là bất thường hoặc có dấu hiệu rủi ro bảo mật.</span>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1 uppercase text-[10px] font-bold">Mã bản ghi (Log ID)</span>
                  <span className="font-mono text-slate-800 font-semibold">{logDetail.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1 uppercase text-[10px] font-bold">Correlation ID</span>
                  <span className="font-mono text-slate-800">{logDetail.correlationId || 'Không có'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1 uppercase text-[10px] font-bold">Thời gian ghi nhận</span>
                  <span className="font-medium text-slate-800">{formatTimestamp(logDetail.timestamp)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1 uppercase text-[10px] font-bold">Địa chỉ IP</span>
                  <span className="font-mono text-slate-800">{logDetail.ipAddress}</span>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block mb-1 uppercase text-[10px] font-bold">Người thực hiện</span>
                    <span className="font-bold text-slate-900 text-sm">{logDetail.actor}</span>
                  </div>
                  {logDetail.tenantId && (
                    <div className="text-right">
                      <span className="text-slate-400 block mb-1 uppercase text-[10px] font-bold">Mã thư viện (Tenant)</span>
                      <span className="font-mono text-slate-700">{logDetail.tenantId}</span>
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 block mb-1 uppercase text-[10px] font-bold">Hành động & Thực thể</span>
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    {getActionBadge(logDetail.action)}
                    <span className="font-bold text-slate-700 uppercase tracking-wide text-xs">
                      {getEntityLabel(logDetail.entity)}
                    </span> 
                    {logDetail.entityId && (
                      <span className="text-slate-500 font-mono text-xs">({logDetail.entityId})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Mô tả chi tiết</h4>
                <div className="bg-white border text-xs text-slate-700 border-slate-200/80 rounded-xl p-3.5 leading-relaxed shadow-2xs">
                  {logDetail.details}
                </div>
              </div>

              {/* Diff (Old values vs New values) */}
              {(logDetail.oldValues || logDetail.newValues) && (
                <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200/80">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Thay đổi dữ liệu (Diff)</h4>
                  </div>
                  <div className="flex flex-col md:flex-row min-w-0 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
                    <div className="flex-1 p-3.5 bg-rose-50/20 overflow-x-auto">
                      <div className="font-bold text-[10px] uppercase text-rose-600 tracking-wider mb-2">Dữ liệu trước thay đổi</div>
                      <pre className="text-[11px] font-mono text-slate-700 leading-relaxed">
                        {logDetail.oldValues ? JSON.stringify(logDetail.oldValues, null, 2) : 'null'}
                      </pre>
                    </div>
                    <div className="flex-1 p-3.5 bg-emerald-50/20 overflow-x-auto">
                      <div className="font-bold text-[10px] uppercase text-emerald-600 tracking-wider mb-2">Dữ liệu sau thay đổi</div>
                      <pre className="text-[11px] font-mono text-slate-700 leading-relaxed">
                        {logDetail.newValues ? JSON.stringify(logDetail.newValues, null, 2) : 'null'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* User Agent */}
              {logDetail.userAgent && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">User Agent & Thiết bị</h4>
                  <div className="bg-slate-50 border text-[11px] font-mono text-slate-600 border-slate-200/80 rounded-xl p-3 break-all leading-relaxed">
                    {logDetail.userAgent}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 text-slate-400 text-xs">Không tìm thấy thông tin chi tiết của bản ghi này.</div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};


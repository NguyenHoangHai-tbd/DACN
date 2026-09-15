import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { reportService } from '../services/reportService';
import { adminService } from '../../admin/services/adminService';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileBarChart2,
  FileDown,
  Play,
  AlertTriangle,
  RotateCw,
  BarChart3,
  Building2,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Coins
} from 'lucide-react';
import { toast } from 'sonner';
import { ReportFilter } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SearchableSelect } from '@/shared/components/SearchableSelect';

export const ReportBuilder: React.FC = () => {
  const { t } = useTranslation();
  const [selectedDataset, setSelectedDataset] = useState<string>('ds-circulation');
  const [filters, setFilters] = useState<ReportFilter>({
    dateRange: 'this_month',
    branchId: 'all',
    groupBy: 'date'
  });

  const [hasRun, setHasRun] = useState(true);

  const { data: datasets = [] } = useQuery({
    queryKey: ['reportDatasets'],
    queryFn: reportService.getDatasets
  });

  const datasetOptions = (datasets || []).map(d => ({
    label: d.name,
    value: d.id,
    description: d.description
  }));

  const selectedDatasetInfo = datasets.find(d => d.id === selectedDataset);

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: adminService.getBranches
  });

  const {
    data: previewData,
    isLoading: loadingPreview,
    isError: isPreviewError,
    refetch: runPreview,
    isFetching: isFetchingPreview
  } = useQuery({
    queryKey: ['reportPreview', selectedDataset, filters],
    queryFn: () => reportService.runReport(selectedDataset, filters),
    enabled: !!selectedDataset
  });

  const exportMutation = useMutation({
    mutationFn: (format: 'excel' | 'pdf' | 'csv') => reportService.exportReport(selectedDataset, filters, format),
    onSuccess: (res, variables) => {
      const formatLabel = variables === 'excel' ? 'Excel' : variables === 'pdf' ? 'PDF' : 'CSV';
      toast.success(`Đã xuất báo cáo ${formatLabel} thành công`);
      if (res.url) {
        window.open(res.url, '_blank');
      }
    },
    onError: () => toast.error(t('reports.toast_export_err', 'Lỗi khi xuất báo cáo'))
  });

  const handleRunReport = () => {
    if (!selectedDataset) {
      toast.error(t('reports.toast_select_dataset', 'Vui lòng chọn Dataset'));
      return;
    }
    setHasRun(true);
    runPreview().then((res) => {
      if (res.isError) {
        toast.error(t('reports.toast_run_err', 'Không thể tạo báo cáo'));
      } else {
        toast.success(t('reports.toast_run_success', 'Đã cập nhật báo cáo thành công'));
      }
    }).catch(() => {
      toast.error(t('reports.toast_run_err', 'Không thể tạo báo cáo'));
    });
  };

  const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
    if (!selectedDataset) return;
    exportMutation.mutate(format);
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100/80 flex items-center justify-center shrink-0">
            <FileBarChart2 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Báo cáo & Thống kê thư viện</h2>
              <Badge variant="outline" className="text-[11px] font-semibold text-teal-700 bg-teal-50 border-teal-200/80">
                Trực quan hóa dữ liệu
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tổng hợp dữ liệu mượn trả, độc giả, danh mục sách và tiền phạt trong hệ thống thư viện
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 px-3 text-xs font-semibold border-slate-200/80 text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-xl cursor-pointer disabled:opacity-50"
            onClick={() => handleExport('excel')}
            disabled={!previewData || previewData.rows.length === 0 || exportMutation.isPending}
          >
            {exportMutation.isPending && exportMutation.variables === 'excel' ? (
              <RotateCw size={13} className="animate-spin mr-1.5 text-teal-600" />
            ) : (
              <FileSpreadsheet size={14} className="mr-1.5 text-emerald-600" />
            )}
            {t('reports.export_excel_btn', 'Xuất Excel')}
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            className="h-9 px-3 text-xs font-semibold border-slate-200/80 text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-xl cursor-pointer disabled:opacity-50"
            onClick={() => handleExport('pdf')}
            disabled={!previewData || previewData.rows.length === 0 || exportMutation.isPending}
          >
            {exportMutation.isPending && exportMutation.variables === 'pdf' ? (
              <RotateCw size={13} className="animate-spin mr-1.5 text-teal-600" />
            ) : (
              <FileText size={14} className="mr-1.5 text-rose-600" />
            )}
            Xuất PDF
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            className="h-9 px-3 text-xs font-semibold border-slate-200/80 text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-xl cursor-pointer disabled:opacity-50"
            onClick={() => handleExport('csv')}
            disabled={!previewData || previewData.rows.length === 0 || exportMutation.isPending}
          >
            {exportMutation.isPending && exportMutation.variables === 'csv' ? (
              <RotateCw size={13} className="animate-spin mr-1.5 text-teal-600" />
            ) : (
              <FileDown size={14} className="mr-1.5 text-slate-600" />
            )}
            CSV
          </Button>
        </div>
      </div>

      {/* Main Grid Layout: Left Controls + Right Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Configuration Panel (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <BarChart3 size={15} />
              </div>
              Trình tạo báo cáo
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Tham số truy vấn</span>
          </div>

          {/* Dataset Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Layers size={13} className="text-slate-400" />
              {t('reports.dataset_label', 'Mẫu báo cáo (Dataset)')}
            </label>
            <SearchableSelect
              options={datasetOptions}
              value={selectedDataset}
              onChange={setSelectedDataset}
              placeholder={t('reports.dataset_placeholder', 'Chọn dataset...')}
              className="text-xs"
            />
            {selectedDatasetInfo?.description && (
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                {selectedDatasetInfo.description}
              </p>
            )}
          </div>

          {/* Period Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              {t('reports.period_label', 'Kỳ báo cáo')}
            </label>
            <Select value={filters.dateRange} onValueChange={(val) => setFilters(f => ({ ...f, dateRange: val }))}>
              <SelectTrigger className="w-full bg-slate-50 border-slate-200/80 text-slate-800 rounded-xl text-xs h-9 focus-visible:ring-teal-500">
                <SelectValue placeholder={t('reports.period_placeholder', 'Chọn thời gian...')} />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200/80 shadow-lg rounded-xl text-xs">
                <SelectItem value="today">{t('reports.today', 'Hôm nay')}</SelectItem>
                <SelectItem value="this_week">{t('reports.this_week', 'Tuần này')}</SelectItem>
                <SelectItem value="this_month">{t('reports.this_month', 'Tháng này')}</SelectItem>
                <SelectItem value="last_month">{t('reports.last_month', 'Tháng trước')}</SelectItem>
                <SelectItem value="this_quarter">{t('reports.this_quarter', 'Quý này')}</SelectItem>
                <SelectItem value="this_year">{t('reports.this_year', 'Năm nay')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Branch Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Building2 size={13} className="text-slate-400" />
              {t('reports.target_branch_label', 'Chi nhánh thư viện')}
            </label>
            <Select value={filters.branchId} onValueChange={(val) => setFilters(f => ({ ...f, branchId: val }))}>
              <SelectTrigger className="w-full bg-slate-50 border-slate-200/80 text-slate-800 rounded-xl text-xs h-9 focus-visible:ring-teal-500">
                <SelectValue placeholder={t('reports.all_branches', 'Toàn hệ thống')} />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200/80 shadow-lg rounded-xl text-xs">
                <SelectItem value="all">{t('reports.all_branches', 'Toàn hệ thống')}</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group By Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <BarChart3 size={13} className="text-slate-400" />
              {t('reports.groupby_label', 'Phân nhóm theo')}
            </label>
            <Select value={filters.groupBy} onValueChange={(val) => setFilters(f => ({ ...f, groupBy: val }))}>
              <SelectTrigger className="w-full bg-slate-50 border-slate-200/80 text-slate-800 rounded-xl text-xs h-9 focus-visible:ring-teal-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200/80 shadow-lg rounded-xl text-xs">
                <SelectItem value="date">{t('reports.groupby_date', 'Theo Ngày (Xu hướng)')}</SelectItem>
                <SelectItem value="branch">{t('reports.groupby_branch', 'Theo Chi nhánh')}</SelectItem>
                <SelectItem value="category">{t('reports.groupby_category', 'Theo Danh mục Sách')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Run Button */}
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-10 rounded-xl cursor-pointer shadow-xs mt-2"
            onClick={handleRunReport}
            disabled={!selectedDataset || loadingPreview || isFetchingPreview}
          >
            {loadingPreview || isFetchingPreview ? (
              <span className="flex items-center gap-2">
                <RotateCw size={14} className="animate-spin" /> Đang tạo báo cáo...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play size={14} className="fill-current" /> Chạy báo cáo
              </span>
            )}
          </Button>
        </div>

        {/* Right Output Area (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-5">
          {!hasRun ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs h-[380px] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 bg-slate-50 border border-slate-200/80 text-slate-300 rounded-2xl flex items-center justify-center mb-3">
                <FileBarChart2 size={30} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Chưa tạo báo cáo</h4>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                {t('reports.empty_guidance', 'Chọn Dataset và thiết lập bộ lọc phù hợp, sau đó nhấn "Chạy báo cáo" để xem kết quả.')}
              </p>
            </div>
          ) : loadingPreview ? (
            <div className="space-y-4">
              {/* Skeleton Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-2">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-7 w-28 rounded-lg" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-[280px] w-full rounded-2xl" />
              <Skeleton className="h-[200px] w-full rounded-2xl" />
            </div>
          ) : isPreviewError ? (
            <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-8 text-center text-slate-800 max-w-lg mx-auto space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-1">
                <AlertCircle size={24} />
              </div>
              <h4 className="font-bold text-base text-slate-900">Không thể tạo dữ liệu báo cáo</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Máy chủ gặp sự cố khi xử lý dữ liệu cho bộ lọc đã chọn hoặc thời gian phản hồi quá hạn.
              </p>
              <Button
                onClick={handleRunReport}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl h-9 px-4 cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCw size={13} /> Thử lại
              </Button>
            </div>
          ) : (
            <>
              {/* Overview Summary KPI Cards */}
              {previewData?.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Card 1: Total Loans */}
                  <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-100/80 flex items-center justify-center shrink-0">
                      <BookOpen size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight truncate">Tổng lượt mượn</p>
                      <p className="text-lg sm:text-xl font-bold text-slate-900">{previewData.summary.totalLoans.toLocaleString('vi-VN')}</p>
                    </div>
                  </div>

                  {/* Card 2: Total Returns */}
                  <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100/80 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight truncate">Tổng lượt trả</p>
                      <p className="text-lg sm:text-xl font-bold text-slate-900">{previewData.summary.totalReturns.toLocaleString('vi-VN')}</p>
                    </div>
                  </div>

                  {/* Card 3: Overdue Books */}
                  <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-100/80 flex items-center justify-center shrink-0">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight truncate">Sách quá hạn</p>
                      <p className="text-lg sm:text-xl font-bold text-rose-600">{previewData.summary.overdueBooks.toLocaleString('vi-VN')}</p>
                    </div>
                  </div>

                  {/* Card 4: Total Fines */}
                  <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100/80 flex items-center justify-center shrink-0">
                      <Coins size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight truncate">Tổng tiền phạt</p>
                      <p className="text-lg sm:text-xl font-bold text-amber-600 truncate">{previewData.summary.totalFines.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart Preview (Line trend when grouped by date) */}
              {previewData && previewData.rows.length > 0 && filters.groupBy === 'date' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 h-[320px]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {selectedDatasetInfo?.name || 'Xu hướng biến động'}
                      </h3>
                      <p className="text-[11px] text-slate-500">Dữ liệu theo thời gian thực thi</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold text-teal-700 bg-teal-50 border-teal-200/80">
                      Biểu đồ đường
                    </Badge>
                  </div>
                  <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={previewData.rows}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey={previewData.columns[0]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#64748B' }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#64748B' }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px', 
                          border: '1px solid #E2E8F0', 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                          fontSize: '12px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey={previewData.columns[1]} 
                        stroke="#0D9488" 
                        strokeWidth={2.5} 
                        dot={{ r: 4, fill: '#0D9488', strokeWidth: 0 }} 
                        activeDot={{ r: 6, fill: '#0F766E' }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Data Table Preview Grid */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">Xem trước bảng dữ liệu</h3>
                  </div>
                  {previewData && (
                    <span className="text-[11px] font-semibold bg-white text-slate-600 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                      {t('reports.display_results', 'Hiển thị')} {previewData.rows.length} / {previewData.totalRows} {t('reports.results_suffix', 'kết quả')}
                    </span>
                  )}
                </div>

                {previewData ? (
                  previewData.rows.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 space-y-2">
                      <FileBarChart2 size={32} className="mx-auto text-slate-300" />
                      <p className="text-xs font-medium text-slate-600">Chưa có bản ghi nào cho tiêu chí báo cáo này</p>
                      <p className="text-[11px] text-slate-400">Hãy thử đổi kỳ báo cáo hoặc chọn chi nhánh khác.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="min-w-full w-full">
                        <TableHeader className="bg-slate-50/80 border-b border-slate-200/80">
                          <TableRow>
                            {previewData.columns.map((col, idx) => (
                              <TableHead 
                                key={col} 
                                className={`font-bold text-slate-700 uppercase text-[11px] tracking-wider py-3 ${
                                  idx === 0 ? 'pl-6' : idx === previewData.columns.length - 1 ? 'pr-6 text-right' : ''
                                }`}
                              >
                                {col}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.rows.map((row, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50/70 transition-colors text-xs border-b border-slate-100">
                              {previewData.columns.map((col, cIdx) => (
                                <TableCell 
                                  key={col} 
                                  className={`py-3.5 text-slate-700 ${
                                    cIdx === 0 
                                      ? 'pl-6 font-semibold text-slate-900' 
                                      : cIdx === previewData.columns.length - 1 
                                        ? 'pr-6 text-right font-medium' 
                                        : 'font-medium'
                                  }`}
                                >
                                  {col === 'Tiền phạt' && typeof row[col] === 'number' 
                                    ? `${row[col].toLocaleString('vi-VN')}đ` 
                                    : typeof row[col] === 'number'
                                      ? row[col].toLocaleString('vi-VN')
                                      : row[col]}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


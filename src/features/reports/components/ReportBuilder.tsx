import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { reportService } from '../services/reportService';
import { adminService } from '../../admin/services/adminService';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileBarChart2, FileDown, Play, AlertTriangle, TrendingUp, TrendingDown, Loader2, BarChart2 } from 'lucide-react';
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

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: adminService.getBranches
  });

  const { data: previewData, isLoading: loadingPreview, refetch: runPreview } = useQuery({
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
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
               <FileBarChart2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Báo cáo & Thống kê</h2>
              <p className="text-sm text-slate-500">Tổng hợp dữ liệu mượn trả, độc giả, sách và tiền phạt trong thư viện</p>
            </div>
         </div>
         <div className="flex gap-2">
            <Button 
               variant="outline" 
               className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
               onClick={() => handleExport('excel')}
               disabled={!previewData || previewData.rows.length === 0 || exportMutation.isPending}
            >
               <FileDown size={16} className="mr-2" /> {t('reports.export_excel_btn', 'Xuất Excel')}
            </Button>
            <Button 
               variant="outline" 
               className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
               onClick={() => handleExport('pdf')}
               disabled={!previewData || previewData.rows.length === 0 || exportMutation.isPending}
            >
               <FileDown size={16} className="mr-2" /> PDF
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Configuration Panel */}
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 lg:col-span-1 h-fit">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
               <BarChart2 size={18} className="text-indigo-600" /> Trình tạo báo cáo
            </h3>

            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-600 uppercase">{t('reports.dataset_label', 'Dataset (Mẫu báo cáo)')}</label>
               <SearchableSelect
                 options={datasetOptions}
                 value={selectedDataset}
                 onChange={setSelectedDataset}
                 placeholder={t('reports.dataset_placeholder', 'Chọn dataset...')}
               />
               {/*
                 <SelectTrigger>
                   <SelectValue placeholder={t('reports.dataset_placeholder', 'Chọn dataset...')} />
                 </SelectTrigger>
                 </SelectContent>
               </Select>*/}
            </div>

            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-600 uppercase">{t('reports.period_label', 'Kỳ báo cáo')}</label>
               <Select value={filters.dateRange} onValueChange={(val) => setFilters(f => ({ ...f, dateRange: val }))}>
                 <SelectTrigger>
                   <SelectValue placeholder={t('reports.period_placeholder', 'Chọn thời gian...')} />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="today">{t('reports.today', 'Hôm nay')}</SelectItem>
                   <SelectItem value="this_week">{t('reports.this_week', 'Tuần này')}</SelectItem>
                   <SelectItem value="this_month">{t('reports.this_month', 'Tháng này')}</SelectItem>
                   <SelectItem value="last_month">{t('reports.last_month', 'Tháng trước')}</SelectItem>
                   <SelectItem value="this_quarter">{t('reports.this_quarter', 'Quý này')}</SelectItem>
                   <SelectItem value="this_year">{t('reports.this_year', 'Năm nay')}</SelectItem>
                 </SelectContent>
               </Select>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-600 uppercase">{t('reports.target_branch_label', 'Chi nhánh mục tiêu')}</label>
               <Select value={filters.branchId} onValueChange={(val) => setFilters(f => ({ ...f, branchId: val }))}>
                 <SelectTrigger>
                   <SelectValue placeholder={t('reports.all_branches', 'Toàn hệ thống')} />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">{t('reports.all_branches', 'Toàn hệ thống')}</SelectItem>
                   {branches.map(b => (
                     <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-600 uppercase">{t('reports.groupby_label', 'Nhóm theo')}</label>
               <Select value={filters.groupBy} onValueChange={(val) => setFilters(f => ({ ...f, groupBy: val }))}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="date">{t('reports.groupby_date', 'Theo Ngày')}</SelectItem>
                   <SelectItem value="branch">{t('reports.groupby_branch', 'Theo Chi nhánh')}</SelectItem>
                   <SelectItem value="category">{t('reports.groupby_category', 'Theo Danh mục Sách')}</SelectItem>
                 </SelectContent>
               </Select>
            </div>

            <Button 
               className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold mt-4"
               onClick={handleRunReport}
               disabled={!selectedDataset || loadingPreview}
            >
               {loadingPreview ? <Loader2 size={16} className="animate-spin mr-2" /> : <Play size={16} className="mr-2" />}
               Chạy báo cáo
            </Button>
         </div>

         {/* Data Grid */}
         <div className="lg:col-span-3 space-y-6">
            {!hasRun ? (
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col items-center justify-center text-slate-400">
                  <FileBarChart2 size={48} className="mb-4 opacity-20" />
                  <p>{t('reports.empty_guidance', 'Chọn Dataset và thiết lập bộ lọc để chạy báo cáo.')}</p>
               </div>
            ) : (
               <>
                  {/* Overview Statistics Cards */}
                  {previewData?.summary && (
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                           <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
                              <Play size={20} className="transform rotate-90" />
                           </div>
                           <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Tổng lượt mượn</p>
                              <p className="text-xl font-black text-slate-800">{previewData.summary.totalLoans}</p>
                           </div>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                           <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
                              <TrendingUp size={20} />
                           </div>
                           <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Tổng Lượt Trả</p>
                              <p className="text-xl font-black text-slate-800">{previewData.summary.totalReturns}</p>
                           </div>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                           <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl">
                              <AlertTriangle size={20} />
                           </div>
                           <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Sách Quá Hạn</p>
                              <p className="text-xl font-black text-rose-600">{previewData.summary.overdueBooks}</p>
                           </div>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                           <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
                              <TrendingDown size={20} className="text-amber-600" />
                           </div>
                           <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Tổng Tiền Phạt</p>
                              <p className="text-xl font-black text-amber-600">{previewData.summary.totalFines.toLocaleString('vi-VN')}đ</p>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Chart Preview */}
                  {previewData && previewData.rows.length > 0 && filters.groupBy === 'date' && (
                     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-[300px]">
                        <h3 className="font-bold text-slate-800 mb-4">{datasets.find(d => d.id === selectedDataset)?.name} - Xu hướng</h3>
                        <ResponsiveContainer width="100%" height="80%">
                           <LineChart data={previewData.rows}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                             <XAxis dataKey={previewData.columns[0]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                             <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                             <Line type="monotone" dataKey={previewData.columns[1]} stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                           </LineChart>
                        </ResponsiveContainer>
                     </div>
                  )}

                  {/* Preview Grid */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                     <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Xem trước dữ liệu</h3>
                        {previewData && (
                           <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                              {t('reports.display_results', 'Hiển thị')} {previewData.rows.length} / {previewData.totalRows} {t('reports.results_suffix', 'kết quả')}
                           </span>
                        )}
                     </div>
                     {loadingPreview ? (
                        <div className="p-8 text-center text-slate-500 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
                     ) : previewData ? (
                        previewData.rows.length === 0 ? (
                           <div className="p-12 text-center text-slate-400">
                              <FileBarChart2 size={36} className="mx-auto mb-2 opacity-30 text-indigo-600" />
                              <p className="text-sm font-medium">Chưa có dữ liệu cho báo cáo này</p>
                           </div>
                        ) : (
                           <div className="overflow-x-auto">
                              <Table>
                                 <TableHeader className="bg-slate-50">
                                    <TableRow>
                                       {previewData.columns.map(col => (
                                          <TableHead key={col} className="font-bold text-slate-700 text-xs uppercase">{col}</TableHead>
                                       ))}
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {previewData.rows.map((row, idx) => (
                                       <TableRow key={idx}>
                                          {previewData.columns.map(col => (
                                             <TableCell key={col} className="text-sm font-medium text-slate-600">
                                                {col === 'Tiền phạt' && typeof row[col] === 'number' ? `${row[col].toLocaleString('vi-VN')}đ` : row[col]}
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

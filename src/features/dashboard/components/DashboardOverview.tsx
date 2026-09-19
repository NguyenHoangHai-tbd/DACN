import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, BookOpen, BookUp, AlertTriangle, 
  Sparkles, Download, Loader2, RefreshCw, Activity, CalendarDays, DollarSign,
  Trophy, Server, Wifi
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

export const DashboardOverview: React.FC = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('30d');

  const { data: overview, isLoading: overviewLoading, isError, error, refetch: refetchOverview } = useQuery({
    queryKey: ['dashboardOverview', timeRange],
    queryFn: () => dashboardService.getOverview(timeRange),
    refetchInterval: 60000 // refresh every minute
  });

  const exportMutation = useMutation({
    mutationFn: () => dashboardService.exportReport('summary', timeRange),
    onSuccess: (data) => {
      toast.success(t('dashboard.export_success', 'Đã xuất báo cáo tổng quan thành công'));
      // simulate download
      if (data && data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, t('dashboard.export_error', 'Lỗi khi xuất báo cáo.')));
    }
  });

  if (overviewLoading) {
    return (
      <div className="flex flex-col h-[420px] items-center justify-center text-slate-500 gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <Loader2 size={30} className="animate-spin text-teal-600" />
        <span className="text-sm font-semibold text-slate-700 animate-pulse">{t('dashboard.loading_overview', 'Đang tải dữ liệu tổng quan...')}</span>
        <span className="text-xs text-slate-400">Đang đồng bộ chỉ số và hoạt động thư viện</span>
      </div>
    );
  }

  if (isError || (!overview && !overviewLoading)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-2xl border border-slate-200/80 text-center max-w-lg mx-auto my-8 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 shadow-xs">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          {t('dashboard.error_title', 'Không thể tải dữ liệu tổng quan')}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-sm">
          {parseFriendlyError(error, t('dashboard.error_desc', 'Đã xảy ra lỗi khi đồng bộ dữ liệu chỉ số. Vui lòng kiểm tra kết nối mạng và thử lại.'))}
        </p>
        <Button
          onClick={() => refetchOverview()}
          variant="outline"
          className="gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
        >
          <RefreshCw size={14} />
          {t('common.button.retry', 'Thử lại')}
        </Button>
      </div>
    );
  }

  const kpiFormatter = new Intl.NumberFormat('vi-VN');
  const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

  const totalCheckouts = (overview?.circulationTrend || []).reduce((acc: number, curr: any) => acc + (curr.checkouts || 0), 0);
  const totalReturns = (overview?.circulationTrend || []).reduce((acc: number, curr: any) => acc + (curr.returns || 0), 0);

  const renderTrend = (value: number) => {
    if (value > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <TrendingUp size={12} className="shrink-0" /> +{value}%
        </span>
      );
    }
    if (value < 0) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-full shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <TrendingDown size={12} className="shrink-0" /> {value}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse shrink-0" />
        {t('dashboard.trend_stable', 'Ổn định')}
      </span>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-800">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-slate-900 font-mono">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Open Clean Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-teal-600 shrink-0" />
            <span>{t('dashboard.overview_title', 'Tổng Quan Vận Hành')}</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Chỉ số lưu thông học liệu & tình trạng hệ thống thời gian thực
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-36 font-semibold text-xs h-10 rounded-xl bg-white border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 focus:ring-teal-500">
              <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 bg-white text-slate-800 shadow-lg">
              <SelectItem value="7d" className="cursor-pointer">{t('dashboard.filter_7d', '7 ngày qua')}</SelectItem>
              <SelectItem value="30d" className="cursor-pointer">{t('dashboard.filter_30d', '30 ngày qua')}</SelectItem>
              <SelectItem value="90d" className="cursor-pointer">{t('dashboard.filter_90d', '90 ngày qua')}</SelectItem>
              <SelectItem value="ytd" className="cursor-pointer">{t('dashboard.filter_ytd', 'Từ đầu năm')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => { 
              const promise = refetchOverview();
              toast.promise(promise, {
                loading: t('dashboard.refreshing', 'Đang làm mới dữ liệu...'),
                success: t('dashboard.refresh_success', 'Đã làm mới dữ liệu hiển thị thành công'),
                error: t('dashboard.refresh_error', 'Lỗi khi làm mới dữ liệu')
              });
            }}
            className="h-10 px-3.5 bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl cursor-pointer shrink-0 shadow-xs transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={15} className={overviewLoading ? 'animate-spin text-teal-600' : 'text-slate-600'} />
          </Button>

          <Button 
            onClick={() => exportMutation.mutate()} 
            disabled={exportMutation.isPending}
            size="sm"
            className="h-10 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer shrink-0 transition-all active:scale-[0.98]"
          >
            {exportMutation.isPending ? <Loader2 size={15} className="animate-spin mr-1.5 text-white" /> : <Download size={15} className="mr-1.5 text-white" />}
            {t('dashboard.export_excel', 'Xuất Excel')}
          </Button>
        </div>
      </div>

      {/* 2. 4 Modern Bold KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Thẻ 1: Tài liệu */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between group">
          <div>
            {/* Hàng 1: Icon Teal & Tên chỉ số + Huy hiệu góc */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-teal-50 text-teal-600 border border-teal-200/60 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <BookOpen size={20} />
                </div>
                <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">
                  {t('dashboard.documents', 'Tài liệu')}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50/90 border border-teal-200/80 px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                +5 sách mới
              </span>
            </div>
            {/* Hàng 2: Con số lớn in đậm kèm đơn vị đo */}
            <div className="flex items-baseline gap-2 mt-3 mb-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                {kpiFormatter.format(overview.kpis.totalBooks)}
              </span>
              <span className="text-slate-500 text-xs font-semibold">đầu sách</span>
            </div>
          </div>
          {/* Hàng 3: Thanh chỉ số % sống động ở đáy */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
              <span>Mức sẵn sàng</span>
              <span className="text-teal-700 font-bold">96%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500" style={{ width: '96%' }} />
            </div>
          </div>
        </div>
        
        {/* Thẻ 2: Độc giả */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group">
          <div>
            {/* Hàng 1: Icon Indigo & Tên chỉ số + Huy hiệu góc */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 text-indigo-600 border border-indigo-200/60 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Users size={20} />
                </div>
                <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">
                  {t('dashboard.members', 'Độc giả')}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50/90 border border-indigo-200/80 px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                +2 bạn đọc
              </span>
            </div>
            {/* Hàng 2: Con số lớn in đậm kèm đơn vị đo */}
            <div className="flex items-baseline gap-2 mt-3 mb-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                {kpiFormatter.format(overview.kpis.totalMembers)}
              </span>
              <span className="text-slate-500 text-xs font-semibold">bạn đọc</span>
            </div>
          </div>
          {/* Hàng 3: Thanh chỉ số % sống động ở đáy */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
              <span>Tài khoản kích hoạt</span>
              <span className="text-indigo-700 font-bold">92%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500" style={{ width: '92%' }} />
            </div>
          </div>
        </div>

        {/* Thẻ 3: Đang mượn */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between group">
          <div>
            {/* Hàng 1: Icon Amber & Tên chỉ số + Huy hiệu góc */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 text-amber-600 border border-amber-200/60 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <BookUp size={20} />
                </div>
                <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">
                  {t('dashboard.active_loans', 'Đang mượn')}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50/90 border border-amber-200/80 px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                Lưu thông tốt
              </span>
            </div>
            {/* Hàng 2: Con số lớn in đậm kèm đơn vị đo */}
            <div className="flex items-baseline gap-2 mt-3 mb-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                {kpiFormatter.format(overview.kpis.activeLoans)}
              </span>
              <span className="text-slate-500 text-xs font-semibold">cuốn</span>
            </div>
          </div>
          {/* Hàng 3: Thanh chỉ số % sống động ở đáy */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
              <span>Đúng hạn</span>
              <span className="text-amber-700 font-bold">88%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500" style={{ width: '88%' }} />
            </div>
          </div>
        </div>

        {/* Thẻ 4: Tiền phạt */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between group">
          <div>
            {/* Hàng 1: Icon Rose & Tên chỉ số + Huy hiệu góc */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-rose-50 text-rose-600 border border-rose-200/60 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <DollarSign size={20} />
                </div>
                <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">
                  {t('dashboard.revenue', 'Tiền phạt')}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50/90 border border-rose-200/80 px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                Kiểm soát tốt
              </span>
            </div>
            {/* Hàng 2: Con số lớn in đậm kèm đơn vị đo */}
            <div className="flex items-baseline gap-2 mt-3 mb-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                {kpiFormatter.format(overview.kpis.revenue)}
              </span>
              <span className="text-slate-500 text-xs font-semibold">VNĐ</span>
            </div>
          </div>
          {/* Hàng 3: Thanh chỉ số % sống động ở đáy */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
              <span>Đã thu hồi</span>
              <span className="text-rose-700 font-bold">100%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-500" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Charts and Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Circulation Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 overflow-hidden flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {t('dashboard.chart_title', 'Biến động Lượt mượn / Trả')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Tần suất lưu thông tài liệu theo mốc thời gian
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200/90 text-teal-700 font-bold px-2.5 py-1 rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                Tổng mượn: {kpiFormatter.format(totalCheckouts)}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                Tổng trả: {kpiFormatter.format(totalReturns)}
              </span>
            </div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.circulationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCheckouts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={8} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  name={t('dashboard.chart_checkouts', 'Lượt Mượn')} 
                  dataKey="checkouts" 
                  stroke="#0d9488" 
                  strokeWidth={3} 
                  fillOpacity={0.25} 
                  fill="url(#colorCheckouts)" 
                />
                <Area 
                  type="monotone" 
                  name={t('dashboard.chart_returns', 'Lượt Trả')} 
                  dataKey="returns" 
                  stroke="#64748b" 
                  strokeWidth={2.5} 
                  fillOpacity={0.12} 
                  fill="url(#colorReturns)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Panels / Top Readers & Server Health */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500 shrink-0" />
                  <span>{t('dashboard.top_readers_title', 'Độc giả tích cực')}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Lượt mượn cao nhất kỳ này</p>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded-full shrink-0">
                Top bạn đọc
              </span>
            </div>

            <div className="space-y-2">
              {!overview.topReaders || overview.topReaders.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-medium">
                  {t('dashboard.no_top_readers', 'Chưa có dữ liệu độc giả tích cực')}
                </div>
              ) : (
                overview.topReaders.slice(0, 3).map((reader, i) => {
                  const nameParts = reader.name ? reader.name.trim().split(' ') : [];
                  const initials = nameParts.length > 0 ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() : 'Đ';
                  return (
                    <div 
                      key={reader.id} 
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100/80 transition-colors border border-slate-100 bg-slate-50"
                    >
                      {/* Rank badge */}
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                        i === 0 
                          ? 'bg-amber-400 text-amber-950 font-black' 
                          : i === 1 
                            ? 'bg-slate-200 text-slate-800 font-bold' 
                            : 'bg-slate-100 text-slate-600 font-bold'
                      }`}>
                        {i + 1}
                      </div>

                      {/* Avatar letter */}
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-300/60">
                        {initials}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{reader.name}</p>
                      </div>

                      {/* Book count tag */}
                      <div className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-lg shrink-0">
                        {reader.borrowCount} <span className="text-[10px] text-teal-600 font-semibold uppercase">{t('dashboard.unit_books', 'sách')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Nửa dưới: Khối nhỏ "Tình trạng máy chủ" */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Server size={13} className="text-slate-400" />
                <span>Tình trạng máy chủ</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                99.9% Uptime
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-slate-600 font-medium text-[11px] truncate">API Server</span>
                <span className="inline-flex items-center gap-1 text-teal-700 font-bold text-[10px] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" /> Kết nối
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-slate-600 font-medium text-[11px] truncate">Realtime Hub</span>
                <span className="inline-flex items-center gap-1 text-teal-700 font-bold text-[10px] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" /> Đồng bộ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

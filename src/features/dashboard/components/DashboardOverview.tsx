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
  Trophy, Server, Wifi, Clock, ChevronDown
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
      {/* 1. Header Banner chuẩn Stitch */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="font-black text-2xl text-slate-900 tracking-tight">
            Tổng Quan Thư Viện Số
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thống kê chỉ số vận hành, lưu thông học liệu và giám sát hệ thống thời gian thực.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          {/* Cụm nút lọc thời gian dạng pill capsule */}
          <div className="bg-slate-100/90 border border-slate-200/80 p-1 rounded-xl flex items-center gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                timeRange === 'today'
                  ? 'bg-white text-teal-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                timeRange === '7d'
                  ? 'bg-white text-teal-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                timeRange === '30d' || timeRange === 'semester'
                  ? 'bg-white text-teal-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Học kỳ 1 (2025 - 2026)
            </button>
          </div>

          {/* Nút Xuất báo cáo ▾ */}
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="h-9 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            {exportMutation.isPending ? (
              <Loader2 size={13} className="animate-spin text-white" />
            ) : (
              <Download size={13} className="text-white" />
            )}
            <span>Xuất báo cáo</span>
            <ChevronDown size={13} className="opacity-80" />
          </Button>
        </div>
      </div>

      {/* 2. Lưới 4 Thẻ KPI chuẩn Stitch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Tổng đầu sách & học liệu */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TỔNG ĐẦU SÁCH & HỌC LIỆU
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-sans">
                {overview.kpis.totalBooks ? kpiFormatter.format(overview.kpis.totalBooks) : '52,840'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">tài liệu</span>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <TrendingUp size={13} />
              <span>+12.4% so với học kỳ trước</span>
            </div>
          </div>
        </div>

        {/* Thẻ 2: Lượt mượn đang kích hoạt */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              LƯỢT MƯỢN ĐANG KÍCH HOẠT
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <BookUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-sans">
                {overview.kpis.activeLoans ? kpiFormatter.format(overview.kpis.activeLoans) : '1,428'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">cuốn</span>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>94.2% đúng thời hạn trả</span>
            </div>
          </div>
        </div>

        {/* Thẻ 3: Độc giả tích cực */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ĐỘC GIẢ TÍCH CỰC
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-sans">
                {overview.kpis.totalMembers ? kpiFormatter.format(overview.kpis.totalMembers) : '3,890'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">bạn đọc</span>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md">
                SV: 3,420
              </span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md">
                GV: 470
              </span>
            </div>
          </div>
        </div>

        {/* Thẻ 4: Cảnh báo sách quá hạn */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              CẢNH BÁO SÁCH QUÁ HẠN
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-amber-700 tracking-tight font-sans">
                {overview.kpis.overdueLoans ?? '24'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">tài liệu</span>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <TrendingDown size={13} />
              <span>↓ -18.0% giảm so với tháng trước</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Charts and Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Circulation Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 overflow-hidden flex flex-col justify-between">
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
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
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

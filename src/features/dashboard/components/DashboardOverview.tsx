import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, BookOpen, BookUp, AlertTriangle, 
  Sparkles, Download, Loader2, RefreshCw, Activity, CalendarDays, DollarSign
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

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
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
      <div className="flex flex-col h-[500px] items-center justify-center text-slate-500 gap-4">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <span className="font-medium animate-pulse">{t('dashboard.loading_overview', 'Đang tải dữ liệu tổng quan...')}</span>
      </div>
    );
  }

  if (!overview) return null;

  const kpiFormatter = new Intl.NumberFormat('vi-VN');
  const currencyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

  const renderTrend = (value: number) => {
    if (value > 0) return <span className="text-emerald-600 flex items-center text-xs font-medium"><TrendingUp size={12} className="mr-0.5" /> +{value}%</span>;
    if (value < 0) return <span className="text-rose-600 flex items-center text-xs font-medium"><TrendingDown size={12} className="mr-0.5" /> {value}%</span>;
    return <span className="text-slate-400 text-xs font-medium">{t('dashboard.trend_equal', 'Bằng nhau')}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-indigo-600" /> {t('dashboard.title', 'Tổng quan')}
          </h2>
          <p className="text-sm text-slate-500">{t('dashboard.subtitle', 'Tổng quan tình hình hoạt động của thư viện')}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-40 font-medium">
              <CalendarDays className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('dashboard.filter_7d', '7 ngày qua')}</SelectItem>
              <SelectItem value="30d">{t('dashboard.filter_30d', '30 ngày qua')}</SelectItem>
              <SelectItem value="90d">{t('dashboard.filter_90d', '90 ngày qua')}</SelectItem>
              <SelectItem value="ytd">{t('dashboard.filter_ytd', 'Từ đầu năm')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={async () => { 
              const promise = refetchOverview();
              toast.promise(promise, {
                loading: t('dashboard.refreshing', 'Đang làm mới dữ liệu...'),
                success: t('dashboard.refresh_success', 'Đã làm mới dữ liệu hiển thị thành công'),
                error: t('dashboard.refresh_error', 'Lỗi khi làm mới dữ liệu')
              });
            }}
            className="shrink-0"
          >
            <RefreshCw size={16} className={overviewLoading ? 'animate-spin' : ''} />
          </Button>

          <Button 
            onClick={() => exportMutation.mutate()} 
            disabled={exportMutation.isPending}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 font-bold"
          >
            {exportMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Download size={16} className="mr-2" />}
            {t('dashboard.export_excel', 'Xuất Excel')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">{t('dashboard.documents', 'Tài liệu')}</CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{kpiFormatter.format(overview.kpis.totalBooks)}</div>
            <div className="mt-1">{renderTrend(overview.kpis.trends.books)}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">{t('dashboard.members', 'Độc giả')}</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{kpiFormatter.format(overview.kpis.totalMembers)}</div>
            <div className="mt-1">{renderTrend(overview.kpis.trends.members)}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">{t('dashboard.active_loans', 'Đang mượn')}</CardTitle>
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookUp size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{kpiFormatter.format(overview.kpis.activeLoans)}</div>
            <div className="mt-1">{renderTrend(overview.kpis.trends.loans)}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">{t('dashboard.revenue', 'Tiền phạt')}</CardTitle>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">{currencyFormatter.format(overview.kpis.revenue)}</div>
            <div className="mt-1">{renderTrend(overview.kpis.trends.revenue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">{t('dashboard.chart_title', 'Biến động Lượt mượn / Trả')}</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.circulationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCheckouts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Area type="monotone" name={t('dashboard.chart_checkouts', 'Lượt Mượn')} dataKey="checkouts" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCheckouts)" />
                <Area type="monotone" name={t('dashboard.chart_returns', 'Lượt Trả')} dataKey="returns" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReturns)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Panels */}
        <div className="space-y-6">
          {/* Top Readers */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              {t('dashboard.top_readers_title', 'Độc giả tích cực')}
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{t('dashboard.top_readers_top5', 'Top 5')}</span>
            </h3>
            <div className="space-y-3">
              {!overview.topReaders || overview.topReaders.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400 font-medium">
                  {t('dashboard.no_top_readers', 'Chưa có dữ liệu độc giả tích cực')}
                </div>
              ) : (
                overview.topReaders.map((reader, i) => (
                  <div key={reader.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-400'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{reader.name}</p>
                    </div>
                    <div className="font-mono text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {reader.borrowCount} <span className="text-[10px] text-indigo-400 uppercase">{t('dashboard.unit_books', 'sách')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

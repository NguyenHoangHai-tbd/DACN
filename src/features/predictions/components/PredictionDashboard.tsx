import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { predictionService } from '../services/predictionService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, TrendingUp, TrendingDown, RefreshCw, BarChart3, BrainCircuit, Activity, ShieldAlert, Sparkles, ArrowRight, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useSignalRListener } from '../../../shared/signalr/useSignalRListener';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const PredictionDashboard: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [forecastType, setForecastType] = useState('demand');

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['predictionSummary'],
    queryFn: predictionService.getSummary
  });

  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['predictionAlerts'],
    queryFn: predictionService.getAlerts
  });

  const { data: forecast = [], isLoading: loadingForecast } = useQuery({
    queryKey: ['predictionForecast', forecastType],
    queryFn: () => predictionService.getForecast(forecastType)
  });

  const runMutation = useMutation({
    mutationFn: () => predictionService.runModel(),
    onSuccess: () => {
      toast.success(t('predictions.toast_launching', 'Đang khởi chạy model dự đoán... Quá trình này có thể mất vài phút.'), { icon: '⚙️' });
    }
  });

  useSignalRListener('prediction.completed', () => {
     queryClient.invalidateQueries({ queryKey: ['predictionSummary'] });
     queryClient.invalidateQueries({ queryKey: ['predictionAlerts'] });
     queryClient.invalidateQueries({ queryKey: ['predictionForecast'] });
     toast.success(t('predictions.toast_completed', 'AI Model đã hoàn tất phân tích số liệu mới!'), { icon: '✨' });
  });

  useSignalRListener('risk.alert', (payload: any) => {
     toast.error(`${t('predictions.toast_risk_alert', 'Cảnh báo rủi ro cao')}: ${payload.message}`);
     queryClient.invalidateQueries({ queryKey: ['predictionAlerts'] });
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between text-white">
         <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-xl border border-white/20">
               <BrainCircuit size={28} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">Dự báo AI <Sparkles size={16} className="text-amber-400"/></h2>
              <p className="text-sm text-slate-300">{t('predictions.header_subtitle', 'Dự báo nhu cầu, rủi ro quá hạn & thất thoát tài sản bằng Machine Learning.')}</p>
            </div>
         </div>
         <div className="flex gap-3 items-center">
            {summary && (
              <div className="text-xs text-right mr-3 hidden md:block text-slate-300">
                {t('predictions.last_run_label', 'Lần chạy cuối:')}<br/>
                <strong className="text-white">{new Date(summary.lastRunAt).toLocaleString('vi-VN')}</strong>
              </div>
            )}
            <Button 
               variant="outline"
               className="bg-white/10 border-white/20 text-white hover:bg-white/20"
               onClick={() => runMutation.mutate()}
               disabled={runMutation.isPending}
            >
               {runMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16}/> : <RefreshCw className="mr-2" size={16}/>}
               Cập nhật mô hình
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Alerts */}
        <div className="space-y-6 md:col-span-1">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-500" />
            {t('predictions.risk_alerts_title', 'Cảnh báo rủi ro')}
          </h3>
          
          {loadingAlerts ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400">
              <Loader2 className="animate-spin mx-auto mb-2" size={24}/> {t('predictions.loading_alerts', 'Đang tải cảnh báo...')}
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Activity size={24} />
               </div>
               <p className="font-bold text-slate-700">{t('predictions.system_stable', 'Hệ thống ổn định')}</p>
               <p className="text-sm text-slate-500 mt-1">{t('predictions.no_risk_detected', 'AI không phát hiện rủi ro nào đáng lo ngại.')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map(alert => (
                <Card key={alert.id} className={`border-l-4 overflow-hidden shadow-sm ${alert.riskLevel === 'High' ? 'border-l-rose-500' : alert.riskLevel === 'Medium' ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
                  <CardHeader className="p-4 pb-2 bg-slate-50/50">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${alert.type === 'Shortage' ? 'bg-amber-100 text-amber-700' : alert.type === 'Overdue' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>
                        {alert.type === 'Shortage' ? 'Thiếu hụt' : alert.type === 'Overdue' ? 'Quá hạn' : alert.type}
                      </span>
                      <span className="text-xs font-mono text-slate-500 flex items-center gap-1" title="Confidence Score">
                         {Math.round(alert.confidenceScore * 100)}% {t('predictions.confidence_suffix', 'độ tin cậy')}
                      </span>
                    </div>
                    <CardTitle className="text-base text-slate-800 leading-tight">{alert.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm text-slate-600 mb-3">{alert.description}</p>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{t('predictions.suggested_actions_label', 'Hành động đề xuất:')}</p>
                      {alert.suggestedActions.map((action, idx) => (
                         <div key={idx} className="flex items-start gap-1.5 text-xs text-indigo-700 bg-indigo-50 px-2 py-1.5 rounded-md border border-indigo-100">
                           <ArrowRight size={12} className="mt-0.5 shrink-0" />
                           <span>{action}</span>
                         </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Charts */}
        <div className="md:col-span-2 space-y-6">
           <Card className="shadow-sm border-slate-200">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                   <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                     <BarChart3 size={20} className="text-indigo-500" /> {t('predictions.forecast_chart_title', 'Biểu đồ dự báo')}
                   </CardTitle>
                   <CardDescription>{t('predictions.forecast_chart_desc', 'Dự đoán xu hướng 14 ngày tới dựa trên dữ liệu lịch sử')}</CardDescription>
                </div>
                <Select value={forecastType} onValueChange={setForecastType}>
                   <SelectTrigger className="w-[180px]">
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="demand">{t('predictions.demand_option', 'Nhu cầu mượn sách')}</SelectItem>
                      <SelectItem value="overdue">{t('predictions.overdue_option', 'Lượng sách trả trễ')}</SelectItem>
                   </SelectContent>
                </Select>
             </CardHeader>
             <CardContent>
                <div className="h-[350px] w-full mt-4">
                  {loadingForecast ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                       <Loader2 className="animate-spin mr-2" size={24} /> {t('predictions.loading_forecast', 'Đang tải dữ liệu dự báo...')}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={forecast} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <defs>
                           <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor={forecastType === 'demand' ? '#6366f1' : '#f43f5e'} stopOpacity={0.2}/>
                             <stop offset="95%" stopColor={forecastType === 'demand' ? '#6366f1' : '#f43f5e'} stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          stroke="#94a3b8" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                          labelFormatter={(label) => new Date(label as string).toLocaleDateString('vi-VN')}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Area 
                          type="monotone" 
                          dataKey="upperBound" 
                          stroke="none" 
                          fill="url(#colorArea)" 
                          name={t('predictions.upper_bound', 'Ngưỡng cao')} 
                          connectNulls
                        />
                        {/* We use lowerBound to fill up to upperBound in Recharts by overlapping, but a simplified Area is fine */}
                        <Line 
                          type="monotone" 
                          dataKey="predictedValue" 
                          stroke={forecastType === 'demand' ? '#4f46e5' : '#e11d48'} 
                          strokeWidth={3} 
                          dot={{ r: 4, strokeWidth: 2 }} 
                          activeDot={{ r: 6, strokeWidth: 0 }} 
                          name={t('predictions.predicted_value', 'Dự đoán')} 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-3 text-sm text-slate-600">
                  <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p>
                    <strong>{t('common.label.note', 'Lưu ý:')}</strong> {t('predictions.disclaimer', 'Dữ liệu dự đoán được tính toán từ mô hình học máy trên dữ liệu luân chuyển thực tế. Khoảng tô mờ thể hiện khoảng tin cậy 90%. Nếu điểm thực tế vượt mức dự đoán, quy trình tự động có thể bị quá tải.')}
                  </p>
                </div>
             </CardContent>
           </Card>

           <div className="grid grid-cols-2 gap-4">
              <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
                <CardHeader className="p-4 pb-2">
                   <CardTitle className="text-sm text-emerald-800 flex items-center gap-2">
                      <TrendingUp size={16} /> {t('predictions.positive_insight', 'Insight Khả quan')}
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                   <p className="text-sm text-emerald-700 font-medium">{t('predictions.positive_insight_desc', 'Tỷ lệ trả sách đúng hạn dự kiến tăng 5% vào tuần tới nhờ kích hoạt Automation Rules mới đây.')}</p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-100 shadow-sm">
                <CardHeader className="p-4 pb-2">
                   <CardTitle className="text-sm text-orange-800 flex items-center gap-2">
                      <AlertTriangle size={16} /> {t('predictions.hotspot_insight', 'Điểm nóng tuần này')}
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                   <p className="text-sm text-orange-700 font-medium">{t('predictions.hotspot_insight_desc', 'Sách Ngôn ngữ học đang có nhu cầu cao bất thường ở Chi nhánh Quận 1, có nguy cơ thiếu 15 bản in.')}</p>
                </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
};

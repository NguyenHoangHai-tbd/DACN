import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monitoringService } from '../services/monitoringService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, ServerCrash, Zap, Sparkles, RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Database, Server, WifiOff, CloudOff, CloudDrizzle } from 'lucide-react';
import { toast } from 'sonner';

export const MonitoringDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: health = [], isLoading: loadHealth } = useQuery({ queryKey: ['health'], queryFn: monitoringService.getHealth, refetchInterval: 10000 });
  const { data: insights = [], isLoading: loadInsights } = useQuery({ queryKey: ['aiInsights'], queryFn: monitoringService.getAiInsights });
  const { data: queue = [], refetch: refetchQueue } = useQuery({ queryKey: ['syncQueue'], queryFn: monitoringService.getSyncQueue });

  const syncMutation = useMutation({
    mutationFn: () => monitoringService.syncNow(),
    onSuccess: () => {
      toast.success('Đồng bộ dữ liệu thành công!');
      queryClient.invalidateQueries({ queryKey: ['syncQueue'] });
    },
    onError: () => {
      toast.error('Đồng bộ thất bại. Vui lòng kiểm tra lại mạng.');
    }
  });

  const handleCreateMockOfflineAction = async () => {
     await monitoringService.addSyncItem('inventory.scan', { barcode: '123456789', location: 'Shelf A' });
     toast.info('Lưu Local: Đã thêm 1 hành động kiểm kê vào hàng đợi Offline.');
     refetchQueue();
  };

  const handleClearQueue = async () => {
     await monitoringService.clearQueue();
     refetchQueue();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
               <Activity size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Hiệu năng & Khả năng chịu lỗi</h2>
              <p className="text-sm text-slate-500">Giám sát hệ thống, AI Ops Insights và Trạng thái Đồng bộ Offline.</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* System Health */}
         <Card className="border-slate-200 shadow-sm flex flex-col h-[400px]">
            <CardHeader className="bg-slate-50 pb-4 border-b border-slate-100 shrink-0">
               <CardTitle className="text-base flex items-center gap-2"><Server size={18} className="text-slate-600"/> Tình trạng Hạ tầng (Health)</CardTitle>
               <CardDescription>Trạng thái kết nối và độ trễ các service nội bộ</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
               <Table>
                 <TableHeader className="bg-white sticky top-0">
                    <TableRow>
                       <TableHead className="font-bold text-slate-700">Service</TableHead>
                       <TableHead className="font-bold text-slate-700">Status</TableHead>
                       <TableHead className="font-bold text-slate-700 text-right">Latency</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {loadHealth ? (
                       <TableRow><TableCell colSpan={3} className="text-center py-6 text-slate-400"><RefreshCw className="animate-spin inline mr-2" size={16}/> Đang tải...</TableCell></TableRow>
                    ) : health.map((h, i) => (
                       <TableRow key={i}>
                          <TableCell className="font-bold text-slate-800 flex items-center gap-2">
                             {h.service.includes('Database') ? <Database size={16} className="text-slate-500"/> : <Zap size={16} className="text-slate-500"/>}
                             {h.service}
                          </TableCell>
                          <TableCell>
                             {h.status === 'Healthy' && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 size={12} className="mr-1"/> Ổn định</Badge>}
                             {h.status === 'Degraded' && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><AlertTriangle size={12} className="mr-1"/> Có cảnh báo</Badge>}
                             {h.status === 'Down' && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><ServerCrash size={12} className="mr-1"/> Ngừng hoạt động</Badge>}
                          </TableCell>
                          <TableCell className="text-right text-sm font-mono">
                             <span className={h.latencyMs > 200 ? 'text-amber-600' : 'text-emerald-600'}>{h.latencyMs}ms</span>
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
               </Table>
            </CardContent>
         </Card>

         {/* Offline Sync Manager */}
         <Card className="border-slate-200 shadow-sm flex flex-col h-[400px]">
            <CardHeader className="bg-slate-50 pb-4 border-b border-slate-100 shrink-0 flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="text-base flex items-center gap-2"><CloudOff size={18} className="text-indigo-600"/> Hàng đợi đồng bộ ngoại tuyến</CardTitle>
                  <CardDescription>Các thao tác đang chờ đồng bộ khi có mạng</CardDescription>
               </div>
               {isOnline ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase font-bold shrink-0">Đang trực tuyến</Badge>
               ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase font-bold shrink-0 animate-pulse">Thiết bị mất kết nối</Badge>
               )}
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[calc(400px-70px)]">
               <div className="flex-1 overflow-auto">
                  {queue.length === 0 ? (
                     <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full">
                        <CheckCircle2 size={48} className="text-emerald-200 mb-2" />
                        <p className="font-semibold text-slate-600">Đã đồng bộ toàn bộ dữ liệu</p>
                        <p className="text-xs">Không có hành động nào trong hàng đợi lưu tạm.</p>
                     </div>
                  ) : (
                     <div className="p-4 space-y-3">
                        {queue.map(item => (
                           <div key={item.id} className="p-3 border border-slate-200 rounded-xl bg-white shadow-sm flex justify-between items-center">
                              <div>
                                 <p className="font-bold text-slate-800 text-sm">{item.action}</p>
                                 <p className="text-xs text-slate-500 font-mono mt-0.5">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                              </div>
                              <Badge variant="outline" className="bg-slate-50 text-slate-600">{item.status}</Badge>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
               
               <div className="p-4 border-t border-slate-100 bg-slate-50 grid grid-cols-2 gap-3 shrink-0">
                  <Button variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100" onClick={handleCreateMockOfflineAction}>
                     Tạo dữ liệu Offline
                  </Button>
                  <Button 
                     className="bg-indigo-600 hover:bg-indigo-700" 
                     disabled={queue.length === 0 || !isOnline || syncMutation.isPending}
                     onClick={() => syncMutation.mutate()}
                  >
                     {syncMutation.isPending ? <RefreshCw className="animate-spin mr-2" size={16}/> : <RefreshCw className="mr-2" size={16}/>}
                     Đồng bộ Lên Server
                  </Button>
                  {queue.length > 0 && (
                     <Button variant="ghost" size="sm" className="col-span-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleClearQueue}>
                        Xóa hàng đợi
                     </Button>
                  )}
               </div>
            </CardContent>
         </Card>
      </div>

      {/* AI Ops Insights */}
      <Card className="border-indigo-100 shadow-sm border overflow-hidden">
         <CardHeader className="bg-indigo-50 border-b border-indigo-100">
            <CardTitle className="text-base flex items-center gap-2 text-indigo-900"><Sparkles size={18} className="text-indigo-600"/> Chẩn đoán và Tự động tinh chỉnh bởi AI</CardTitle>
            <CardDescription className="text-indigo-700">Hệ thống AI tự động phân tích telemetry và log để phát hiện nghẽn cổ chai và gợi ý sửa lỗi.</CardDescription>
         </CardHeader>
         <CardContent className="p-0">
            {loadInsights ? (
               <div className="p-8 text-center text-slate-400"><RefreshCw className="animate-spin inline mr-2" size={24}/></div>
            ) : insights.length === 0 ? (
               <div className="p-8 text-center text-slate-400">Không có cảnh báo tự động nào.</div>
            ) : (
               <div className="divide-y divide-slate-100">
                  {insights.map(i => (
                     <div key={i.id} className="p-6 pb-4">
                        <div className="flex items-center gap-2 mb-3">
                           {i.severity === 'High' ? (
                             <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 uppercase tracking-widest text-[10px] font-black shrink-0"><AlertCircle size={10} className="mr-1 inline"/> HIGH IMPACT</Badge>
                           ) : (
                             <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-widest text-[10px] font-black shrink-0"><AlertTriangle size={10} className="mr-1 inline"/> MEDIUM IMPACT</Badge>
                           )}
                           <span className="text-xs text-slate-400">{new Date(i.timestamp).toLocaleString('vi-VN')}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mb-2">{i.issue}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                           <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                              <p className="text-xs font-bold text-red-800 mb-1 uppercase tracking-wider">Mức độ ảnh hưởng (Impact)</p>
                              <p className="text-sm text-red-900 leading-relaxed">{i.impact}</p>
                           </div>
                           <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                              <p className="text-xs font-bold text-emerald-800 mb-1 uppercase tracking-wider flex items-center gap-1"><Sparkles size={12}/> Đề xuất tự động (Auto-Tuning)</p>
                              <p className="text-sm text-emerald-900 leading-relaxed">{i.recommendation}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </CardContent>
      </Card>
    </div>
  );
};

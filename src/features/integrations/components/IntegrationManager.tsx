import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationService } from '../services/integrationService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plug, Key, Webhook, RefreshCw, Plus, Trash2, Shield, Mail, MessageSquare, AlertTriangle, Play, Sparkles, CheckCircle2, XCircle, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { useSignalRListener } from '../../../shared/signalr/useSignalRListener';

export const IntegrationManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('integrations');
  
  // API Keys state
  const [newKeyName, setNewKeyName] = useState('');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Webhooks state
  const [analyzingLogId, setAnalyzingLogId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{cause: string, recommendation: string} | null>(null);

  // Queries
  const { data: integrations = [], isLoading: loadInt } = useQuery({ queryKey: ['integrations'], queryFn: integrationService.getIntegrations });
  const { data: apiKeys = [], isLoading: loadKeys } = useQuery({ queryKey: ['apiKeys'], queryFn: integrationService.getApiKeys });
  const { data: webhooks = [], isLoading: loadHooks } = useQuery({ queryKey: ['webhooks'], queryFn: integrationService.getWebhooks });
  const { data: webhookLogs = [], isLoading: loadLogs } = useQuery({ queryKey: ['webhookLogs'], queryFn: integrationService.getWebhookLogs });

  // Mutations
  const createKeyMutation = useMutation({
    mutationFn: (name: string) => integrationService.createApiKey(name),
    onSuccess: (data) => {
      setGeneratedKey(data.key);
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('Tạo API Key thành công!');
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => integrationService.deleteApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('Đã xóa API Key');
    }
  });

  const testWebhookMutation = useMutation({
    mutationFn: (id: string) => integrationService.testWebhook(id),
    onSuccess: () => {
      toast.info('Đã gửi payload thử nghiệm.');
    }
  });

  const analyzeLogMutation = useMutation({
    mutationFn: (id: string) => integrationService.analyzeLog(id),
    onSuccess: (data) => {
      setAiAnalysis(data);
    },
    onError: () => toast.error('Lỗi khi phân tích AI.')
  });

  useSignalRListener('webhook.failed', (payload: any) => {
     queryClient.invalidateQueries({ queryKey: ['webhookLogs'] });
     toast.error(`Webhook giao tiếp thất bại: ${payload.endpoint}`);
  });

  useSignalRListener('integration.statusChanged', () => {
     queryClient.invalidateQueries({ queryKey: ['integrations'] });
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    createKeyMutation.mutate(newKeyName);
  };

  const handleAnalyzeLog = (logId: string) => {
    setAnalyzingLogId(logId);
    setAiAnalysis(null);
    analyzeLogMutation.mutate(logId);
  };

  const getProviderIcon = (provider: string, type: string) => {
    if (type === 'SSO') return <Shield size={24} className="text-blue-500" />;
    if (type === 'Email') return <Mail size={24} className="text-emerald-500" />;
    if (type === 'SMS') return <MessageSquare size={24} className="text-amber-500" />;
    return <Plug size={24} />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
               <Plug size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cấu hình Tích hợp (Integrations)</h2>
              <p className="text-sm text-slate-500">SSO, API mở, SMS/Email Providers và Webhooks.</p>
            </div>
         </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <TabsList className="bg-white border text-slate-600 border-slate-200 p-1 w-full md:w-auto h-12 rounded-xl shadow-sm mb-6 inline-flex">
           <TabsTrigger value="integrations" className="font-semibold px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700">Dịch vụ (Providers)</TabsTrigger>
           <TabsTrigger value="webhooks" className="font-semibold px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700">Webhooks</TabsTrigger>
           <TabsTrigger value="apikeys" className="font-semibold px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700">Khóa API</TabsTrigger>
         </TabsList>

         <TabsContent value="integrations" className="mt-0">
            {loadInt ? (
               <div className="flex justify-center p-12 text-slate-400"><RefreshCw className="animate-spin" size={32}/></div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {integrations.map(idx => (
                     <Card key={idx.id} className="border-slate-200 shadow-sm relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full opacity-20 ${idx.type === 'SSO' ? 'bg-blue-500' : idx.type === 'Email' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        <CardHeader className="pb-3">
                           <div className="flex justify-between items-start mb-2">
                              {getProviderIcon(idx.provider, idx.type)}
                              <Badge variant="outline" className={idx.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : idx.status === 'Error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500'}>
                                {idx.status}
                              </Badge>
                           </div>
                           <CardTitle className="text-lg">{idx.name}</CardTitle>
                           <CardDescription>{idx.provider}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Button variant="outline" className="w-full">
                              Cấu hình
                           </Button>
                        </CardContent>
                     </Card>
                  ))}
                  
                  <Card className="border-slate-200 shadow-sm border-dashed bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors h-[180px]">
                     <div className="text-center text-slate-500">
                        <Plus size={32} className="mx-auto mb-2 text-slate-400" />
                        <span className="font-medium">Thêm dịch vụ mới</span>
                     </div>
                  </Card>
               </div>
            )}
         </TabsContent>

         <TabsContent value="webhooks" className="mt-0 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
               <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Webhook size={18}/> Webhooks Đã cấu hình</h3>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700"><Plus size={16} className="mr-1.5"/> Thêm Webhook</Button>
               </div>
               <Table>
                 <TableHeader className="bg-white">
                    <TableRow>
                       <TableHead className="font-bold text-slate-700">Tên Webhook</TableHead>
                       <TableHead className="font-bold text-slate-700">Endpoint URL</TableHead>
                       <TableHead className="font-bold text-slate-700">Sự kiện (Events)</TableHead>
                       <TableHead className="text-right font-bold text-slate-700">Thao tác</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {loadHooks ? (
                       <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-400">Đang tải...</TableCell></TableRow>
                    ) : webhooks.map(wh => (
                       <TableRow key={wh.id}>
                          <TableCell className="font-bold text-slate-800">{wh.name}</TableCell>
                          <TableCell className="text-sm font-mono text-slate-500 max-w-[200px] truncate" title={wh.endpoint}>{wh.endpoint}</TableCell>
                          <TableCell>
                             <div className="flex gap-1.5 flex-wrap">
                               {wh.events.map(ev => (
                                 <span key={ev} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{ev}</span>
                               ))}
                             </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button variant="outline" size="sm" onClick={() => testWebhookMutation.mutate(wh.id)} disabled={testWebhookMutation.isPending}>
                                <Play size={14} className="mr-1.5" /> Test
                             </Button>
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
               </Table>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Terminal size={18}/> Delivery Logs & AI Diagnostics</h3>
               </div>
               <Table>
                 <TableHeader className="bg-white">
                    <TableRow>
                       <TableHead className="font-bold text-slate-700">Thời gian</TableHead>
                       <TableHead className="font-bold text-slate-700">Event</TableHead>
                       <TableHead className="font-bold text-slate-700">Status</TableHead>
                       <TableHead className="font-bold text-slate-700">Diagnostic</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {loadLogs ? (
                       <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-400">Đang tải logs...</TableCell></TableRow>
                    ) : webhookLogs.map(log => (
                       <TableRow key={log.id}>
                          <TableCell className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="text-xs font-mono font-bold text-slate-700">{log.event}</TableCell>
                          <TableCell>
                             {log.httpStatus >= 200 && log.httpStatus < 300 ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 size={12} className="mr-1"/> {log.httpStatus}</Badge>
                             ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle size={12} className="mr-1"/> {log.httpStatus}</Badge>
                             )}
                          </TableCell>
                          <TableCell>
                             {log.httpStatus >= 400 && (
                                <Button 
                                   variant="outline" 
                                   size="sm" 
                                   className="hidden h-7 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                   onClick={() => handleAnalyzeLog(log.id)}
                                   disabled={analyzeLogMutation.isPending && analyzingLogId === log.id}
                                >
                                   {analyzeLogMutation.isPending && analyzingLogId === log.id ? <RefreshCw className="animate-spin mr-1" size={12}/> : <Sparkles className="mr-1" size={12}/>}
                                   Hỏi AI nguyên nhân
                                </Button>
                             )}
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
               </Table>
               
               {/* AI Analysis Result Panel */}
               {false && aiAnalysis && (
                  <div className="m-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-400 hover:text-indigo-800" onClick={() => setAiAnalysis(null)}><XCircle size={16}/></Button>
                     </div>
                     <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-2"><Sparkles size={16} className="text-indigo-600"/> Đề xuất từ hệ thống AI:</h4>
                     <div className="text-sm text-indigo-800 space-y-2">
                        <p><strong>Nguyên nhân:</strong> {aiAnalysis.cause}</p>
                        <p><strong>Đề xuất khắc phục:</strong> {aiAnalysis.recommendation}</p>
                     </div>
                  </div>
               )}
            </div>
         </TabsContent>

         <TabsContent value="apikeys" className="mt-0 space-y-6">
            <div className="flex justify-end mb-4">
               <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowKeyDialog(true)}>
                  <Key size={16} className="mr-2"/> Tạo Khóa API Mới
               </Button>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <Table>
                 <TableHeader className="bg-slate-50">
                    <TableRow>
                       <TableHead className="font-bold text-slate-700">Tên Key</TableHead>
                       <TableHead className="font-bold text-slate-700">Key Hint</TableHead>
                       <TableHead className="font-bold text-slate-700">Ngày tạo</TableHead>
                       <TableHead className="font-bold text-slate-700">Lần cuối sử dụng</TableHead>
                       <TableHead className="text-right font-bold text-slate-700">Thao tác</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {loadKeys ? (
                       <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-400">Đang tải...</TableCell></TableRow>
                    ) : apiKeys.length === 0 ? (
                       <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Bạn chưa tạo API Key nào.</TableCell></TableRow>
                    ) : apiKeys.map(k => (
                       <TableRow key={k.id}>
                          <TableCell className="font-bold text-slate-800">{k.name}</TableCell>
                          <TableCell className="font-mono text-slate-500 text-xs bg-slate-50 px-2 py-1 rounded inline-block mt-2 border border-slate-200">{k.keyHint}</TableCell>
                          <TableCell className="text-sm text-slate-600">{new Date(k.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell className="text-sm text-slate-600">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString('vi-VN') : 'Chưa sử dụng'}</TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteKeyMutation.mutate(k.id)} disabled={deleteKeyMutation.isPending}>
                                <Trash2 size={16} />
                             </Button>
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
               </Table>
            </div>
         </TabsContent>
      </Tabs>

      {/* Dialog Tạo API Key */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo Khóa API Mới</DialogTitle>
            <DialogDescription>
              Khóa API này có quyền tương đương với tài khoản Admin thư viện hiện tại.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             {!generatedKey ? (
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label className="text-xs font-bold text-slate-600 uppercase">Tên gợi nhớ</Label>
                   <Input 
                      placeholder="Ví dụ: ERP Integration Key" 
                      value={newKeyName} 
                      onChange={e => setNewKeyName(e.target.value)} 
                   />
                 </div>
               </div>
             ) : (
                <div className="space-y-4">
                   <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm flex gap-3 items-start">
                     <AlertTriangle size={20} className="shrink-0 text-amber-500" />
                     <p>Hãy sao chép và lưu trữ API Key dưới đây ngay lập tức. Bạn <strong>sẽ không thể thấy lại key này</strong> vì lý do bảo mật.</p>
                   </div>
                   <div className="relative">
                      <Input value={generatedKey} readOnly className="font-mono bg-slate-50 text-slate-700 pr-12 focus-visible:ring-0" />
                   </div>
                </div>
             )}
          </div>
          <DialogFooter className="sm:justify-end">
            {!generatedKey ? (
               <>
                 <Button variant="outline" onClick={() => setShowKeyDialog(false)}>Hủy</Button>
                 <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCreateKey} disabled={!newKeyName.trim() || createKeyMutation.isPending}>
                   {createKeyMutation.isPending ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Key className="mr-2" size={16} />} 
                   Tạo Key
                 </Button>
               </>
            ) : (
               <Button onClick={() => {
                  setShowKeyDialog(false);
                  setGeneratedKey(null);
                  setNewKeyName('');
               }}>Đã lưu, Đóng lại</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

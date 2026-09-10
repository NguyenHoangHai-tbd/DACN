import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowService } from '../services/workflowService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Zap, Clock, AlertTriangle, Plus, Save, Play, RefreshCw, FileText, Sparkles, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { WorkflowRule } from '../types';

export const WorkflowManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  
  // Mappings for displaying triggers/conditions in friendly Vietnamese
  const mapTrigger = (t: string) => {
    switch (t) {
      case 'due_date': return 'Sắp tới hạn trả sách';
      case 'overdue': return 'Sách quá hạn';
      case 'user_joined': return 'Độc giả mới đăng ký';
      default: return t;
    }
  };

  const mapCondition = (c: string) => {
    switch (c) {
      case '3_days_before': return 'Trước 3 ngày';
      case '1_day_before': return 'Trước 1 ngày';
      case '1_day_after': return 'Quá hạn 1 ngày';
      case '3_days_after': return 'Quá hạn 3 ngày';
      case 'immediately': return 'Ngay lập tức';
      default: return c;
    }
  };

  // Builder form states
  const [trigger, setTrigger] = useState('due_date');
  const [condition, setCondition] = useState('3_days_before');
  const [channels, setChannels] = useState<string[]>(['email']);
  const [templateBody, setTemplateBody] = useState('Kính gửi {UserName}, sách {BookTitle} của bạn sẽ hết hạn mượn vào ngày {DueDate}. Vui lòng trả sách đúng hạn để tránh phí phạt.');
  const [ruleName, setRuleName] = useState('Nhắc nhở trả sách trước 3 ngày');

  const handleTriggerChange = (val: string) => {
    setTrigger(val);
    if (val === 'due_date') {
      setCondition('3_days_before');
    } else if (val === 'overdue') {
      setCondition('1_day_after');
    } else if (val === 'user_joined') {
      setCondition('immediately');
    }
  };

  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ['workflowRules'],
    queryFn: workflowService.getRules
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['workflowLogs'],
    queryFn: workflowService.getLogs
  });

  const createMutation = useMutation({
    mutationFn: (newRule: Omit<WorkflowRule, 'id'>) => workflowService.createRule(newRule),
    onSuccess: () => {
      toast.success('Đã cấu hình và kích hoạt quy trình thành công!');
      setIsBuilderOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workflowRules'] });
    }
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => workflowService.testRule(id),
    onSuccess: () => {
      toast.success('Đã chạy thử quy trình thành công');
      queryClient.invalidateQueries({ queryKey: ['workflowLogs'] });
    }
  });

  const handleSaveRule = () => {
    if (!ruleName.trim()) {
      toast.error('Vui lòng nhập tên quy trình');
      return;
    }
    createMutation.mutate({
      name: ruleName,
      trigger,
      condition,
      channels,
      templateBody,
      isActive: true
    });
  };

  const toggleChannel = (channel: string) => {
    setChannels(prev => prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
               <Zap size={24} />
            </div>
            <div>
               <h2 className="text-lg font-bold text-slate-800">Thông báo / Quy trình tự động</h2>
               <p className="text-sm text-slate-500">Tự động hoá các thông báo và quy trình hoạt động dựa trên sự kiện.</p>
            </div>
         </div>
         <Button 
            className="bg-indigo-600 hover:bg-indigo-700 font-bold"
            onClick={() => setIsBuilderOpen(!isBuilderOpen)}
         >
            {isBuilderOpen ? <span className="flex items-center gap-2"><RefreshCw size={16}/> Hủy tác vụ</span> : <span className="flex items-center gap-2"><Plus size={16}/> Tạo quy trình mới</span>}
         </Button>
      </div>

      {isBuilderOpen && (
        <Card className="border-indigo-100 shadow-md">
          <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
             <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-indigo-900"><Sparkles className="text-indigo-600" size={18}/> Thiết lập quy trình</span>
             </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-5">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-600 uppercase">Tên quy trình</label>
                   <Input 
                      placeholder="vd: Nhắc nhở trả sách trước 3 ngày..." 
                      className="rounded-xl font-medium"
                      value={ruleName} 
                      onChange={e => setRuleName(e.target.value)} 
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-600 uppercase">Sự kiện kích hoạt (Trigger)</label>
                     <Select value={trigger} onValueChange={handleTriggerChange}>
                       <SelectTrigger><SelectValue/></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="due_date">Mượn sách (Sắp tới hạn)</SelectItem>
                         <SelectItem value="overdue">Mượn sách (Quá hạn)</SelectItem>
                         <SelectItem value="user_joined">Độc giả mới đăng ký</SelectItem>
                       </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-600 uppercase">Điều kiện (Condition)</label>
                     <Select value={condition} onValueChange={setCondition}>
                       <SelectTrigger><SelectValue/></SelectTrigger>
                       <SelectContent>
                         {trigger === 'due_date' && (
                           <>
                             <SelectItem value="3_days_before">Trước 3 ngày</SelectItem>
                             <SelectItem value="1_day_before">Trước 1 ngày</SelectItem>
                           </>
                         )}
                         {trigger === 'overdue' && (
                           <>
                             <SelectItem value="1_day_after">Quá hạn 1 ngày</SelectItem>
                             <SelectItem value="3_days_after">Quá hạn 3 ngày (Thang điểm cao)</SelectItem>
                           </>
                         )}
                         {trigger === 'user_joined' && <SelectItem value="immediately">Ngay lập tức</SelectItem>}
                       </SelectContent>
                     </Select>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-600 uppercase">Kênh gửi (Channels)</label>
                   <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                        <Switch checked={channels.includes('email')} onCheckedChange={() => toggleChannel('email')} />
                        <span className="text-sm font-semibold">Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                        <Switch checked={channels.includes('push_noti')} onCheckedChange={() => toggleChannel('push_noti')} />
                        <span className="text-sm font-semibold">Thông báo trong ứng dụng</span>
                      </label>
                   </div>
                </div>
             </div>

             <div className="space-y-4 flex flex-col h-full bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                     <FileText size={14}/> Mẫu văn bản thông báo
                  </label>
                  <div className="text-[10px] text-slate-400 font-mono flex gap-2">
                     <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">{"{UserName}"}</span>
                     <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">{"{BookTitle}"}</span>
                     <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">{"{DueDate}"}</span>
                  </div>
                </div>
                <textarea 
                  className="flex-1 w-full p-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-slate-700" 
                  value={templateBody}
                  onChange={e => setTemplateBody(e.target.value)}
                />
             </div>

             <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsBuilderOpen(false)}>Hủy</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={handleSaveRule} disabled={createMutation.isPending || channels.length === 0}>
                   {createMutation.isPending ? <RefreshCw className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16}/>}
                   Lưu & Kích hoạt quy trình
                </Button>
             </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="rules" className="w-full">
          <TabsList className="bg-white border text-slate-600 border-slate-200 p-1 w-full md:w-auto h-12 rounded-xl shadow-sm mb-6 inline-flex">
            <TabsTrigger value="rules" className="font-semibold px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700">Quy trình đang hoạt động</TabsTrigger>
            <TabsTrigger value="logs" className="font-semibold px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700">Nhật ký hoạt động</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-0">
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                     <TableRow>
                        <TableHead className="font-bold text-slate-700">Tên quy trình / Mục tiêu</TableHead>
                        <TableHead className="font-bold text-slate-700">Sự kiện</TableHead>
                        <TableHead className="font-bold text-slate-700">Điều kiện kích hoạt</TableHead>
                        <TableHead className="font-bold text-slate-700">Trạng thái</TableHead>
                        <TableHead className="text-right font-bold text-slate-700">Thao tác</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {loadingRules ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400"><RefreshCw className="animate-spin mx-auto mb-2" size={24}/> Đang tải dữ liệu...</TableCell></TableRow>
                     ) : rules.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Chưa có quy trình tự động nào được thiết lập.</TableCell></TableRow>
                     ) : rules.map(r => (
                        <TableRow key={r.id}>
                           <TableCell>
                              <p className="font-bold text-slate-800">{r.name}</p>
                              <div className="flex gap-2 mt-1">
                                {r.channels.map(c => (
                                  <span key={c} className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">{c === 'email' ? 'Email' : 'Trong ứng dụng'}</span>
                                ))}
                              </div>
                           </TableCell>
                           <TableCell className="text-sm font-medium text-slate-600">{mapTrigger(r.trigger)}</TableCell>
                           <TableCell className="text-sm text-slate-600">
                              <div className="flex items-center gap-1.5">
                                 <Clock size={14} className="text-indigo-400"/> {mapCondition(r.condition)}
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${r.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${r.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                {r.isActive ? 'Đang hoạt động' : 'Tạm hoãn'}
                              </div>
                           </TableCell>
                           <TableCell className="text-right space-x-2">
                              <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 text-slate-600" onClick={() => testMutation.mutate(r.id)} disabled={testMutation.isPending}>
                                 <Play size={14} className="mr-1.5" /> Chạy thử
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
                </Table>
             </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                     <TableRow>
                        <TableHead className="font-bold text-slate-700">Thời gian chạy</TableHead>
                        <TableHead className="font-bold text-slate-700">Log ID</TableHead>
                        <TableHead className="font-bold text-slate-700">Tên quy trình</TableHead>
                        <TableHead className="font-bold text-slate-700 text-center">Người nhận</TableHead>
                        <TableHead className="font-bold text-slate-700">Trạng thái gửi</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {loadingLogs ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400"><RefreshCw className="animate-spin mx-auto mb-2" size={24}/> Đang tải nhật ký...</TableCell></TableRow>
                     ) : logs.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Chưa có chạy quy trình hệ thống nào.</TableCell></TableRow>
                     ) : logs.map(l => (
                        <TableRow key={l.id}>
                           <TableCell className="text-sm font-medium text-slate-600">
                              {new Date(l.executedAt).toLocaleString('vi-VN')}
                           </TableCell>
                           <TableCell className="text-xs font-mono text-slate-400">{l.id.substring(0, 8)}</TableCell>
                           <TableCell className="font-medium text-slate-700">{l.ruleName}</TableCell>
                           <TableCell className="text-center">
                              <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full text-xs">
                                 <Users size={12} className="mr-1"/> {l.recipientCount}
                              </span>
                           </TableCell>
                           <TableCell>
                              {l.status === 'Success' && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600"><CheckCircle2 size={14}/> Hoàn thành 100%</span>}
                              {l.status === 'Partial' && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600"><AlertTriangle size={14}/> Lỗi một phần</span>}
                              {l.status === 'Failed' && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600"><AlertTriangle size={14}/> Thất bại ({l.errorMessage})</span>}
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
                </Table>
             </div>
          </TabsContent>
      </Tabs>
    </div>
  );
};

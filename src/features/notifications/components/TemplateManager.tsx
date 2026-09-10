import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquareText, PenTool, Sparkles, Send, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export const TemplateManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [aiContext, setAiContext] = useState('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['notificationTemplates'],
    queryFn: notificationService.getTemplates
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => notificationService.saveTemplate(data.id, data),
    onSuccess: () => {
      toast.success('Lưu mẫu thông báo thành công');
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
      setIsEditorOpen(false);
    }
  });

  const aiMutation = useMutation({
    mutationFn: () => notificationService.generateAiTemplate(aiContext, 'formal'),
    onSuccess: (data) => {
      setEditingTemplate((prev: any) => ({
        ...prev,
        subjectTemplate: data.subject,
        bodyTemplate: data.body
      }));
      toast.success('AI đã sinh thành công!');
    }
  });

  const handleEdit = (tpl: any) => {
    setEditingTemplate(tpl);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate({
      id: null,
      code: '',
      name: '',
      subjectTemplate: '',
      bodyTemplate: '',
      channels: ['Email', 'InApp']
    });
    setIsEditorOpen(true);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveMutation.mutate(editingTemplate);
  };

  const toggleChannel = (channel: string) => {
    setEditingTemplate((prev: any) => {
      const channels = prev.channels.includes(channel)
        ? prev.channels.filter((c: string) => c !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels };
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquareText className="text-indigo-600" size={18} />
          <h3 className="font-bold text-slate-800">Mẫu Thông báo (Templates)</h3>
        </div>
        <Button onClick={handleCreate} className="h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm">
          Tạo mẫu mới
        </Button>
      </div>
      
      <div className="overflow-x-auto min-h-[300px]">
        {isLoading ? (
           <div className="p-4 space-y-4">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-12 w-full" />
             <Skeleton className="h-12 w-full" />
           </div>
        ) : !templates || templates.length === 0 ? (
           <div className="p-8 text-center text-slate-500">Chưa có mẫu thông báo nào</div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-600 uppercase text-xs">Mã (Code)</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs">Tên hiển thị</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs">Kênh áp dụng</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(tpl => (
                <TableRow key={tpl.id}>
                  <TableCell className="font-mono text-sm font-semibold text-slate-700">{tpl.code}</TableCell>
                  <TableCell className="font-medium text-slate-900">{tpl.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {tpl.channels.map(c => (
                        <Badge key={c} variant="secondary" className="text-[10px] bg-slate-100 uppercase tracking-wider">{c}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(tpl)} className="text-indigo-600 hover:bg-indigo-50">
                      <PenTool size={14} className="mr-1" /> Sửa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-3xl p-0 rounded-2xl overflow-hidden bg-white">
           <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50">
             <DialogTitle>Trình chỉnh sửa Mẫu Thông báo</DialogTitle>
           </DialogHeader>
           
           {editingTemplate && (
             <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mã hệ thống (Code)</Label>
                    <Input 
                      value={editingTemplate.code} 
                      onChange={e => setEditingTemplate({...editingTemplate, code: e.target.value})} 
                      placeholder="VD: LOAN_DUE_WARNING" 
                      className="font-mono"
                      disabled={!!editingTemplate.id}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tên mẫu</Label>
                    <Input 
                      value={editingTemplate.name} 
                      onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} 
                      placeholder="VD: Nhắc trả sách (2 ngày)" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <Label>Kênh gửi (Channels)</Label>
                   <div className="flex gap-6 pt-2">
                     {['Email', 'InApp', 'Push'].map(ch => (
                        <div key={ch} className="flex items-center space-x-2">
                          <Checkbox id={`ch-${ch}`} checked={editingTemplate.channels.includes(ch)} onCheckedChange={() => toggleChannel(ch)} />
                          <Label htmlFor={`ch-${ch}`} className="text-sm font-medium leading-none cursor-pointer">{ch}</Label>
                        </div>
                     ))}
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                   <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex gap-4">
                     <div className="flex-1 space-y-2">
                       <Label className="text-indigo-900">AI Sinh nội dung tự động</Label>
                       <Input 
                         placeholder="Nhập ngữ cảnh... VD: Nhắc sinh viên trả sách trễ hạn bằng giọng điệu thân thiện" 
                         value={aiContext}
                         onChange={e => setAiContext(e.target.value)}
                         className="bg-white border-indigo-200 focus-visible:ring-indigo-500"
                       />
                     </div>
                     <Button 
                       type="button" 
                       onClick={() => aiMutation.mutate()} 
                       disabled={!aiContext || aiMutation.isPending}
                       className="self-end bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200"
                     >
                       {aiMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                       Sinh bằng AI
                     </Button>
                   </div>

                   <div className="space-y-2">
                     <Label>Tiêu đề (Subject)</Label>
                     <Input 
                       value={editingTemplate.subjectTemplate} 
                       onChange={e => setEditingTemplate({...editingTemplate, subjectTemplate: e.target.value})} 
                       placeholder="Sách sắp đến hạn: {{bookTitle}}" 
                     />
                   </div>

                   <div className="space-y-2">
                     <div className="flex justify-between items-end">
                       <Label>Nội dung (Body)</Label>
                       <span className="text-[10px] text-slate-500 font-mono">Biến: {`{{userName}}, {{bookTitle}}, {{dueDate}}`}</span>
                     </div>
                     <Textarea 
                       value={editingTemplate.bodyTemplate} 
                       onChange={e => setEditingTemplate({...editingTemplate, bodyTemplate: e.target.value})} 
                       placeholder="Chào {{userName}}, sách..." 
                       className="min-h-[120px]"
                     />
                   </div>
                </div>

                <div className="flex justify-end pt-4 gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsEditorOpen(false)}>Hủy</Button>
                   <Button type="submit" disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100">
                     <Send className="mr-2 h-4 w-4" />
                     Lưu Mẫu
                   </Button>
                </div>
             </form>
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

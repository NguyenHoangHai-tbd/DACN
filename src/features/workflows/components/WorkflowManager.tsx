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
import { 
  Zap, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Save, 
  Play, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Users,
  Mail,
  Bell,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { WorkflowRule } from '../types';

export const WorkflowManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  
  // Mappings for displaying triggers/conditions in friendly Vietnamese
  const mapTrigger = (t: string) => {
    switch (t) {
      case 'due_date': return 'Sắp tới hạn trả sách';
      case 'overdue': return 'Sách quá hạn mượn';
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

  const insertPlaceholder = (tag: string) => {
    setTemplateBody(prev => (prev ? `${prev} ${tag}` : tag));
  };

  const { 
    data: rules = [], 
    isLoading: loadingRules, 
    isError: errorRules, 
    refetch: refetchRules 
  } = useQuery({
    queryKey: ['workflowRules'],
    queryFn: workflowService.getRules
  });

  const { 
    data: logs = [], 
    isLoading: loadingLogs, 
    isError: errorLogs, 
    refetch: refetchLogs 
  } = useQuery({
    queryKey: ['workflowLogs'],
    queryFn: workflowService.getLogs
  });

  const createMutation = useMutation({
    mutationFn: (newRule: Omit<WorkflowRule, 'id'>) => workflowService.createRule(newRule),
    onSuccess: () => {
      toast.success('Đã cấu hình và kích hoạt quy trình thành công!');
      setIsBuilderOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workflowRules'] });
    },
    onError: () => {
      toast.error('Không thể tạo quy trình tự động. Vui lòng thử lại.');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      workflowService.updateRule(id, { isActive }),
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Đã kích hoạt quy trình' : 'Đã tạm dừng quy trình');
      queryClient.invalidateQueries({ queryKey: ['workflowRules'] });
    },
    onError: () => {
      toast.error('Không thể cập nhật trạng thái quy trình');
    }
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => workflowService.testRule(id),
    onSuccess: () => {
      toast.success('Đã chạy thử quy trình thành công');
      queryClient.invalidateQueries({ queryKey: ['workflowLogs'] });
    },
    onError: () => {
      toast.error('Không thể chạy thử quy trình. Vui lòng thử lại.');
    }
  });

  const handleSaveRule = () => {
    if (!ruleName.trim()) {
      toast.error('Vui lòng nhập tên quy trình');
      return;
    }
    if (channels.length === 0) {
      toast.error('Vui lòng chọn ít nhất một kênh gửi thông báo');
      return;
    }
    createMutation.mutate({
      name: ruleName.trim(),
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

  const toggleExpand = (id: string) => {
    setExpandedRuleId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="bg-teal-50 border border-teal-200/80 p-3 rounded-xl text-teal-700 shrink-0">
            <Zap size={22} className="text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">Thông báo & Quy trình tự động</h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                SaaS Automation
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Tự động hoá các tác vụ nhắc nhở quá hạn, đặt giữ sách và gửi thông báo độc giả theo sự kiện.
            </p>
          </div>
        </div>

        <Button 
          className={isBuilderOpen 
            ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold shadow-none shrink-0" 
            : "bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm shrink-0"}
          onClick={() => setIsBuilderOpen(!isBuilderOpen)}
        >
          {isBuilderOpen ? (
            <span className="flex items-center gap-2">
              <X size={16} /> Đóng trình tạo
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Plus size={16} /> Tạo quy trình mới
            </span>
          )}
        </Button>
      </div>

      {/* Builder Form Card */}
      {isBuilderOpen && (
        <Card className="border-teal-200/80 shadow-md bg-white overflow-hidden">
          <CardHeader className="bg-teal-50/60 border-b border-teal-100 py-4 px-6">
            <CardTitle className="flex items-center justify-between text-base font-bold text-teal-950">
              <span className="flex items-center gap-2">
                <Sparkles className="text-teal-600" size={18}/> Thiết lập quy trình tự động mới
              </span>
              <span className="text-xs font-normal text-slate-500">Bước cấu hình quy tắc & bản tin</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Triggers & Channels */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Tên quy trình <span className="text-rose-500">*</span>
                </label>
                <Input 
                  placeholder="vd: Nhắc nhở trả sách trước 3 ngày..." 
                  className="rounded-lg font-medium border-slate-300 focus-visible:ring-teal-500 focus-visible:border-teal-500 h-10"
                  value={ruleName} 
                  onChange={e => setRuleName(e.target.value)} 
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Sự kiện kích hoạt (Trigger)
                  </label>
                  <Select value={trigger} onValueChange={handleTriggerChange}>
                    <SelectTrigger className="border-slate-300 focus:ring-teal-500 h-10 bg-white">
                      <SelectValue placeholder="Chọn sự kiện"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_date">Mượn sách (Sắp tới hạn)</SelectItem>
                      <SelectItem value="overdue">Mượn sách (Quá hạn)</SelectItem>
                      <SelectItem value="user_joined">Độc giả mới đăng ký</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Thời điểm kích hoạt (Condition)
                  </label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger className="border-slate-300 focus:ring-teal-500 h-10 bg-white">
                      <SelectValue placeholder="Chọn điều kiện"/>
                    </SelectTrigger>
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
                          <SelectItem value="3_days_after">Quá hạn 3 ngày</SelectItem>
                        </>
                      )}
                      {trigger === 'user_joined' && (
                        <SelectItem value="immediately">Ngay lập tức</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Kênh gửi thông báo (Channels) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                    channels.includes('email') 
                      ? 'bg-teal-50/50 border-teal-300 text-teal-900' 
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Mail size={16} className={channels.includes('email') ? 'text-teal-600' : 'text-slate-400'} />
                      <span className="text-sm font-semibold">Email</span>
                    </div>
                    <Switch 
                      checked={channels.includes('email')} 
                      onCheckedChange={() => toggleChannel('email')} 
                    />
                  </label>

                  <label className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                    channels.includes('push_noti') 
                      ? 'bg-teal-50/50 border-teal-300 text-teal-900' 
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Bell size={16} className={channels.includes('push_noti') ? 'text-teal-600' : 'text-slate-400'} />
                      <span className="text-sm font-semibold">Thông báo ứng dụng</span>
                    </div>
                    <Switch 
                      checked={channels.includes('push_noti')} 
                      onCheckedChange={() => toggleChannel('push_noti')} 
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Message Template */}
            <div className="flex flex-col h-full bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <FileText size={14} className="text-teal-600"/> Mẫu văn bản thông báo
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-medium">Chèn biến:</span>
                  <button 
                    type="button" 
                    onClick={() => insertPlaceholder('{UserName}')}
                    className="text-[11px] bg-white hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-300 transition-colors"
                    title="Nhấn để chèn biến họ tên người nhận"
                  >
                    {'{UserName}'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertPlaceholder('{BookTitle}')}
                    className="text-[11px] bg-white hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-300 transition-colors"
                    title="Nhấn để chèn biến tên sách"
                  >
                    {'{BookTitle}'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertPlaceholder('{DueDate}')}
                    className="text-[11px] bg-white hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-300 transition-colors"
                    title="Nhấn để chèn biến ngày hết hạn"
                  >
                    {'{DueDate}'}
                  </button>
                </div>
              </div>

              <textarea 
                className="flex-1 w-full p-3.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none font-normal text-slate-800 leading-relaxed min-h-[130px]" 
                value={templateBody}
                onChange={e => setTemplateBody(e.target.value)}
                placeholder="Nhập nội dung mẫu thông báo gửi đến độc giả..."
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Hệ thống sẽ tự động thay thế các biến <code className="text-teal-700 font-mono">{'{UserName}'}</code>, <code className="text-teal-700 font-mono">{'{BookTitle}'}</code>, <code className="text-teal-700 font-mono">{'{DueDate}'}</code> bằng dữ liệu thực khi kích hoạt.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="lg:col-span-2 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsBuilderOpen(false)}
                className="border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
              >
                Hủy
              </Button>
              <Button 
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm" 
                onClick={handleSaveRule} 
                disabled={createMutation.isPending || channels.length === 0}
              >
                {createMutation.isPending ? (
                  <RefreshCw className="animate-spin mr-2" size={16}/>
                ) : (
                  <Save className="mr-2" size={16}/>
                )}
                Lưu & Kích hoạt quy trình
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Rules vs Logs */}
      <Tabs defaultValue="rules" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <TabsList className="bg-slate-100/90 border border-slate-200 p-1 w-full sm:w-auto h-11 rounded-xl">
            <TabsTrigger 
              value="rules" 
              className="font-semibold px-5 py-1.5 rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-sm transition-all"
            >
              <Zap size={14} className="mr-1.5 text-teal-600" />
              Quy trình đang hoạt động ({rules.length})
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="font-semibold px-5 py-1.5 rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-sm transition-all"
            >
              <Clock size={14} className="mr-1.5 text-slate-500" />
              Nhật ký hoạt động ({logs.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Workflow Rules */}
        <TabsContent value="rules" className="mt-0 focus-visible:outline-none">
          {loadingRules ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <RefreshCw className="animate-spin mx-auto mb-3 text-teal-600" size={30}/>
              <p className="text-sm font-medium text-slate-600">Đang tải danh sách quy trình tự động...</p>
            </div>
          ) : errorRules ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center shadow-sm">
              <AlertCircle className="mx-auto mb-2 text-rose-500" size={28}/>
              <p className="text-sm font-semibold text-rose-800">Không thể tải dữ liệu quy trình tự động</p>
              <p className="text-xs text-rose-600 mt-1">Đã xảy ra sự cố khi kết nối tới máy chủ dịch vụ.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchRules()} 
                className="mt-4 border-rose-300 text-rose-700 hover:bg-rose-100"
              >
                <RefreshCw size={14} className="mr-1.5"/> Thử lại
              </Button>
            </div>
          ) : rules.length === 0 ? (
            <div className="space-y-4">
              {/* Tiêu đề phần gợi ý mẫu quy trình */}
              <div className="bg-gradient-to-r from-teal-50/80 to-indigo-50/60 border border-teal-100/80 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-xs shrink-0">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">
                      Mẫu quy trình đề xuất sẵn cho Thư viện TBD
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chọn nhanh mẫu kích hoạt tự động chuẩn để áp dụng ngay vào vận hành thông báo độc giả.
                    </p>
                  </div>
                </div>

                <Button 
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs self-start sm:self-auto shrink-0"
                  onClick={() => setIsBuilderOpen(true)}
                >
                  <Plus size={14} className="mr-1.5"/> Tùy chỉnh quy trình mới
                </Button>
              </div>

              {/* Lưới 3 thẻ mẫu đề xuất */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                {/* Mẫu 1: Nhắc trả sách trước 3 ngày */}
                <div className="border border-slate-200/90 rounded-2xl p-5 bg-white shadow-2xs hover:border-teal-500/40 hover:shadow-sm transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 border border-teal-100">
                      <Mail size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      Nhắc trả sách trước 3 ngày
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Tự động gửi email thông báo ngày hết hạn mượn và hướng dẫn gia hạn trực tuyến.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md">
                        Sắp tới hạn
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        Trước 3 ngày
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setRuleName('Nhắc nhở trả sách trước 3 ngày');
                      setTrigger('due_date');
                      setCondition('3_days_before');
                      setIsBuilderOpen(true);
                    }}
                    variant="outline"
                    className="mt-4 w-full h-8 text-xs font-semibold text-teal-700 border-teal-200 hover:bg-teal-50 hover:text-teal-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Dùng mẫu này
                  </Button>
                </div>

                {/* Mẫu 2: Cảnh báo quá hạn 1 ngày */}
                <div className="border border-slate-200/90 rounded-2xl p-5 bg-white shadow-2xs hover:border-teal-500/40 hover:shadow-sm transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-100">
                      <AlertTriangle size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      Cảnh báo quá hạn 1 ngày
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Nhắc nhở độc giả hoàn trả sách và lưu ý mức tính phí phạt quá hạn theo quy định.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                        Quá hạn mượn
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        Sau 1 ngày
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setRuleName('Cảnh báo sách quá hạn mượn 1 ngày');
                      setTrigger('overdue');
                      setCondition('1_day_after');
                      setIsBuilderOpen(true);
                    }}
                    variant="outline"
                    className="mt-4 w-full h-8 text-xs font-semibold text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Dùng mẫu này
                  </Button>
                </div>

                {/* Mẫu 3: Chào mừng độc giả mới */}
                <div className="border border-slate-200/90 rounded-2xl p-5 bg-white shadow-2xs hover:border-teal-500/40 hover:shadow-sm transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 border border-purple-100">
                      <Sparkles size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      Chào mừng độc giả mới
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Gửi thư chào mừng và cẩm nang hướng dẫn tra cứu tài liệu số cho bạn đọc mới gia nhập.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md">
                        Độc giả mới
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        Ngay lập tức
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setRuleName('Chào mừng bạn đọc mới gia nhập TBD');
                      setTrigger('user_joined');
                      setCondition('immediately');
                      setIsBuilderOpen(true);
                    }}
                    variant="outline"
                    className="mt-4 w-full h-8 text-xs font-semibold text-purple-700 border-purple-200 hover:bg-purple-50 hover:text-purple-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Dùng mẫu này
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5 pl-6">
                        Tên quy trình / Mục tiêu
                      </TableHead>
                      <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">
                        Sự kiện kích hoạt
                      </TableHead>
                      <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">
                        Thời điểm gửi
                      </TableHead>
                      <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">
                        Trạng thái
                      </TableHead>
                      <TableHead className="text-right font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5 pr-6">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {rules.map(r => {
                      const isExpanded = expandedRuleId === r.id;
                      const isTesting = testMutation.isPending && (testMutation.variables as unknown as string) === r.id;
                      const isToggling = toggleMutation.isPending && (toggleMutation.variables as unknown as { id: string })?.id === r.id;

                      return (
                        <React.Fragment key={r.id}>
                          <TableRow className="hover:bg-slate-50/70 transition-colors">
                            <TableCell className="py-4 pl-6">
                              <div className="font-bold text-slate-900 text-sm">{r.name}</div>
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {r.channels.map(c => (
                                  <span 
                                    key={c} 
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                                  >
                                    {c === 'email' ? <Mail size={11} className="text-slate-500" /> : <Bell size={11} className="text-teal-600" />}
                                    {c === 'email' ? 'Email' : 'Ứng dụng'}
                                  </span>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(r.id)}
                                  className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-800 font-medium ml-1 cursor-pointer"
                                >
                                  <Eye size={11} />
                                  {isExpanded ? 'Ẩn mẫu tin' : 'Xem mẫu tin'}
                                  {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                </button>
                              </div>
                            </TableCell>

                            <TableCell className="py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                r.trigger === 'due_date' 
                                  ? 'bg-teal-50 text-teal-700 border-teal-200' 
                                  : r.trigger === 'overdue' 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                  : 'bg-sky-50 text-sky-700 border-sky-200'
                              }`}>
                                {mapTrigger(r.trigger)}
                              </span>
                            </TableCell>

                            <TableCell className="py-4">
                              <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
                                <Clock size={14} className="text-slate-400 shrink-0"/>
                                <span>{mapCondition(r.condition)}</span>
                              </div>
                            </TableCell>

                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <Switch 
                                  checked={r.isActive} 
                                  disabled={isToggling}
                                  onCheckedChange={(checked) => toggleMutation.mutate({ id: r.id, isActive: checked })}
                                />
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  r.isActive 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${r.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                  {r.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="py-4 pr-6 text-right">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-slate-300 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 text-slate-700 font-medium transition-colors"
                                onClick={() => testMutation.mutate(r.id)} 
                                disabled={isTesting || !r.isActive}
                                title={!r.isActive ? "Cần kích hoạt quy trình trước khi chạy thử" : "Chạy thử nghiệm quy trình ngay"}
                              >
                                {isTesting ? (
                                  <RefreshCw size={13} className="animate-spin mr-1.5" />
                                ) : (
                                  <Play size={13} className="mr-1.5 text-teal-600" />
                                )}
                                Chạy thử
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Template Preview Row */}
                          {isExpanded && (
                            <TableRow className="bg-slate-50/90 border-t border-slate-100">
                              <TableCell colSpan={5} className="py-3.5 px-6">
                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                      <FileText size={13} className="text-teal-600"/>
                                      Mẫu nội dung thông báo gửi đi:
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-mono">ID: {r.id}</span>
                                  </div>
                                  <p className="text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
                                    {r.templateBody || 'Chưa có nội dung mẫu.'}
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View (Screen < 768px) */}
              <div className="block md:hidden space-y-3">
                {rules.map(r => {
                  const isExpanded = expandedRuleId === r.id;
                  const isTesting = testMutation.isPending && (testMutation.variables as unknown as string) === r.id;
                  const isToggling = toggleMutation.isPending && (toggleMutation.variables as unknown as { id: string })?.id === r.id;

                  return (
                    <div 
                      key={r.id} 
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{r.name}</h4>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {r.channels.map(c => (
                              <span 
                                key={c} 
                                className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                              >
                                {c === 'email' ? <Mail size={10} className="text-slate-500" /> : <Bell size={10} className="text-teal-600" />}
                                {c === 'email' ? 'Email' : 'Ứng dụng'}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Switch 
                            checked={r.isActive} 
                            disabled={isToggling}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: r.id, isActive: checked })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Sự kiện</span>
                          <span className="font-medium text-slate-700">{mapTrigger(r.trigger)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Thời điểm</span>
                          <span className="font-medium text-slate-700">{mapCondition(r.condition)}</span>
                        </div>
                      </div>

                      {/* Expandable message template */}
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleExpand(r.id)}
                          className="w-full flex items-center justify-between text-xs font-semibold text-teal-700 py-1"
                        >
                          <span className="flex items-center gap-1">
                            <FileText size={12} />
                            {isExpanded ? 'Ẩn mẫu nội dung' : 'Xem mẫu nội dung thông báo'}
                          </span>
                          {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>
                        
                        {isExpanded && (
                          <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {r.templateBody || 'Chưa có nội dung mẫu.'}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${r.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {r.isActive ? 'Đang kích hoạt' : 'Tạm dừng'}
                        </span>

                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-slate-300 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-xs h-8"
                          onClick={() => testMutation.mutate(r.id)} 
                          disabled={isTesting || !r.isActive}
                        >
                          {isTesting ? (
                            <RefreshCw size={12} className="animate-spin mr-1" />
                          ) : (
                            <Play size={12} className="mr-1 text-teal-600" />
                          )}
                          Chạy thử
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Workflow Logs */}
        <TabsContent value="logs" className="mt-0 focus-visible:outline-none">
          {loadingLogs ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <RefreshCw className="animate-spin mx-auto mb-3 text-teal-600" size={30}/>
              <p className="text-sm font-medium text-slate-600">Đang tải nhật ký hoạt động quy trình...</p>
            </div>
          ) : errorLogs ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center shadow-sm">
              <AlertCircle className="mx-auto mb-2 text-rose-500" size={28}/>
              <p className="text-sm font-semibold text-rose-800">Không thể tải nhật ký hoạt động</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchLogs()} 
                className="mt-4 border-rose-300 text-rose-700 hover:bg-rose-100"
              >
                <RefreshCw size={14} className="mr-1.5"/> Thử lại
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-3.5 border border-slate-200">
                <Clock size={26} />
              </div>
              <h3 className="text-base font-bold text-slate-800">Chưa có nhật ký ghi nhận</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Khi các quy trình tự động được kích hoạt theo lịch hoặc chạy thử nghiệm, lịch sử gửi thông báo sẽ hiển thị chi tiết tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5 pl-6">
                        Thời gian chạy
                      </TableHead>
                      <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">
                        Mã log
                      </TableHead>
                      <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5">
                        Tên quy trình
                      </TableHead>
                      <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5 text-center">
                        Người nhận
                      </TableHead>
                      <TableHead className="font-bold text-slate-700 text-xs uppercase tracking-wider py-3.5 pr-6">
                        Trạng thái gửi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {logs.map(l => (
                      <TableRow key={l.id} className="hover:bg-slate-50/70 transition-colors">
                        <TableCell className="py-4 pl-6 text-sm font-medium text-slate-700">
                          {new Date(l.executedAt).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {l.id.substring(0, 8)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 font-semibold text-slate-900 text-sm">
                          {l.ruleName}
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="inline-flex items-center justify-center bg-teal-50 text-teal-700 border border-teal-200 font-bold px-2.5 py-0.5 rounded-full text-xs">
                            <Users size={12} className="mr-1"/> {l.recipientCount}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 pr-6">
                          {l.status === 'Success' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                              <CheckCircle2 size={13} className="text-emerald-600"/> Thành công 100%
                            </span>
                          )}
                          {l.status === 'Partial' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                              <AlertTriangle size={13} className="text-amber-600"/> Lỗi một phần
                            </span>
                          )}
                          {l.status === 'Failed' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                              <AlertTriangle size={13} className="text-rose-600"/> Thất bại {l.errorMessage ? `(${l.errorMessage})` : ''}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View (Screen < 768px) */}
              <div className="block md:hidden space-y-3">
                {logs.map(l => (
                  <div key={l.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{l.ruleName}</h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {new Date(l.executedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                        {l.id.substring(0, 8)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="inline-flex items-center text-xs font-medium text-slate-600">
                        <Users size={12} className="mr-1 text-slate-400"/> {l.recipientCount} người nhận
                      </span>

                      <div>
                        {l.status === 'Success' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={11} className="text-emerald-600"/> Thành công
                          </span>
                        )}
                        {l.status === 'Partial' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} className="text-amber-600"/> Lỗi một phần
                          </span>
                        )}
                        {l.status === 'Failed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} className="text-rose-600"/> Thất bại
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};


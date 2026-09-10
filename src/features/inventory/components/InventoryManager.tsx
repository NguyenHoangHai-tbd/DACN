import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventoryService';
import { adminService } from '../../admin/services/adminService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, Plus, Search, Play, StopCircle, PackageX, AlertTriangle, CheckCircle, SearchCode, Sparkles, Loader2, Barcode } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useSignalRListener } from '../../../shared/signalr/useSignalRListener';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

import { useTranslation } from 'react-i18next';

import { usePermission } from '../../../shared/hooks/usePermission';

export const InventoryManager: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission, currentRole, isSuperAdmin, isTenantAdmin } = usePermission();
  const isInventoryStaff = currentRole === 'inventory_staff';
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const canViewInventory = hasPermission('inventory.view');
  const canManageInventory = hasPermission('inventory.manage');
  const canScanInventory = hasPermission('inventory.scan');
  const canCloseInventory = hasPermission('inventory.close');
  const canResolveInventory = hasPermission('inventory.resolve');

  const canAccessInsights = (hasPermission('inventory.manage') || hasPermission('inventory.resolve') || isSuperAdmin || isTenantAdmin) && !isInventoryStaff;

  useSignalRListener('inventory.progress', (payload) => {
    toast.info(`Cập nhật kiểm kê thời gian thực: +1 sách`);
  }, canViewInventory ? [['inventorySession', selectedSessionId as string], ['inventoryDiscrepancies', selectedSessionId as string]] : []);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionBranch, setNewSessionBranch] = useState('');

  // Scanning state
  const [scanBarcode, setScanBarcode] = useState('');
  const [scanCondition, setScanCondition] = useState('Good');

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: adminService.getBranches,
    enabled: canViewInventory
  });

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['inventorySessions'],
    queryFn: () => inventoryService.getSessions(),
    enabled: canViewInventory
  });

  const { data: activeSession, isLoading: loadingActiveSession } = useQuery({
    queryKey: ['inventorySession', selectedSessionId],
    queryFn: () => inventoryService.getSessionDetails(selectedSessionId!),
    enabled: canViewInventory && !!selectedSessionId,
    refetchInterval: (query) => (canViewInventory && query.state.data?.status === 'Open' ? 5000 : false)
  });

  const { data: discrepancies = [], isLoading: loadingDiscrepancies } = useQuery({
    queryKey: ['inventoryDiscrepancies', selectedSessionId],
    queryFn: () => inventoryService.getDiscrepancies(selectedSessionId!),
    enabled: canViewInventory && !!selectedSessionId,
    refetchInterval: (query) => canViewInventory && activeSession?.status === 'Open' ? 5000 : false
  });

  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ['inventoryInsights', selectedSessionId],
    queryFn: () => inventoryService.getAiInsights(selectedSessionId!),
    enabled: canViewInventory && !!selectedSessionId && canAccessInsights,
  });

  const createMutation = useMutation({
    mutationFn: () => inventoryService.createSession({ name: newSessionName, branchId: newSessionBranch }),
    onSuccess: (data) => {
      toast.success(t('inventory.toast_created', 'Đã tạo phiên kiểm kê mới'));
      queryClient.invalidateQueries({ queryKey: ['inventorySessions'] });
      setIsCreateOpen(false);
      setNewSessionName('');
      setNewSessionBranch('');
      setSelectedSessionId(data.id);
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, t('inventory.toast_create_err', 'Lỗi khi tạo phiên kiểm kê')));
    }
  });

  const scanMutation = useMutation({
    mutationFn: () => inventoryService.scanBarcode(selectedSessionId!, scanBarcode, scanCondition),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message);
        setScanBarcode('');
        queryClient.invalidateQueries({ queryKey: ['inventorySession', selectedSessionId] });
      } else {
        toast.error(res.message || 'Quét mã thất bại.');
      }
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, t('inventory.toast_scan_err', 'Lỗi khi quét mã')));
    }
  });

  const closeMutation = useMutation({
    mutationFn: () => inventoryService.closeSession(selectedSessionId!),
    onSuccess: () => {
      toast.success(t('inventory.toast_closed', 'Đã đóng phiên kiểm kê'));
      queryClient.invalidateQueries({ queryKey: ['inventorySessions'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySession', selectedSessionId] });
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, t('inventory.toast_close_err', 'Lỗi khi đóng phiên')));
    }
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, res }: { id: string, res: string }) => inventoryService.resolveDiscrepancy(id, res),
    onSuccess: () => {
      toast.success(t('inventory.toast_resolved', 'Đã cập nhật hướng xử lý'));
      queryClient.invalidateQueries({ queryKey: ['inventoryDiscrepancies', selectedSessionId] });
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Không thể cập nhật hướng xử lý lệch kiểm kê.'));
    }
  });

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanBarcode) return;
    scanMutation.mutate();
  };

  if (!canViewInventory) {
    return <div className="p-8 text-center text-slate-500">Bạn không có quyền truy cập chức năng kiểm kho</div>;
  }

  if (selectedSessionId && activeSession) {
    const progress = activeSession.expectedCount > 0 
      ? Math.round((activeSession.scannedCount / activeSession.expectedCount) * 100) 
      : 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
             <div className="flex items-center gap-2 mb-1">
               <Button variant="ghost" size="sm" onClick={() => setSelectedSessionId(null)} className="h-8 -ml-2 text-slate-500">
                  &larr; {t('inventory.back', 'Quay lại')}
               </Button>
               <h2 className="text-lg font-bold text-slate-800">{activeSession.name}</h2>
               {activeSession.status === 'Open' ? (
                 <Badge className="bg-emerald-100 text-emerald-800">{t('inventory.status_open', 'Đang mở')}</Badge>
               ) : (
                 <Badge variant="secondary">{t('inventory.status_closed', 'Đã đóng')}</Badge>
               )}
             </div>
             <p className="text-sm text-slate-500">
               {t('inventory.branch', 'Chi nhánh')}: <span className="font-semibold">{activeSession.branchName}</span> | 
               {t('inventory.col_date', 'Ngày tạo')}: {format(new Date(activeSession.createdAt), 'dd/MM/yyyy HH:mm')}
             </p>
          </div>
          {activeSession.status === 'Open' && hasPermission('inventory.close') && !isInventoryStaff && (
             <Button 
               variant="outline" 
               className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
               onClick={() => closeMutation.mutate()}
               disabled={closeMutation.isPending}
             >
               {closeMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <StopCircle size={16} className="mr-2" />}
               Chốt Phiên Kiểm Kê
             </Button>
          )}
        </div>

        <div className={canAccessInsights ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "grid grid-cols-1 gap-6"}>
          {/* Main Content Area */}
          <div className={canAccessInsights ? "lg:col-span-2 space-y-6" : "space-y-6"}>
            
            {/* Progress & Quick Scan */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-slate-700">{t('inventory.progress_title', 'Tiến độ quét mã')}</span>
                  <span className="font-mono font-bold text-indigo-600">{activeSession.scannedCount} / {activeSession.expectedCount} {t('inventory.progress_unit', 'sách')}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-indigo-500 h-3 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              {activeSession.status === 'Open' && (hasPermission('inventory.scan') || hasPermission('inventory.manage')) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Barcode size={16} /> {t('inventory.scan_title', 'Quét mã ngay (Web Input)')}</h3>
                  <form onSubmit={handleScanSubmit} className="flex gap-3">
                    <Input 
                      placeholder={t('inventory.scan_placeholder', 'Nhập mã vạch...')} 
                      className="bg-white"
                      value={scanBarcode}
                      onChange={e => setScanBarcode(e.target.value)}
                      autoFocus
                    />
                    <Select value={scanCondition} onValueChange={setScanCondition}>
                      <SelectTrigger className="w-[140px] bg-white">
                        <SelectValue placeholder={t('inventory.scan_condition', 'Tình trạng')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Good">Tốt</SelectItem>
                        <SelectItem value="Damaged">Rách/Hỏng</SelectItem>
                        <SelectItem value="Lost">Mất trang</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={scanMutation.isPending}>
                      {scanMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : t('inventory.scan_btn', 'Quét')}
                    </Button>
                  </form>
                  <p className="text-xs text-slate-500 mt-2">{t('inventory.scan_hint', 'Gợi ý: Có thể nhập mã vạch bằng máy quét USB hoặc thiết bị quét mã.')}</p>
                </div>
              )}
            </div>

            {/* Discrepancies Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-red-50/30">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" /> {t('inventory.discord_title', 'Sai lệch phát hiện')} ({discrepancies.length})
                </h3>
              </div>
              <div className="overflow-x-auto min-h-[300px]">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                       <TableHead className="text-xs font-bold uppercase text-slate-600">{t('inventory.col_book', 'Sách')}</TableHead>
                       <TableHead className="text-xs font-bold uppercase text-slate-600">{t('inventory.col_barcode', 'Mã vạch')}</TableHead>
                       <TableHead className="text-xs font-bold uppercase text-slate-600">{t('inventory.col_sys', 'Hệ thống')}</TableHead>
                       <TableHead className="text-xs font-bold uppercase text-slate-600">{t('inventory.col_actual', 'Thực tế')}</TableHead>
                       <TableHead className="text-xs font-bold uppercase text-slate-600">{t('inventory.col_condition', 'Tình trạng')}</TableHead>
                       {!isInventoryStaff && (
                         <TableHead className="text-xs font-bold uppercase text-slate-600 text-right">{t('inventory.col_resolve', 'Xử lý')}</TableHead>
                       )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDiscrepancies ? (
                      <TableRow><TableCell colSpan={isInventoryStaff ? 5 : 6} className="text-center py-8">{t('common.state.loading', 'Đang tải...')}</TableCell></TableRow>
                    ) : discrepancies.length === 0 ? (
                      <TableRow><TableCell colSpan={isInventoryStaff ? 5 : 6} className="text-center py-8 text-slate-500">{t('inventory.discord_empty', 'Chưa phát hiện sai lệch nào.')}</TableCell></TableRow>
                    ) : discrepancies.map(d => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className="font-medium text-sm text-slate-800 line-clamp-1">{d.bookTitle}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{d.copyBarcode}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs text-slate-500 uppercase">
                            {d.expectedStatus === 'Available' ? 'Sẵn có' : d.expectedStatus === 'Loaned' ? 'Đang mượn' : d.expectedStatus === 'Missing' ? 'Mất tích' : d.expectedStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                           {d.actualStatus === 'Missing' ? (
                             <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">{t('inventory.status_missing', 'Mất tích')}</Badge>
                           ) : d.actualStatus === 'Good' ? (
                             <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs">Tốt</Badge>
                           ) : d.actualStatus === 'Damaged' ? (
                             <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-xs">Hư hỏng</Badge>
                           ) : (
                             <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-xs">{d.actualStatus}</Badge>
                           )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {d.condition === 'Good' ? 'Tốt' : d.condition === 'Damaged' ? 'Hư hỏng' : d.condition}
                        </TableCell>
                        {!isInventoryStaff && (
                          <TableCell className="text-right">
                             {activeSession.status === 'Closed' ? (
                               <Select 
                                 value={d.resolution || 'Pending'} 
                                 onValueChange={(val) => resolveMutation.mutate({ id: d.id, res: val })}
                               >
                                  <SelectTrigger className="h-8 w-[140px] text-xs ml-auto" disabled={!hasPermission('inventory.resolve')}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pending">{t('inventory.resolve_pending', 'Chờ xử lý')}</SelectItem>
                                    <SelectItem value="Approve Loss">{t('inventory.resolve_loss', 'Xác nhận mất')}</SelectItem>
                                    <SelectItem value="Change Condition">{t('inventory.resolve_damage', 'Cập nhật tình trạng')}</SelectItem>
                                    <SelectItem value="Reject">{t('inventory.resolve_ignore', 'Bỏ qua')}</SelectItem>
                                  </SelectContent>
                               </Select>
                             ) : (
                               <span className="text-xs text-slate-400 italic">{t('inventory.resolve_wait', 'Chờ chốt phiên')}</span>
                             )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* AI Insights Panel */}
          {canAccessInsights && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl shadow-md p-6 text-white relative overflow-hidden flex flex-col min-h-[400px]">
                 <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                   <Sparkles size={120} />
                 </div>
                 
                 <h3 className="font-bold flex items-center gap-2 mb-6 text-lg relative z-10">
                   <Sparkles className="text-indigo-400" size={20} /> {t('inventory.ai_title', 'Phân tích kiểm kê bằng AI')}
                 </h3>

                 {loadingInsights ? (
                   <div className="space-y-4 animate-pulse relative z-10 flex-1">
                     <div className="h-4 bg-white/10 rounded w-full"></div>
                     <div className="h-4 bg-white/10 rounded w-5/6"></div>
                     <div className="h-20 bg-white/5 rounded mt-6"></div>
                   </div>
                 ) : !insights ? (
                   <div className="text-indigo-200 text-sm relative z-10 flex-1">{t('inventory.ai_wait', 'Đang chờ thu thập đủ mẫu dữ liệu để AI phân tích...')}</div>
                 ) : (
                   <div className="space-y-6 relative z-10 flex-1">
                     {insights.anomalies.length > 0 && (
                       <div>
                         <h4 className="text-xs font-bold text-red-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                           <AlertTriangle size={14} /> {t('inventory.ai_anomalies', 'Bất thường')}
                         </h4>
                         <ul className="space-y-2">
                           {insights.anomalies.map((anom, idx) => (
                             <li key={idx} className="text-xs bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-red-100 flex items-start gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0" />
                               <span>{anom}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}

                     {insights.highRiskSections.length > 0 && (
                       <div>
                         <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                           <PackageX size={14} /> {t('inventory.ai_risk', 'Kệ có rủi ro cao (Chưa quét)')}
                         </h4>
                         <div className="flex flex-wrap gap-2">
                           {insights.highRiskSections.map((sec, idx) => (
                             <Badge key={idx} className="bg-amber-500/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500/30">
                               {sec}
                             </Badge>
                           ))}
                         </div>
                       </div>
                     )}

                     {insights.suggestions.length > 0 && (
                       <div>
                         <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3">{t('inventory.ai_suggest', 'Gợi ý hành động')}</h4>
                         <ul className="space-y-2 text-sm text-indigo-100">
                           {insights.suggestions.map((sug, idx) => (
                             <li key={idx} className="flex items-start gap-2 border-t border-white/5 pt-2 first:border-0 first:pt-0">
                               <CheckCircle size={14} className="mt-0.5 text-indigo-400 shrink-0" />
                               <span className="leading-tight">{sug}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Session List View
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="text-indigo-600" /> {t('inventory.title', 'Quản lý Kiểm kê Kho')}
            </h2>
            <p className="text-sm text-slate-500">{t('inventory.subtitle', 'Đối soát tồn kho và xử lý sách mất mát/hư hỏng.')}</p>
         </div>

         {!isInventoryStaff && (
           <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
             <DialogTrigger render={
               <Button className="font-bold bg-indigo-600 hover:bg-indigo-700" disabled={!hasPermission('inventory.manage')}>
                 <Plus size={16} className="mr-2" /> {t('inventory.create_button', 'Tạo đợt kiểm kê')}
               </Button>
             } />
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>{t('inventory.create_title', 'Tạo đợt kiểm kê mới')}</DialogTitle>
               </DialogHeader>
               <div className="space-y-4 py-4">
                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-700">{t('inventory.session_name', 'Tên đợt kiểm kê')}</label>
                   <Input 
                     placeholder={t('inventory.session_name_placeholder', 'VD: Kiểm kê định kỳ T06/2026')} 
                     value={newSessionName}
                     onChange={e => setNewSessionName(e.target.value)}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-700">{t('inventory.branch', 'Chi nhánh')}</label>
                   <Select value={newSessionBranch} onValueChange={setNewSessionBranch}>
                       <SelectTrigger>
                         <SelectValue placeholder={t('inventory.branch_placeholder', 'Chọn chi nhánh...')} />
                       </SelectTrigger>
                       <SelectContent>
                         {branches.map(b => (
                           <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                 </div>
               </div>
               <DialogFooter>
                 <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('inventory.cancel', 'Hủy')}</Button>
                 <Button 
                  onClick={() => createMutation.mutate()} 
                  disabled={!newSessionName || !newSessionBranch || createMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                 >
                   {createMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                   {t('inventory.start', 'Khởi tạo & Bắt đầu')}
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
         )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold uppercase text-xs text-slate-600">{t('inventory.col_name', 'Tên đợt kiểm kê')}</TableHead>
              <TableHead className="font-bold uppercase text-xs text-slate-600">{t('inventory.col_branch', 'Chi nhánh')}</TableHead>
              <TableHead className="font-bold uppercase text-xs text-slate-600">{t('inventory.col_creator', 'Kiểm kê viên')}</TableHead>
              <TableHead className="font-bold uppercase text-xs text-slate-600">{t('inventory.col_status', 'Trạng thái')}</TableHead>
              <TableHead className="font-bold uppercase text-xs text-slate-600">{t('inventory.col_progress', 'Tiến độ')}</TableHead>
              <TableHead className="font-bold uppercase text-xs text-slate-600">{t('inventory.col_date', 'Ngày tạo')}</TableHead>
              <TableHead className="font-bold uppercase text-xs text-slate-600 text-right">{t('inventory.col_action', 'Chi tiết')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingSessions ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">{t('common.state.loading', 'Đang tải...')}</TableCell></TableRow>
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  <ClipboardList size={32} className="mx-auto mb-3 opacity-20" />
                  {t('inventory.empty', 'Chưa có đợt kiểm kê nào.')}
                </TableCell>
              </TableRow>
            ) : sessions.map(s => (
              <TableRow key={s.id} className="hover:bg-slate-50">
                <TableCell className="font-bold text-slate-800 text-sm">{s.name}</TableCell>
                <TableCell className="text-sm font-medium text-slate-600">{s.branchName}</TableCell>
                <TableCell className="text-sm text-slate-500">{s.createdBy}</TableCell>
                <TableCell>
                   {s.status === 'Open' ? (
                     <Badge className="bg-emerald-100 text-emerald-800"><Play size={10} className="mr-1" /> {t('inventory.status_collecting', 'Đang thu thập')}</Badge>
                   ) : (
                     <Badge variant="secondary"><StopCircle size={10} className="mr-1" /> {t('inventory.status_closed', 'Đã đóng')}</Badge>
                   )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-indigo-600 font-bold">{s.scannedCount}/{s.expectedCount}</span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-500 text-sm">{format(new Date(s.createdAt), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSessionId(s.id)} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                    {t('inventory.btn_open', 'Mở')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

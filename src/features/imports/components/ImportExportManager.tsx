import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { importService } from '../services/importService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadCloud, FileSpreadsheet, Play, CheckCircle2, AlertTriangle, Sparkles, Loader2, ArrowRight, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { ImportJob, ColumnMapping } from '../types';
import { useSignalRListener } from '../../../shared/signalr/useSignalRListener';

const translateEntityType = (type: string) => {
  if (type === 'Members') return 'Độc giả';
  if (type === 'Books') return 'Sách';
  if (type === 'Copies') return 'Bản sao sách';
  return type;
};

const translateStatus = (status: string) => {
  if (status === 'Uploading') return 'Đang tải lên';
  if (status === 'Mapping') return 'Đang ánh xạ';
  if (status === 'Ready') return 'Sẵn sàng';
  if (status === 'Processing') return 'Đang xử lý';
  if (status === 'Completed') return 'Hoàn tất';
  if (status === 'Failed') return 'Thất bại';
  return status;
};

export const ImportExportManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState('Members');
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);

  // Real-time updates
  useSignalRListener('import.progress', (payload: any) => {
    if (currentJob && payload.jobId === currentJob.id) {
       setCurrentJob(prev => prev ? { ...prev, ...payload } : prev);
    }
  });

  useSignalRListener('import.completed', (payload: any) => {
    if (currentJob && payload.jobId === currentJob.id) {
       setCurrentJob(prev => prev ? { ...prev, status: 'Completed', ...payload } : prev);
       toast.success('Quá trình import đã hoàn tất');
    }
  });

  const uploadMutation = useMutation({
    mutationFn: () => importService.uploadFile(selectedFile!, entityType),
    onSuccess: (job) => {
      setCurrentJob(job);
      setSelectedFile(null);
      toast.success('Đã tải lên tệp thành công');
      // Tự động cấu hình mappings ban đầu
      setMappings([
        { sourceColumn: 'Họ và Tên', targetField: 'FullName' },
        { sourceColumn: 'Email', targetField: 'Email' },
        { sourceColumn: 'Số điện thoại', targetField: 'PhoneNumber' }
      ]);
    },
    onError: () => toast.error('Lỗi tải tệp')
  });

  const saveMappingMutation = useMutation({
    mutationFn: () => importService.saveMapping(currentJob!.id, mappings),
    onSuccess: (res) => {
      setCurrentJob(res.job);
      toast.success('Đã lưu cấu hình ánh xạ cột');
    }
  });

  const runImportMutation = useMutation({
    mutationFn: () => importService.runImport(currentJob!.id),
    onSuccess: () => {
      setCurrentJob(prev => prev ? { ...prev, status: 'Processing', processedRows: 0, successRows: 0, errorRows: 0 } : prev);
      toast.info('Đang bắt đầu import dữ liệu...');

      // Mock SignalR events since this is just a preview without a proper backend
      let currentProgress = 0;
      let successCount = 0;
      let errCount = 0;
      const total = currentJob!.totalRows;
      const interval = setInterval(() => {
         currentProgress += 25;
         successCount += 24;
         if (currentProgress === 100) errCount += 1;
         if (currentProgress === 200) errCount += 2;

         if (currentProgress >= total) {
            clearInterval(interval);
            const evt = new CustomEvent('signalr:import.completed', {
               detail: { jobId: currentJob!.id, processedRows: total, successRows: total - 3, errorRows: 3 }
            });
            window.dispatchEvent(evt);
         } else {
            const evt = new CustomEvent('signalr:import.progress', {
               detail: { jobId: currentJob!.id, processedRows: currentProgress, successRows: successCount, errorRows: errCount }
            });
            window.dispatchEvent(evt);
         }
      }, 800);
    }
  });

  const { data: errors = [], isLoading: loadingErrors } = useQuery({
    queryKey: ['importErrors', currentJob?.id],
    queryFn: () => importService.getErrors(currentJob!.id),
    enabled: currentJob?.status === 'Completed' && currentJob?.errorRows > 0
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
               <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Nhập xuất dữ liệu</h2>
              <p className="text-sm text-slate-500">Nhập liệu hàng loạt và trích xuất dữ liệu ra Excel/CSV.</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Job / Upload Box */}
        <div className="lg:col-span-1 space-y-6">
          {!currentJob || currentJob.status === 'Completed' ? (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                 <CardTitle className="text-base flex items-center gap-2"><UploadCloud size={18} className="text-indigo-600"/> Nhập dữ liệu mới</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-600 uppercase">Loại dữ liệu</label>
                   <Select value={entityType} onValueChange={setEntityType}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Members">Độc giả</SelectItem>
                       <SelectItem value="Books">Sách (Danh mục)</SelectItem>
                       <SelectItem value="Copies">Bản sao sách</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-600 uppercase">Chọn tệp (.xlsx, .csv)</label>
                   <Input type="file" accept=".xlsx, .csv" onChange={handleFileChange} />
                 </div>
                 <Button 
                   className="w-full bg-indigo-600 hover:bg-indigo-700" 
                   disabled={!selectedFile || uploadMutation.isPending}
                   onClick={handleUpload}
                 >
                   {uploadMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <UploadCloud size={16} className="mr-2" />}
                   Tải lên
                 </Button>

                 {currentJob?.status === 'Completed' && (
                    <Button variant="outline" className="w-full mt-2" onClick={() => { setCurrentJob(null); setMappings([]); }}>
                      Tạo lần nhập mới
                    </Button>
                 )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-slate-200 bg-indigo-50/50">
              <CardHeader className="pb-3">
                 <CardTitle className="text-base flex items-center gap-2">
                    {currentJob.status === 'Processing' ? <Loader2 size={18} className="text-indigo-600 animate-spin" /> : <Settings size={18} className="text-indigo-600" />}
                    Trạng thái nhập dữ liệu
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="bg-white p-3 rounded-lg border border-indigo-100 space-y-2">
                    <p className="text-sm font-semibold text-slate-800">{currentJob.fileName}</p>
                    <div className="flex justify-between text-xs text-slate-500">
                       <span>Dữ liệu: {translateEntityType(currentJob.entityType)}</span>
                       <span>{currentJob.totalRows} dòng</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-1 mt-2">
                      <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${currentJob.totalRows > 0 ? (currentJob.processedRows / currentJob.totalRows) * 100 : 0}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                       <span className="text-slate-600">Tiến độ: {currentJob.processedRows} / {currentJob.totalRows}</span>
                       <span className="text-indigo-700">{translateStatus(currentJob.status)}</span>
                    </div>
                 </div>

                 {currentJob.status === 'Processing' && (
                   <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                     <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg border border-emerald-100">
                        <span className="block text-xs uppercase opacity-70">Thành công</span>
                        <span className="font-bold text-lg">{currentJob.successRows}</span>
                     </div>
                     <div className="bg-red-50 text-red-700 p-2 rounded-lg border border-red-100">
                        <span className="block text-xs uppercase opacity-70">Lỗi</span>
                        <span className="font-bold text-lg">{currentJob.errorRows}</span>
                     </div>
                   </div>
                 )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-2 space-y-6">
           {currentJob?.status === 'Mapping' && (
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800">Ánh xạ cột dữ liệu</h3>
                </div>

                {mappings.length > 0 ? (
                  <div className="space-y-4">
                     {mappings.map((m, i) => (
                        <div key={i} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                           <div className="flex-1 font-mono text-sm text-slate-600 font-semibold">{m.sourceColumn}</div>
                           <ArrowRight size={16} className="text-slate-400" />
                           <div className="flex-1">
                             <Select 
                               value={m.targetField} 
                               onValueChange={(val) => {
                                 const newM = [...mappings];
                                 newM[i].targetField = val;
                                 setMappings(newM);
                               }}
                             >
                               <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="FullName">Họ và Tên</SelectItem>
                                 <SelectItem value="Email">Email</SelectItem>
                                 <SelectItem value="PhoneNumber">Số điện thoại</SelectItem>
                                 <SelectItem value="IdentifyNumber">CMND/CCCD</SelectItem>
                                 <SelectItem value="Ignore">-- Bỏ qua --</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                        </div>
                     ))}
                     <div className="flex justify-end mt-6">
                       <Button 
                         className="bg-indigo-600 font-bold hover:bg-indigo-700"
                         onClick={() => saveMappingMutation.mutate()}
                         disabled={saveMappingMutation.isPending}
                       >
                         {saveMappingMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                         Xác nhận & kiểm tra dữ liệu
                       </Button>
                     </div>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                    <FileSpreadsheet size={48} className="mb-4 opacity-20" />
                    <p>Vui lòng cấu hình chi tiết ánh xạ các cột dữ liệu.</p>
                  </div>
                )}
             </div>
           )}

           {currentJob?.status === 'Ready' && (
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                <h3 className="font-bold text-xl text-slate-800 mb-2">Dữ liệu đã sẵn sàng!</h3>
                <p className="text-slate-500 mb-6">Tất cả cột đã được ánh xạ thành công. Dữ liệu đã sẵn sàng để nhập vào hệ thống.</p>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8 text-lg py-6"
                  onClick={() => runImportMutation.mutate()}
                  disabled={runImportMutation.isPending}
                >
                  {runImportMutation.isPending ? <Loader2 size={24} className="animate-spin mr-2" /> : <Play size={24} className="mr-2" />}
                  Tiến hành nhập dữ liệu ({currentJob.totalRows} dòng)
                </Button>
             </div>
           )}

           {currentJob?.status === 'Completed' && currentJob?.errorRows > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
                   <h3 className="font-bold text-red-800 flex items-center gap-2">
                     <AlertTriangle size={18} /> Các dòng dữ liệu bị lỗi ({currentJob.errorRows})
                   </h3>
                   <Button variant="outline" size="sm" className="bg-white text-red-700 border-red-200">Xuất báo cáo lỗi</Button>
                </div>
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[80px]">Dòng</TableHead>
                      <TableHead>Nội dung lỗi</TableHead>
                      <TableHead>Dữ liệu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingErrors ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-6">Đang tải chi tiết lỗi...</TableCell></TableRow>
                    ) : errors.map((err, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm">{err.rowNumber}</TableCell>
                        <TableCell className="text-red-600 text-sm font-medium">{err.errorMessage}</TableCell>
                        <TableCell className="text-xs text-slate-500 font-mono tracking-tight">{JSON.stringify(err.data)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
           )}

           {currentJob?.status === 'Processing' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                 <div className="relative w-24 h-24 mx-auto mb-6">
                    <svg className="animate-spin w-full h-full text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-indigo-700">
                      {Math.round((currentJob.processedRows / currentJob.totalRows) * 100)}%
                    </div>
                 </div>
                 <h3 className="font-bold text-xl text-slate-800 mb-2">Đang xử lý dữ liệu...</h3>
                 <p className="text-slate-500">Giữ nguyên tab này, quá trình có thể mất vài phút với file lớn.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

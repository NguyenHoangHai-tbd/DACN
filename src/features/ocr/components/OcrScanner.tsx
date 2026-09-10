import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ocrService } from '../services/ocrService';
import { ExtractedField, OcrResult } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Image as ImageIcon, Scan, CheckCircle2, AlertTriangle, Loader2, Save, X, Sparkles, UploadCloud, FileText, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useSignalRListener } from '../../../shared/signalr/useSignalRListener';

export const OcrScanner: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});

  const uploadMutation = useMutation({
    mutationFn: (file: File) => ocrService.uploadImage(file),
    onSuccess: (data) => {
      setJobId(data.jobId);
      setIsProcessing(true);
      setProgress(10);
      toast.info('Ảnh đã được tải lên, AI đang phân tích...');
      
      // MOCK SIGNALR
      let cur = 10;
      const t = setInterval(() => {
         cur += 25;
         if (cur >= 100) {
            clearInterval(t);
            window.dispatchEvent(new CustomEvent('signalr:ocr.completed', {
               detail: {
                  jobId: data.jobId,
                  result: {
                     id: data.jobId,
                     status: 'Completed',
                     imageUrl: 'mock',
                     overallConfidence: 0.88,
                     extractedFields: [
                       { key: 'isbn', label: 'Mã ISBN', value: '978-604-1-12345-6', confidence: 0.95 },
                       { key: 'title', label: 'Tên Sách', value: 'Tuổi Trẻ Đáng Giá Bao Nhiêu', confidence: 0.92 },
                       { key: 'author', label: 'Tác giả', value: 'Rosie Nguyễn', confidence: 0.90 },
                       { key: 'publisher', label: 'Nhà xuất bản', value: 'NXB Nhã Nam', confidence: 0.75 }
                     ]
                  }
               }
            }));
         } else {
            window.dispatchEvent(new CustomEvent('signalr:ocr.progress', {
               detail: {
                  jobId: data.jobId,
                  progress: cur,
                  message: 'Đang xử lý...'
               }
            }));
         }
      }, 500);
    },
    onError: () => {
      toast.error('Lỗi khi tải ảnh lên.');
      setIsProcessing(false);
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) => ocrService.createBookFromOcr(data),
    onSuccess: () => {
      toast.success('Đã lưu thông tin sách thành công!');
      handleReset();
    },
    onError: () => {
      toast.error('Lỗi khi lưu thông tin sách.');
    }
  });

  useSignalRListener('ocr.progress', (payload: { jobId: string, progress: number, message: string }) => {
    if (payload.jobId === jobId) {
      setProgress(payload.progress);
    }
  });

  useSignalRListener('ocr.completed', (payload: { jobId: string, result: OcrResult }) => {
    if (payload.jobId === jobId) {
      setIsProcessing(false);
      setOcrResult(payload.result);
      
      const initialEdits: Record<string, string> = {};
      payload.result.extractedFields.forEach(f => {
        initialEdits[f.key] = f.value;
      });
      setEditedFields(initialEdits);
      
      if (payload.result.overallConfidence < 0.7) {
        toast.warning('Cảnh báo: Độ tin cậy thấp, vui lòng kiểm tra lại kỹ thông tin.');
      } else {
        toast.success('AI trích xuất thông tin thành công!');
      }
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setOcrResult(null);
      setJobId(null);
      setProgress(0);
    }
  };

  const handleScan = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    setJobId(null);
    setProgress(0);
    setIsProcessing(false);
    setEditedFields({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFieldChange = (key: string, val: string) => {
    setEditedFields(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    saveMutation.mutate(editedFields);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
               <Scan size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">AI Computer Vision (OCR)</h2>
              <p className="text-sm text-slate-500">Trích xuất thông tin từ bìa sách, hóa đơn hoặc mã vạch bị mờ.</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Khu vực Upload ảnh */}
         <Card className="border-indigo-100 shadow-sm h-[500px] flex flex-col">
            <CardHeader className="bg-slate-50 pb-4 border-b border-slate-100 shrink-0">
               <CardTitle className="text-base flex items-center gap-2"><ImageIcon size={18} className="text-indigo-600"/> Tải ảnh đầu vào</CardTitle>
               <CardDescription>Hỗ trợ định dạng JPG, PNG kích thước tối đa 5MB</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col overflow-hidden">
               {!previewUrl ? (
                  <div 
                     className="flex-1 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-indigo-300 transition-colors cursor-pointer"
                     onClick={() => fileInputRef.current?.click()}
                  >
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/jpeg,image/png"
                        onChange={handleFileChange}
                     />
                     <UploadCloud size={48} className="text-indigo-300 mb-4" />
                     <p className="font-semibold text-slate-700">Click hoặc kéo thả ảnh vào đây</p>
                     <p className="text-xs mt-1">Hoặc dùng camera thiết bị</p>
                  </div>
               ) : (
                  <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center group">
                     <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                     {!isProcessing && !ocrResult && (
                       <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} className="h-8">Đổi ảnh</Button>
                          <Button size="icon" variant="destructive" onClick={handleReset} className="h-8 w-8"><X size={16}/></Button>
                       </div>
                     )}

                     {isProcessing && (
                       <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                         <div className="bg-white p-6 rounded-2xl w-full max-w-xs shadow-2xl text-center">
                            <Sparkles className="animate-pulse text-indigo-500 mx-auto mb-4" size={32} />
                            <h3 className="font-bold text-slate-800 mb-2">AI đang phân tích...</h3>
                            <div className="w-full bg-slate-100 h-2 rounded-full mb-2 overflow-hidden">
                               <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-500 font-mono">{progress}% hoàn tất</p>
                         </div>
                       </div>
                     )}
                  </div>
               )}
            </CardContent>
            {!isProcessing && !ocrResult && previewUrl && (
               <div className="p-4 border-t border-slate-100 shrink-0">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-bold shadow-sm" onClick={handleScan}>
                     <Scan className="mr-2" size={20} /> Bắt đầu Quét AI
                  </Button>
               </div>
            )}
         </Card>

         {/* Khu vực Kết quả */}
         <Card className="border-indigo-100 shadow-sm flex flex-col relative overflow-hidden h-[500px]">
            <CardHeader className="bg-slate-50 pb-4 border-b border-slate-100 shrink-0">
               <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-600"/> Kết quả Trích xuất</CardTitle>
               <CardDescription>Kiểm tra và xác nhận thông tin trước khi thêm vào hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
               {!ocrResult ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                     <FileText size={48} className="text-slate-200 mb-4" />
                     <p className="font-semibold text-slate-500">Chưa có kết quả</p>
                     <p className="text-sm mt-1">Tải ảnh bìa sách và chạy OCR để xem thông tin trích xuất.</p>
                  </div>
               ) : (
                  <div className="p-6 space-y-6">
                     <div className={`p-4 rounded-xl border ${ocrResult.overallConfidence >= 0.8 ? 'bg-emerald-50 border-emerald-200' : ocrResult.overallConfidence >= 0.6 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} flex items-center justify-between`}>
                        <div className="flex flex-col">
                           <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Độ tin cậy tổng thể (Confidence)</span>
                           <div className="flex items-center gap-2">
                              <span className={`text-xl font-black ${ocrResult.overallConfidence >= 0.8 ? 'text-emerald-700' : ocrResult.overallConfidence >= 0.6 ? 'text-amber-700' : 'text-red-700'}`}>
                                 {Math.round(ocrResult.overallConfidence * 100)}%
                              </span>
                              {ocrResult.overallConfidence < 0.8 && (
                                <AlertTriangle size={16} className="text-amber-500" />
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        {ocrResult.extractedFields.map(field => (
                           <div key={field.key} className="space-y-1.5">
                              <div className="flex justify-between items-end">
                                 <Label className="text-xs font-bold text-slate-600">{field.label}</Label>
                                 <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${field.confidence >= 0.8 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    Conf: {Math.round(field.confidence * 100)}%
                                 </span>
                              </div>
                              <Input 
                                 value={editedFields[field.key] || ''}
                                 onChange={e => handleFieldChange(field.key, e.target.value)}
                                 className="border-slate-200 focus-visible:ring-indigo-500 font-medium"
                              />
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </CardContent>
            
            {ocrResult && (
               <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0">
                  <Button variant="outline" className="border-slate-200" onClick={handleReset}>
                     <RotateCcw className="mr-2" size={16} /> Quét lại
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saveMutation.isPending}>
                     {saveMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16} />}
                     Lưu vào CSDL
                  </Button>
               </div>
            )}
         </Card>
      </div>
    </div>
  );
};

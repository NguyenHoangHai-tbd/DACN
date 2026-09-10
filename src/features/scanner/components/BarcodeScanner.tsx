import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { scannerService } from '../services/scannerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScanBarcode, ScanLine, ImageUp, UploadCloud, Camera, Focus, Loader2, CheckCircle2, XCircle, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

export const BarcodeScanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'camera' | 'image' | 'manual'>('manual');
  const [manualCode, setManualCode] = useState('');
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolveMutation = useMutation({
    mutationFn: scannerService.resolveScan,
    onSuccess: (data) => {
      handleAddHistory(data);
      if (data.status === 'Success') {
        toast.success(`Nhận diện thành công: ${data.data?.name || data.data?.title || data.code}`);
      } else {
        toast.error('Mã không hợp lệ hoặc không tìm thấy trong hệ thống');
      }
      setManualCode('');
      inputRef.current?.focus();
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Không thể kết nối máy chủ tra cứu mã.'));
    }
  });

  const aiResolveMutation = useMutation({
    mutationFn: scannerService.resolveFromImage,
    onSuccess: (data) => {
      handleAddHistory(data);
      toast.success('AI đã phân tích hình ảnh và bóc tách dữ liệu');
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'AI phân tích hình ảnh thất bại.'));
    }
  });

  const handleAddHistory = (data: any) => {
    setScanHistory(prev => [{ ...data, timestamp: new Date() }, ...prev].slice(0, 10));
  };

  const onManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    resolveMutation.mutate(manualCode.trim());
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      aiResolveMutation.mutate(e.target.files[0]);
    }
  };

  // Keyboard wedge listener (focus manual input on barcode scan)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Basic heuristic: if we get a fast sequence of chars, it might be a scanner
      if (e.key && e.key.length === 1 && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        if (activeTab === 'manual') {
          inputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
          <ScanBarcode className="text-indigo-600" /> Web Scanner & Nhận diện
        </h3>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Scanner Work Area */}
        <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl mb-6">
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'manual' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('manual')}
            >
              <SearchIcon size={16} /> Quét Manual Wedge
            </button>
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'camera' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('camera')}
            >
              <Camera size={16} /> Thiết bị Camera
            </button>
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'image' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('image')}
            >
              <ImageUp size={16} /> Tải ảnh / AI OCR
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
            {activeTab === 'manual' && (
              <div className="w-full max-w-md p-8 text-center">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ScanLine size={32} />
                </div>
                <h4 className="font-bold text-slate-800 text-lg mb-2">Chế độ Nhập quét trực tiếp</h4>
                <p className="text-sm text-slate-500 mb-6 font-medium">Sử dụng máy quét mã vạch (Wedge Scanner) hoặc nhập tay trực tiếp từ bàn phím.</p>
                <form onSubmit={onManualSubmit} className="flex gap-2">
                  <Input 
                    ref={inputRef}
                    placeholder="Quét mã hoặc nhập mã..." 
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    className="flex-1 h-12 text-center text-lg font-mono font-bold tracking-widest bg-white"
                    autoFocus
                  />
                  <Button type="submit" disabled={resolveMutation.isPending || !manualCode} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700">
                    {resolveMutation.isPending ? <Loader2 className="animate-spin" /> : 'Enter'}
                  </Button>
                </form>
              </div>
            )}

            {activeTab === 'camera' && (
               <div className="text-center p-8">
                 <div className="relative w-64 h-64 bg-slate-200 rounded-2xl mx-auto border-4 border-slate-300 overflow-hidden mb-6 flex items-center justify-center">
                   {/* Fake Camera View */}
                   <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px]"></div>
                   <Focus className="w-16 h-16 text-slate-400 opacity-50 z-10 animate-pulse" />
                   <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                 </div>
                 <h4 className="font-bold text-slate-800 mb-1">Môi trường giả lập Camera</h4>
                 <p className="text-sm text-slate-500">Trong phiên bản Preview, quyền truy cập Camera bị hạn chế bởi iFrame. Vui lòng sử dụng <strong>Manual Wedge</strong> hoặc <strong>Tải ảnh</strong> thay thế.</p>
               </div>
            )}

            {activeTab === 'image' && (
              <div className="p-8 text-center w-full max-w-sm">
                <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <UploadCloud size={48} className="text-indigo-400 group-hover:text-indigo-600 mb-4 transition-colors" />
                  <span className="font-bold text-indigo-900 mb-1">Tải ảnh chụp mã hoặc bìa sách</span>
                  <span className="text-sm text-indigo-600/70 font-medium">Hỗ trợ OCR & AI tự động nhận diện</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={aiResolveMutation.isPending} />
                </label>
                {aiResolveMutation.isPending && (
                  <div className="mt-6 flex items-center justify-center text-sm font-bold animate-pulse text-indigo-600">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    AI đang xử lý hình ảnh...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scan Results Sidebar */}
        <div className="w-full lg:w-[350px] bg-slate-50 p-6 flex flex-col overflow-y-auto">
          <h4 className="font-bold text-slate-800 mb-4 uppercase tracking-widest text-xs">Lịch sử Quét gần đây</h4>
          
          <div className="flex-1 space-y-3">
             {scanHistory.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                 <ScanBarcode size={32} className="mb-2" />
                 <span className="text-sm font-medium">Chưa có dữ liệu quét</span>
               </div>
             ) : (
               scanHistory.map((item, i) => (
                 <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                   {item.status === 'Success' ? (
                     <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                   ) : (
                     <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                   )}
                   <div className="min-w-0 flex-1">
                     <p className="font-mono text-sm font-bold text-slate-700 truncate">{item.code || 'Mã không xác định'}</p>
                     
                     {item.status === 'Success' && item.data && (
                        <div className="mt-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.data.title || item.data.fullName || item.data.name}
                          </p>
                          <Badge variant="outline" className="mt-1.5 text-[10px] uppercase font-bold tracking-wider">
                            {item.type}
                          </Badge>
                        </div>
                     )}
                     
                     {item.status !== 'Success' && (
                        <p className="text-xs text-red-600 font-medium mt-1">Không tìm thấy mã hợp lệ.</p>
                     )}
                     
                     <p className="text-[10px] text-slate-400 mt-2">
                       {item.timestamp.toLocaleTimeString('vi-VN')}
                     </p>
                   </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

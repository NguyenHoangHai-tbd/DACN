import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { scannerService } from '../services/scannerService';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, RefreshCw, Loader2, ArrowDownToLine, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const PrintManager: React.FC = () => {
  const [printType, setPrintType] = useState<'Book' | 'Member'>('Book');
  
  const generateMutation = useMutation({
    mutationFn: () => scannerService.generateCodes(['id1', 'id2', 'id3', 'id4', 'id5', 'id6', 'id7', 'id8'], printType),
    onSuccess: () => toast.success('Đã sinh trang in thành công')
  });

  const handlePrint = () => {
    // Simulated print functionality
    window.print();
    toast.success('Bắt đầu in.');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-2">
          <Printer className="text-indigo-600" size={20} />
          <h3 className="font-bold text-slate-800 text-lg">In Mã Vạch / QR Code</h3>
        </div>
        <div className="flex items-center gap-3">
          <Select value={printType} onValueChange={(val: any) => setPrintType(val)}>
            <SelectTrigger className="w-32 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Book">Tài liệu (Nhãn gáy)</SelectItem>
              <SelectItem value="Member">Thẻ độc giả</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} variant="outline" className="font-bold">
            {generateMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sinh ngẫu nhiên
          </Button>
          <Button onClick={handlePrint} disabled={!generateMutation.data} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
            <Printer size={16} className="mr-2" /> In Trang
          </Button>
        </div>
      </div>
      
      <div className="p-8 pb-16 min-h-[500px] flex items-center justify-center bg-slate-100 print:bg-white print:p-0">
        {!generateMutation.data ? (
          <div className="text-center text-slate-400 print:hidden flex flex-col items-center">
            <QrCode size={48} className="mb-4 opacity-50" />
            <p className="font-medium text-lg">Chưa có dữ liệu in</p>
            <p className="text-sm">Bấm "Sinh ngẫu nhiên" để mô phỏng dữ liệu tạo mã</p>
          </div>
        ) : (
          <div className="bg-white p-8 border border-slate-200 shadow-md w-full max-w-4xl grid grid-cols-2 lg:grid-cols-4 gap-6 print:border-none print:shadow-none print:m-0 print:grid-cols-4">
            {generateMutation.data.items.map((item: any, i: number) => (
              <div key={i} className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-lg">
                <QRCodeSVG 
                  value={item.code} 
                  size={100} 
                  level="H" 
                  includeMargin={true}
                />
                <div className="text-center mt-2 space-y-1 w-full">
                  <p className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight">{item.label}</p>
                  <p className="font-mono text-xs text-slate-600">{item.code}</p>
                  <Badge variant="outline" className="text-[8px] uppercase">{item.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style type="text/css">
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:bg-white, .print\\:bg-white * {
              visibility: visible;
            }
            .print\\:bg-white {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};

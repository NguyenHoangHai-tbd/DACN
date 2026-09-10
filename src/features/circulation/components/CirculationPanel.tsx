import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ArrowRightLeft, UserCheck, BookOpen, AlertCircle, Sparkles, Hand, Scan, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { SearchableSelect } from '@/shared/components/SearchableSelect';
import { memberService } from '@/features/members/services/memberService';
import { bookService } from '@/features/books/services/bookService';

import { checkOutSchema, checkInSchema, CheckOutFormData, CheckInFormData } from '../schemas';
import { circulationService } from '../services/circulationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

export const CirculationPanel: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch members and books for options
  const { data: members = [] } = useQuery({
    queryKey: ['membersSelect'],
    queryFn: () => memberService.getMembers(),
  });

  const { data: books = [] } = useQuery({
    queryKey: ['booksSelect'],
    queryFn: () => bookService.getBooks(),
  });

  const memberOptions = members.map(m => ({
    label: m.fullName,
    value: m.memberCode || m.id,
    description: `Mã: ${m.memberCode} | Trạng thái: ${m.status === 'Active' ? 'Hoạt động' : m.status === 'Inactive' ? 'Không hoạt động' : 'Đình chỉ'}`
  }));

  const bookOptions = books.map(b => ({
    label: b.title,
    value: b.id,
    description: `ISBN: ${b.isbn} | Barcode: ${b.barcode || 'N/A'} | Còn: ${b.availableCopies}/${b.totalCopies}`
  }));

  // Fake scanner simulation state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerType, setScannerType] = useState<'member' | 'book'>('member');
  const [scanVal, setScanVal] = useState('');
  const [scanningStatus, setScanningStatus] = useState<'idle' | 'scanning' | 'verifying' | 'success'>('idle');
  const [currentCallback, setCurrentCallback] = useState<((val: string) => void) | null>(null);

  const handleOpenScanner = (type: 'member' | 'book', callback: (val: string) => void) => {
    setScannerType(type);
    setScanVal('');
    setScanningStatus('scanning');
    setCurrentCallback(() => callback);
    setScannerOpen(true);
  };

  const handleExecuteScan = (value: string) => {
    if (!value) {
      toast.error('Vui lòng chọn hoặc nhập mã cần quét');
      return;
    }
    setScanningStatus('verifying');
    setScanVal(value);
    setTimeout(() => {
      setScanningStatus('success');
      setTimeout(() => {
        if (currentCallback) {
          currentCallback(value);
        }
        setScannerOpen(false);
        setScanningStatus('idle');
        toast.success(`Đã quét thành công mã: ${value}`);
      }, 500);
    }, 1200);
  };

  // Check-out logic
  const checkOutForm = useForm<CheckOutFormData>({
    resolver: zodResolver(checkOutSchema),
  });

  const checkOutMutation = useMutation({
    mutationFn: circulationService.checkOut,
    onSuccess: (data) => {
      toast.success(t('circulation.success_checkout', 'Mượn sách thành công'));
      checkOutForm.reset();
      queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['memberHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardInsights'] });
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Mượn sách không thành công. Vui lòng kiểm tra lại thông tin.'));
    }
  });

  const onCheckOutSubmit = (data: CheckOutFormData) => {
    checkOutMutation.mutate(data);
  };

  // Check-in logic
  const checkInForm = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
  });

  const checkInMutation = useMutation({
    mutationFn: circulationService.checkIn,
    onSuccess: (data) => {
      toast.success(t('circulation.success_checkin', 'Trả sách thành công'));
      if (data.fine && data.fine > 0) {
        toast.warning(`${t('circulation.fine_assessed')} ${data.fine} VND`);
      }
      checkInForm.reset();
      queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['memberHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardInsights'] });
      queryClient.invalidateQueries({ queryKey: ['returnedUnpaidFines'] });
      queryClient.invalidateQueries({ queryKey: ['memberLoans'] });
      queryClient.invalidateQueries({ queryKey: ['memberHolds'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reportPreview'] });
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Trả sách không thành công. Vui lòng kiểm tra lại thông tin.'));
    }
  });

  const onCheckInSubmit = (data: CheckInFormData) => {
    checkInMutation.mutate(data);
  };

  // Hold logic
  const holdForm = useForm<CheckOutFormData>({
    resolver: zodResolver(checkOutSchema),
  });

  const holdMutation = useMutation({
    mutationFn: circulationService.createHold,
    onSuccess: () => {
      toast.success('Đặt giữ sách thành công');
      holdForm.reset();
      queryClient.invalidateQueries({ queryKey: ['activeHolds'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
      queryClient.invalidateQueries({ queryKey: ['memberHistory'] });
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Có lỗi xảy ra khi thực hiện đặt giữ sách.'));
    }
  });

  const onHoldSubmit = (data: CheckOutFormData) => {
    holdMutation.mutate({ userId: data.userId, bookId: data.copyId });
  };

  const watchUserId = checkOutForm.watch('userId');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[400px]">
      <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-100">
        <Tabs defaultValue="checkout" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-12 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="checkout" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600">
              {t('circulation.check_out')}
            </TabsTrigger>
            <TabsTrigger value="checkin" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600">
              {t('circulation.check_in')}
            </TabsTrigger>
            <TabsTrigger value="hold" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600">
              {t('circulation.hold', 'Đặt giữ sách')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="checkout">
            <form onSubmit={checkOutForm.handleSubmit(onCheckOutSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                  <UserCheck size={14} /> {t('circulation.user_id')}
                </Label>
                <div className="flex gap-2">
                  <Input 
                    id="userId" 
                    {...checkOutForm.register('userId')} 
                    autoFocus
                    className={`h-12 rounded-xl bg-slate-50 font-mono text-lg flex-1 ${checkOutForm.formState.errors.userId ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                    placeholder={t('circulation.scan_placeholder', 'Quét hoặc nhập tay...')}
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleOpenScanner('member', (val) => checkOutForm.setValue('userId', val))}
                    className="h-12 w-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 shrink-0 p-0 flex items-center justify-center shadow-sm"
                    title="Quét Mã Thẻ Độc Giả"
                  >
                    <QrCode size={20} />
                  </Button>
                </div>
                {checkOutForm.formState.errors.userId && (
                  <p className="text-red-500 text-xs mt-1">{checkOutForm.formState.errors.userId.message}</p>
                )}
                <div className="mt-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">Hoặc chọn nhanh độc giả:</span>
                  <SearchableSelect
                    options={memberOptions}
                    value={checkOutForm.watch('userId') || ''}
                    onChange={(val) => checkOutForm.setValue('userId', val, { shouldValidate: true })}
                    placeholder="Gõ tìm họ tên hoặc mã thẻ..."
                    clearable
                  />
                </div>
                <p className="text-[10px] text-slate-400">Gợi ý mã độc giả: U002, U003</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="copyIdOut" className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                  <BookOpen size={14} /> {t('circulation.book_id')}
                </Label>
                <div className="flex gap-2">
                  <Input 
                    id="copyIdOut" 
                    {...checkOutForm.register('copyId')} 
                    className={`h-12 rounded-xl bg-slate-50 font-mono text-lg flex-1 ${checkOutForm.formState.errors.copyId ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                    placeholder={t('circulation.scan_placeholder', 'Quét hoặc nhập tay...')}
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleOpenScanner('book', (val) => checkOutForm.setValue('copyId', val))}
                    className="h-12 w-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 shrink-0 p-0 flex items-center justify-center shadow-sm"
                    title="Quét Barcode Sách"
                  >
                    <Scan size={20} />
                  </Button>
                </div>
                {checkOutForm.formState.errors.copyId && (
                  <p className="text-red-500 text-xs mt-1">{checkOutForm.formState.errors.copyId.message}</p>
                )}
                <div className="mt-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">Hoặc chọn nhanh tài liệu/sách:</span>
                  <SearchableSelect
                    options={bookOptions}
                    value={checkOutForm.watch('copyId') || ''}
                    onChange={(val) => checkOutForm.setValue('copyId', val, { shouldValidate: true })}
                    placeholder="Gõ tìm tên sách, tác giả, ISBN..."
                    clearable
                  />
                </div>
                <p className="text-[10px] text-slate-400">Gợi ý: Nhập bookId (ví dụ: book-1) hoặc ISBN (ví dụ: 978-0132350884). Nhập book-4 để test hết sách.</p>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={checkOutMutation.isPending} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-md shadow-lg shadow-indigo-100">
                  {checkOutMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <ArrowRightLeft className="mr-2 h-5 w-5" />}
                  {t('circulation.process_checkout')}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="checkin">
             <form onSubmit={checkInForm.handleSubmit(onCheckInSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userIdIn" className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                  <UserCheck size={14} /> {t('circulation.user_id_optional', 'Mã độc giả / Số thẻ (Tùy chọn)')}
                </Label>
                <div className="flex gap-2">
                  <Input 
                    id="userIdIn" 
                    {...checkInForm.register('userId')} 
                    className="h-12 rounded-xl bg-slate-50 font-mono text-lg flex-1" 
                    placeholder={t('circulation.scan_placeholder', 'Quét hoặc nhập tay...')}
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleOpenScanner('member', (val) => checkInForm.setValue('userId', val))}
                    className="h-12 w-12 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 shrink-0 p-0 flex items-center justify-center shadow-sm"
                    title="Quét Mã Thẻ Độc Giả"
                  >
                    <QrCode size={20} />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="copyIdIn" className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                  <BookOpen size={14} /> Mã phiếu mượn hoặc mã sách/ISBN
                </Label>
                <div className="flex gap-2">
                  <Input 
                    id="copyIdIn" 
                    {...checkInForm.register('copyId')} 
                    autoFocus
                    className={`h-12 rounded-xl bg-slate-50 font-mono text-lg flex-1 ${checkInForm.formState.errors.copyId ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                    placeholder="Nhập loanId, bookId hoặc ISBN cần trả"
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleOpenScanner('book', (val) => checkInForm.setValue('copyId', val))}
                    className="h-12 w-12 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 shrink-0 p-0 flex items-center justify-center shadow-sm"
                    title="Quét Barcode Sách"
                  >
                    <Scan size={20} />
                  </Button>
                </div>
                {checkInForm.formState.errors.copyId && (
                  <p className="text-red-500 text-xs mt-1">{checkInForm.formState.errors.copyId.message}</p>
                )}
                <p className="text-[10px] text-slate-400">Nên nhập loanId để tránh trả nhầm. Nếu nhập bookId/ISBN và có nhiều phiếu đang mượn, hệ thống sẽ yêu cầu nhập loanId hoặc mã độc giả.</p>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={checkInMutation.isPending} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-md shadow-lg shadow-emerald-100">
                  {checkInMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <ArrowRightLeft className="mr-2 h-5 w-5" />}
                  {t('circulation.process_checkin')}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="hold">
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed space-y-1">
                <p><strong>Lưu ý về đặt giữ sách:</strong> Tính năng này dùng khi sách đã hết bản khả dụng.</p>
                <p>Khi có người trả sách, hệ thống sẽ ưu tiên cho độc giả đã đặt giữ trước.</p>
              </div>
            </div>
            <form onSubmit={holdForm.handleSubmit(onHoldSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="holdUserId" className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                  <UserCheck size={14} /> {t('circulation.user_id')}
                </Label>
                <div className="flex gap-2">
                  <Input 
                    id="holdUserId" 
                    {...holdForm.register('userId')} 
                    autoFocus
                    className={`h-12 rounded-xl bg-slate-50 font-mono text-lg flex-1 ${holdForm.formState.errors.userId ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                    placeholder={t('circulation.scan_placeholder', 'Quét hoặc nhập tay...')}
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleOpenScanner('member', (val) => holdForm.setValue('userId', val))}
                    className="h-12 w-12 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-100 shrink-0 p-0 flex items-center justify-center shadow-sm"
                    title="Quét Mã Thẻ Độc Giả"
                  >
                    <QrCode size={20} />
                  </Button>
                </div>
                {holdForm.formState.errors.userId && (
                  <p className="text-red-500 text-xs mt-1">{holdForm.formState.errors.userId.message}</p>
                )}
                <div className="mt-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">Hoặc chọn nhanh độc giả:</span>
                  <SearchableSelect
                    options={memberOptions}
                    value={holdForm.watch('userId') || ''}
                    onChange={(val) => holdForm.setValue('userId', val, { shouldValidate: true })}
                    placeholder="Gõ tìm họ tên hoặc mã thẻ..."
                    clearable
                  />
                </div>
                <p className="text-[10px] text-slate-400">Gợi ý mã độc giả: U002, U003</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="holdBookId" className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                  <BookOpen size={14} /> {t('circulation.book_id')}
                </Label>
                <div className="flex gap-2">
                  <Input 
                    id="holdBookId" 
                    {...holdForm.register('copyId')} 
                    className={`h-12 rounded-xl bg-slate-50 font-mono text-lg flex-1 ${holdForm.formState.errors.copyId ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                    placeholder={t('circulation.scan_placeholder', 'Quét hoặc nhập tay...')}
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleOpenScanner('book', (val) => holdForm.setValue('copyId', val))}
                    className="h-12 w-12 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-100 shrink-0 p-0 flex items-center justify-center shadow-sm"
                    title="Quét Barcode Sách"
                  >
                    <Scan size={20} />
                  </Button>
                </div>
                {holdForm.formState.errors.copyId && (
                  <p className="text-red-500 text-xs mt-1">{holdForm.formState.errors.copyId.message}</p>
                )}
                <div className="mt-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">Hoặc chọn nhanh tài liệu/sách:</span>
                  <SearchableSelect
                    options={bookOptions}
                    value={holdForm.watch('copyId') || ''}
                    onChange={(val) => holdForm.setValue('copyId', val, { shouldValidate: true })}
                    placeholder="Gõ tìm tên sách, tác giả, ISBN..."
                    clearable
                  />
                </div>
                <p className="text-[10px] text-slate-400">Gợi ý ID sách: book-1, book-2, book-3, book-4 (khi hết số lượng)</p>
              </div>
              <div className="pt-4">
                <Button type="submit" disabled={holdMutation.isPending} className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-md shadow-lg shadow-amber-100">
                  {holdMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Hand className="mr-2 h-5 w-5" />}
                  {t('circulation.process_hold', 'Xác nhận đặt giữ')}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      <div className="w-full md:w-1/3 bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 text-slate-300">
           <ArrowRightLeft size={32} />
        </div>
        <h4 className="font-bold text-slate-700 mb-2">{t('circulation.fast_circulation', 'Thao tác nhanh')}</h4>
        <p className="text-slate-500 text-sm">{t('circulation.circulation_hint', 'Nhập mã độc giả và mã sách để xử lý mượn, trả hoặc đặt giữ.')}</p>
      </div>

      {/* Simulation Barcode & QR Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={(open) => { if (!open) setScannerOpen(false); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[560px] w-full rounded-2xl p-6 bg-white border border-slate-100 shadow-xl">
          <style>{`
            @keyframes scan-laser {
              0% { top: 0%; opacity: 0.3; }
              50% { top: 100%; opacity: 1; }
              100% { top: 0%; opacity: 0.3; }
            }
            .animate-laser {
              position: absolute;
              left: 0;
              right: 0;
              height: 3px;
              background-color: #ef4444;
              animation: scan-laser 2s infinite linear;
              box-shadow: 0 0 12px 3px rgba(239, 68, 68, 0.8);
            }
          `}</style>
          
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Scan className="text-indigo-600" size={20} />
              {scannerType === 'member' ? 'Quét Thẻ Độc Giả' : 'Quét Mã Sách (Barcode/QR)'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Quét demo bằng mã mẫu. Nếu trình duyệt không hỗ trợ camera, bạn vẫn có thể chọn mã hoặc nhập tay.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Fake Camera Viewport */}
            <div className={`relative h-48 w-full bg-slate-950 rounded-xl overflow-hidden border-2 ${
              scanningStatus === 'success' ? 'border-emerald-500' : 'border-indigo-600'
            } flex flex-col items-center justify-center`}>
              
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-500" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-500" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-500" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-500" />

              {/* Status indicators */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-slate-300 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${scanningStatus === 'verifying' ? 'bg-amber-400 animate-pulse' : scanningStatus === 'success' ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`} />
                {scanningStatus === 'scanning' && 'ĐANG QUÉT...'}
                {scanningStatus === 'verifying' && 'ĐANG GIẢI MÃ...'}
                {scanningStatus === 'success' && 'HOÀN THÀNH!'}
              </div>

              {/* Red laser animation line */}
              {scanningStatus === 'scanning' && (
                <div className="animate-laser" />
              )}

              {/* Mock camera graphics or central scanning zone */}
              <div className="w-36 h-28 border border-white/20 rounded-lg flex flex-col items-center justify-center">
                {scannerType === 'member' ? (
                  <QrCode size={40} className={`text-slate-400 ${scanningStatus === 'scanning' ? 'animate-pulse' : ''}`} />
                ) : (
                  <Scan size={40} className={`text-slate-400 ${scanningStatus === 'scanning' ? 'animate-pulse' : ''}`} />
                )}
              </div>

              {scanningStatus === 'verifying' && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="animate-spin text-indigo-400" size={28} />
                  <span className="text-xs text-indigo-200 font-mono">Giải mã ID {scanVal}...</span>
                </div>
              )}

              {scanningStatus === 'success' && (
                <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center space-y-1">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white font-bold text-lg">✓</div>
                  <span className="text-xs text-emerald-200 font-bold">Quét thành công!</span>
                  <span className="text-[11px] font-mono text-white bg-emerald-800 px-2 py-0.5 rounded-sm mt-1">{scanVal}</span>
                </div>
              )}
            </div>

            {/* Simulated options for quick-demo */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                Bộ mã quét khả dụng thực tế (Demo):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scannerType === 'member' ? (
                  <>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExecuteScan('U002')}
                      className="h-auto py-2.5 px-3 bg-white hover:bg-slate-50 border-slate-200 text-left flex flex-col items-start justify-center w-full"
                    >
                      <span className="text-xs font-mono font-bold text-slate-800">💳 U002</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-full">John Doe (Độc giả)</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExecuteScan('U003')}
                      className="h-auto py-2.5 px-3 bg-white hover:bg-slate-50 border-slate-200 text-left flex flex-col items-start justify-center w-full"
                    >
                      <span className="text-xs font-mono font-bold text-slate-800">💳 U003</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-full">Jane Smith (Độc giả)</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExecuteScan('MEMBER-999')}
                      className="h-auto py-2.5 px-3 bg-white hover:bg-slate-50 border-amber-200 text-left flex flex-col items-start justify-center w-full col-span-1 sm:col-span-2"
                    >
                      <span className="text-xs font-mono font-bold text-amber-700">💳 MEMBER-999</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-full">Lỗi / Thẻ Sai hoặc Chưa Đăng Ký</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExecuteScan('BAR-CLEAN-001')}
                      className="h-auto py-2.5 px-3 bg-white hover:bg-slate-50 border-slate-200 text-left flex flex-col items-start justify-center w-full"
                    >
                      <span className="text-xs font-mono font-bold text-slate-800">📚 BAR-CLEAN-001</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-full">Clean Code</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExecuteScan('BAR-DESIGN-002')}
                      className="h-auto py-2.5 px-3 bg-white hover:bg-slate-50 border-slate-200 text-left flex flex-col items-start justify-center w-full"
                    >
                      <span className="text-xs font-mono font-bold text-slate-800">📚 BAR-DESIGN-002</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-full">Design Patterns</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExecuteScan('BAR-JAVA-003')}
                      className="h-auto py-2.5 px-3 bg-white hover:bg-slate-50 border-slate-200 text-left flex flex-col items-start justify-center w-full"
                    >
                      <span className="text-xs font-mono font-bold text-slate-800">📚 BAR-JAVA-003</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-full">Effective Java</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExecuteScan('BAR-C-004')}
                      className="h-auto py-2.5 px-3 bg-white hover:bg-slate-50 border-rose-200 text-left flex flex-col items-start justify-center w-full"
                      title="Sách Hết Bản Khả Dụng"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-mono font-bold text-rose-700">📚 BAR-C-004</span>
                        <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">Hết sách</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-full">The C Programming Language</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Standard manual form to type directly and simulate scan */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Input 
                placeholder="Nhập mã barcode/QR thủ công..." 
                className="h-10 bg-slate-50 font-mono text-sm flex-1 rounded-xl"
                onChange={(e) => setScanVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleExecuteScan(scanVal);
                  }
                }}
              />
              <Button type="button" onClick={() => handleExecuteScan(scanVal)} className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold w-full sm:w-auto shrink-0 rounded-xl">
                Xác nhận
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

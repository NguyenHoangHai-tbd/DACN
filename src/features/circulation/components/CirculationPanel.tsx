import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  ArrowRightLeft,
  UserCheck,
  BookOpen,
  AlertCircle,
  Hand,
  Scan,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Info,
  CornerDownLeft,
  X,
  CreditCard,
  BookMarked,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'checkout' | 'checkin' | 'hold'>('checkout');

  // Fetch members and books for options
  const { data: members = [] } = useQuery({
    queryKey: ['membersSelect'],
    queryFn: () => memberService.getMembers(),
  });

  const { data: books = [] } = useQuery({
    queryKey: ['booksSelect'],
    queryFn: () => bookService.getBooks(),
  });

  const memberOptions = (members || []).map(m => ({
    label: m?.fullName || m?.memberCode || 'Độc giả',
    value: m?.memberCode || m?.id || '',
    description: `Mã: ${m?.memberCode || 'N/A'} | Trạng thái: ${m?.status === 'Active' ? 'Hoạt động' : m?.status === 'Inactive' ? 'Không hoạt động' : 'Đình chỉ'}`
  }));

  const bookOptions = (books || []).map(b => ({
    label: b?.title || 'Tác phẩm',
    value: b?.id || '',
    description: `ISBN: ${b?.isbn || 'N/A'} | Barcode: ${b?.barcode || 'N/A'} | Còn: ${b?.availableCopies ?? 0}/${b?.totalCopies ?? 0}`
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

  // Active form field watchers to provide instant verification
  const watchCheckoutUserId = checkOutForm.watch('userId');
  const watchCheckoutCopyId = checkOutForm.watch('copyId');

  const watchCheckInUserId = checkInForm.watch('userId');
  const watchCheckInCopyId = checkInForm.watch('copyId');

  const watchHoldUserId = holdForm.watch('userId');
  const watchHoldCopyId = holdForm.watch('copyId');

  // Determine active form values depending on current tab
  const currentUserId =
    activeTab === 'checkout'
      ? watchCheckoutUserId
      : activeTab === 'checkin'
      ? watchCheckInUserId
      : watchHoldUserId;

  const currentCopyId =
    activeTab === 'checkout'
      ? watchCheckoutCopyId
      : activeTab === 'checkin'
      ? watchCheckInCopyId
      : watchHoldCopyId;

  const targetUserCode = typeof currentUserId === 'string' ? currentUserId.trim().toLowerCase() : '';
  const targetCopyCode = typeof currentCopyId === 'string' ? currentCopyId.trim().toLowerCase() : '';

  // Real data lookups for live feedback
  const matchedMember = members.find(
    (m) =>
      Boolean(targetUserCode) &&
      (String(m?.memberCode || '').toLowerCase() === targetUserCode ||
        m?.id === currentUserId?.trim() ||
        String(m?.libraryCardNumber || '').toLowerCase() === targetUserCode)
  );

  const matchedBook = books.find(
    (b) =>
      Boolean(targetCopyCode) &&
      (b?.id === currentCopyId?.trim() ||
        String(b?.isbn || '').toLowerCase() === targetCopyCode ||
        String(b?.barcode || '').toLowerCase() === targetCopyCode)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs flex flex-col lg:flex-row min-h-[460px]">
      {/* Left Column: Form & Tabs */}
      <div className="flex-1 p-5 sm:p-7 border-b lg:border-b-0 lg:border-r border-slate-200/80">
        <Tabs
          defaultValue="checkout"
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'checkout' | 'checkin' | 'hold')}
          className="w-full"
        >
          {/* Header navigation tabs */}
          <TabsList className="grid w-full grid-cols-3 mb-6 h-12 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/70">
            <TabsTrigger
              value="checkout"
              className="rounded-lg font-bold text-xs sm:text-sm text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:shadow-xs data-[state=active]:text-teal-700 data-[state=active]:border data-[state=active]:border-teal-200/70"
            >
              {t('circulation.check_out', 'Mượn sách')}
            </TabsTrigger>
            <TabsTrigger
              value="checkin"
              className="rounded-lg font-bold text-xs sm:text-sm text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:shadow-xs data-[state=active]:text-emerald-700 data-[state=active]:border data-[state=active]:border-emerald-200/70"
            >
              {t('circulation.check_in', 'Trả sách')}
            </TabsTrigger>
            <TabsTrigger
              value="hold"
              className="rounded-lg font-bold text-xs sm:text-sm text-slate-600 transition-all data-[state=active]:bg-white data-[state=active]:shadow-xs data-[state=active]:text-amber-700 data-[state=active]:border data-[state=active]:border-amber-200/70"
            >
              {t('circulation.hold', 'Đặt giữ sách')}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CHECKOUT (MƯỢN SÁCH) */}
          <TabsContent value="checkout" className="focus-visible:outline-hidden space-y-4">
            <form onSubmit={checkOutForm.handleSubmit(onCheckOutSubmit)} className="space-y-4">
              {/* Field 1: User ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="userId"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5"
                  >
                    <UserCheck size={15} className="text-teal-600" />
                    <span>{t('circulation.user_id', 'Mã độc giả / Thẻ thư viện')}</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[11px] text-slate-400">Bước 1</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="userId"
                      {...checkOutForm.register('userId')}
                      autoFocus
                      className={`h-11 sm:h-12 rounded-xl bg-slate-50/60 font-mono text-base sm:text-lg pr-8 text-slate-800 transition-all border-slate-200 focus:bg-white focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-500 ${
                        checkOutForm.formState.errors.userId ? 'border-rose-500 focus-visible:ring-rose-500/20' : ''
                      }`}
                      placeholder={t('circulation.scan_placeholder', 'Quét hoặc nhập mã thẻ...')}
                    />
                    {watchCheckoutUserId && (
                      <button
                        type="button"
                        onClick={() => checkOutForm.setValue('userId', '', { shouldValidate: true })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full"
                        title="Xóa mã"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleOpenScanner('member', (val) => checkOutForm.setValue('userId', val, { shouldValidate: true }))}
                    className="h-11 sm:h-12 w-11 sm:w-12 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 shrink-0 p-0 flex items-center justify-center shadow-2xs transition-colors"
                    title="Quét Mã Thẻ Độc Giả (Camera/Barcode)"
                  >
                    <QrCode size={19} />
                  </Button>
                </div>

                {checkOutForm.formState.errors.userId && (
                  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle size={13} />
                    {checkOutForm.formState.errors.userId.message}
                  </p>
                )}

                <div className="pt-1.5 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                    Hoặc chọn nhanh độc giả từ danh mục:
                  </span>
                  <SearchableSelect
                    options={memberOptions}
                    value={checkOutForm.watch('userId') || ''}
                    onChange={(val) => checkOutForm.setValue('userId', val, { shouldValidate: true })}
                    placeholder="Gõ tìm họ tên hoặc mã thẻ độc giả..."
                    clearable
                  />
                </div>
                <p className="text-[11px] text-slate-400">Gợi ý mã test: U002, U003</p>
              </div>

              {/* Field 2: Book / Copy ID */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="copyIdOut"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5"
                  >
                    <BookOpen size={15} className="text-teal-600" />
                    <span>{t('circulation.book_id', 'Mã sách / Barcode / ISBN')}</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[11px] text-slate-400">Bước 2</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="copyIdOut"
                      {...checkOutForm.register('copyId')}
                      className={`h-11 sm:h-12 rounded-xl bg-slate-50/60 font-mono text-base sm:text-lg pr-8 text-slate-800 transition-all border-slate-200 focus:bg-white focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-500 ${
                        checkOutForm.formState.errors.copyId ? 'border-rose-500 focus-visible:ring-rose-500/20' : ''
                      }`}
                      placeholder={t('circulation.scan_placeholder', 'Quét barcode hoặc nhập ID sách...')}
                    />
                    {watchCheckoutCopyId && (
                      <button
                        type="button"
                        onClick={() => checkOutForm.setValue('copyId', '', { shouldValidate: true })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full"
                        title="Xóa mã"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleOpenScanner('book', (val) => checkOutForm.setValue('copyId', val, { shouldValidate: true }))}
                    className="h-11 sm:h-12 w-11 sm:w-12 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 shrink-0 p-0 flex items-center justify-center shadow-2xs transition-colors"
                    title="Quét Barcode Sách"
                  >
                    <Scan size={19} />
                  </Button>
                </div>

                {checkOutForm.formState.errors.copyId && (
                  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle size={13} />
                    {checkOutForm.formState.errors.copyId.message}
                  </p>
                )}

                <div className="pt-1.5 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                    Hoặc chọn nhanh tài liệu / sách:
                  </span>
                  <SearchableSelect
                    options={bookOptions}
                    value={checkOutForm.watch('copyId') || ''}
                    onChange={(val) => checkOutForm.setValue('copyId', val, { shouldValidate: true })}
                    placeholder="Gõ tìm tên sách, tác giả hoặc ISBN..."
                    clearable
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Gợi ý: Nhập bookId (ví dụ: book-1) hoặc ISBN (978-0132350884). Nhập book-4 để kiểm tra sách hết.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={checkOutMutation.isPending}
                  className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm sm:text-base shadow-sm hover:shadow transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {checkOutMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>Đang xử lý mượn sách...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-5 w-5" />
                      <span>{t('circulation.process_checkout', 'Xác nhận Cho Mượn Sách')}</span>
                      <kbd className="hidden sm:inline-flex ml-2 px-1.5 py-0.5 text-[10px] font-mono font-medium bg-teal-700 text-teal-100 rounded border border-teal-500">
                        Enter ↵
                      </kbd>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: CHECKIN (TRẢ SÁCH) */}
          <TabsContent value="checkin" className="focus-visible:outline-hidden space-y-4">
            <form onSubmit={checkInForm.handleSubmit(onCheckInSubmit)} className="space-y-4">
              {/* Optional User ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="userIdIn"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5"
                  >
                    <UserCheck size={15} className="text-emerald-600" />
                    <span>{t('circulation.user_id_optional', 'Mã độc giả / Số thẻ (Tùy chọn)')}</span>
                  </Label>
                  <span className="text-[11px] text-slate-400">Không bắt buộc</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="userIdIn"
                      {...checkInForm.register('userId')}
                      className="h-11 sm:h-12 rounded-xl bg-slate-50/60 font-mono text-base sm:text-lg pr-8 text-slate-800 transition-all border-slate-200 focus:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                      placeholder={t('circulation.scan_placeholder', 'Quét hoặc nhập mã thẻ nếu có...')}
                    />
                    {watchCheckInUserId && (
                      <button
                        type="button"
                        onClick={() => checkInForm.setValue('userId', '')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full"
                        title="Xóa mã"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleOpenScanner('member', (val) => checkInForm.setValue('userId', val))}
                    className="h-11 sm:h-12 w-11 sm:w-12 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 shrink-0 p-0 flex items-center justify-center shadow-2xs transition-colors"
                    title="Quét Mã Thẻ Độc Giả"
                  >
                    <QrCode size={19} />
                  </Button>
                </div>
              </div>

              {/* Book / Loan ID */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="copyIdIn"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5"
                  >
                    <BookOpen size={15} className="text-emerald-600" />
                    <span>Mã phiếu mượn (Loan ID) hoặc mã sách / ISBN</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[11px] text-slate-400">Bắt buộc</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="copyIdIn"
                      {...checkInForm.register('copyId')}
                      autoFocus
                      className={`h-11 sm:h-12 rounded-xl bg-slate-50/60 font-mono text-base sm:text-lg pr-8 text-slate-800 transition-all border-slate-200 focus:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 ${
                        checkInForm.formState.errors.copyId ? 'border-rose-500 focus-visible:ring-rose-500/20' : ''
                      }`}
                      placeholder="Nhập loanId, bookId hoặc ISBN cần thu hồi"
                    />
                    {watchCheckInCopyId && (
                      <button
                        type="button"
                        onClick={() => checkInForm.setValue('copyId', '', { shouldValidate: true })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full"
                        title="Xóa mã"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleOpenScanner('book', (val) => checkInForm.setValue('copyId', val, { shouldValidate: true }))}
                    className="h-11 sm:h-12 w-11 sm:w-12 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 shrink-0 p-0 flex items-center justify-center shadow-2xs transition-colors"
                    title="Quét Barcode Sách"
                  >
                    <Scan size={19} />
                  </Button>
                </div>

                {checkInForm.formState.errors.copyId && (
                  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle size={13} />
                    {checkInForm.formState.errors.copyId.message}
                  </p>
                )}

                <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <strong className="text-slate-700">Mẹo thu hồi:</strong> Nên nhập mã phiếu mượn (loanId) để tránh trả nhầm. Nếu chỉ nhập mã sách/ISBN và có nhiều bạn đọc đang mượn cùng đầu sách, vui lòng điền thêm mã độc giả phía trên.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={checkInMutation.isPending}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-sm hover:shadow transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {checkInMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>Đang ghi nhận trả sách...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-5 w-5" />
                      <span>{t('circulation.process_checkin', 'Xác nhận Thu Hồi & Trả Sách')}</span>
                      <kbd className="hidden sm:inline-flex ml-2 px-1.5 py-0.5 text-[10px] font-mono font-medium bg-emerald-700 text-emerald-100 rounded border border-emerald-500">
                        Enter ↵
                      </kbd>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 3: HOLD (ĐẶT GIỮ SÁCH) */}
          <TabsContent value="hold" className="focus-visible:outline-hidden space-y-4">
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex gap-3 text-amber-900">
              <AlertCircle size={17} className="shrink-0 mt-0.5 text-amber-600" />
              <div className="text-xs leading-relaxed space-y-0.5">
                <p>
                  <strong>Tính năng Đặt giữ trước (Hold):</strong> Dành cho độc giả có nhu cầu xếp hàng chờ khi đầu sách đã hết sạch bản khả dụng.
                </p>
                <p className="text-amber-800">
                  Khi người khác trả sách vào kho, hệ thống tự động ưu tiên phân phối theo thứ tự đặt trước.
                </p>
              </div>
            </div>

            <form onSubmit={holdForm.handleSubmit(onHoldSubmit)} className="space-y-4">
              {/* Hold User ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="holdUserId"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5"
                  >
                    <UserCheck size={15} className="text-amber-600" />
                    <span>{t('circulation.user_id', 'Mã độc giả đặt giữ')}</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[11px] text-slate-400">Bước 1</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="holdUserId"
                      {...holdForm.register('userId')}
                      autoFocus
                      className={`h-11 sm:h-12 rounded-xl bg-slate-50/60 font-mono text-base sm:text-lg pr-8 text-slate-800 transition-all border-slate-200 focus:bg-white focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 ${
                        holdForm.formState.errors.userId ? 'border-rose-500 focus-visible:ring-rose-500/20' : ''
                      }`}
                      placeholder={t('circulation.scan_placeholder', 'Quét hoặc nhập mã thẻ độc giả...')}
                    />
                    {watchHoldUserId && (
                      <button
                        type="button"
                        onClick={() => holdForm.setValue('userId', '', { shouldValidate: true })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full"
                        title="Xóa mã"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleOpenScanner('member', (val) => holdForm.setValue('userId', val, { shouldValidate: true }))}
                    className="h-11 sm:h-12 w-11 sm:w-12 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 shrink-0 p-0 flex items-center justify-center shadow-2xs transition-colors"
                    title="Quét Mã Thẻ Độc Giả"
                  >
                    <QrCode size={19} />
                  </Button>
                </div>

                {holdForm.formState.errors.userId && (
                  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle size={13} />
                    {holdForm.formState.errors.userId.message}
                  </p>
                )}

                <div className="pt-1.5 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                    Hoặc chọn nhanh độc giả:
                  </span>
                  <SearchableSelect
                    options={memberOptions}
                    value={holdForm.watch('userId') || ''}
                    onChange={(val) => holdForm.setValue('userId', val, { shouldValidate: true })}
                    placeholder="Gõ tìm họ tên hoặc mã thẻ độc giả..."
                    clearable
                  />
                </div>
              </div>

              {/* Hold Book ID */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="holdBookId"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5"
                  >
                    <BookOpen size={15} className="text-amber-600" />
                    <span>{t('circulation.book_id', 'Mã sách / ISBN muốn giữ')}</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[11px] text-slate-400">Bước 2</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="holdBookId"
                      {...holdForm.register('copyId')}
                      className={`h-11 sm:h-12 rounded-xl bg-slate-50/60 font-mono text-base sm:text-lg pr-8 text-slate-800 transition-all border-slate-200 focus:bg-white focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:border-amber-500 ${
                        holdForm.formState.errors.copyId ? 'border-rose-500 focus-visible:ring-rose-500/20' : ''
                      }`}
                      placeholder={t('circulation.scan_placeholder', 'Quét hoặc nhập mã sách...')}
                    />
                    {watchHoldCopyId && (
                      <button
                        type="button"
                        onClick={() => holdForm.setValue('copyId', '', { shouldValidate: true })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full"
                        title="Xóa mã"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleOpenScanner('book', (val) => holdForm.setValue('copyId', val, { shouldValidate: true }))}
                    className="h-11 sm:h-12 w-11 sm:w-12 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 shrink-0 p-0 flex items-center justify-center shadow-2xs transition-colors"
                    title="Quét Barcode Sách"
                  >
                    <Scan size={19} />
                  </Button>
                </div>

                {holdForm.formState.errors.copyId && (
                  <p className="text-rose-600 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle size={13} />
                    {holdForm.formState.errors.copyId.message}
                  </p>
                )}

                <div className="pt-1.5 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                    Hoặc chọn nhanh tài liệu / sách:
                  </span>
                  <SearchableSelect
                    options={bookOptions}
                    value={holdForm.watch('copyId') || ''}
                    onChange={(val) => holdForm.setValue('copyId', val, { shouldValidate: true })}
                    placeholder="Gõ tìm tên sách, tác giả, ISBN..."
                    clearable
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Gợi ý sách thử nghiệm: book-4 (The C Programming Language - hiện hết bản khả dụng).
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={holdMutation.isPending}
                  className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm sm:text-base shadow-sm hover:shadow transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {holdMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>Đang xếp hàng đặt giữ...</span>
                    </>
                  ) : (
                    <>
                      <Hand className="h-5 w-5" />
                      <span>{t('circulation.process_hold', 'Xác Nhận Đặt Giữ Sách')}</span>
                      <kbd className="hidden sm:inline-flex ml-2 px-1.5 py-0.5 text-[10px] font-mono font-medium bg-amber-700 text-amber-100 rounded border border-amber-500">
                        Enter ↵
                      </kbd>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Column: Real-time Confirmation & Verification Panel */}
      <div className="w-full lg:w-[380px] xl:w-[420px] bg-slate-50/70 p-5 sm:p-6 flex flex-col justify-between border-t lg:border-t-0 border-slate-200/80">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
                <ArrowRightLeft size={16} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm sm:text-base">Xác nhận thông tin giao dịch</h4>
            </div>
            <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 text-[11px] font-medium">
              {activeTab === 'checkout' ? 'Mượn sách' : activeTab === 'checkin' ? 'Trả sách' : 'Đặt giữ'}
            </Badge>
          </div>

          {/* Section 1: Member Card Verification */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              1. Thông tin Bạn đọc / Thẻ
            </span>

            {matchedMember ? (
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{matchedMember.fullName}</p>
                    <p className="font-mono text-xs text-teal-700 font-semibold">{matchedMember.memberCode}</p>
                  </div>
                  {matchedMember.status === 'Active' ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold shrink-0">
                      <ShieldCheck size={11} className="mr-1" />
                      Hoạt động
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold shrink-0">
                      <ShieldAlert size={11} className="mr-1" />
                      {matchedMember.status === 'Suspended' ? 'Bị đình chỉ' : 'Không hoạt động'}
                    </Badge>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phân loại:</span>
                    <span className="font-medium text-slate-700">{matchedMember.memberType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Hạn thẻ:</span>
                    <span className="font-medium text-slate-700">
                      {matchedMember.expiryDate ? new Date(matchedMember.expiryDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                    </span>
                  </div>
                </div>

                {matchedMember.status === 'Suspended' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-[11px] text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>Cảnh báo: Thẻ độc giả đang bị đình chỉ lưu thông!</span>
                  </div>
                )}
              </div>
            ) : currentUserId ? (
              <div className="bg-white rounded-xl p-3 border border-dashed border-slate-300 text-xs text-slate-500 flex items-center gap-2">
                <CreditCard size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">
                  Mã độc giả nhập: <strong className="font-mono text-slate-700">{currentUserId}</strong>
                </span>
              </div>
            ) : (
              <div className="bg-slate-100/60 rounded-xl p-3 border border-dashed border-slate-200 text-xs text-slate-400 flex items-center gap-2">
                <CreditCard size={15} className="text-slate-300 shrink-0" />
                <span>Chưa quét hoặc chọn mã độc giả</span>
              </div>
            )}
          </div>

          {/* Section 2: Book Card Verification */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              2. Thông tin Tài liệu / Bản sao
            </span>

            {matchedBook ? (
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm line-clamp-1">{matchedBook.title}</p>
                    <p className="text-xs text-slate-500 truncate">Tác giả: {matchedBook.author}</p>
                  </div>
                  {matchedBook.availableCopies > 0 ? (
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-bold shrink-0">
                      <CheckCircle2 size={11} className="mr-1" />
                      Khả dụng ({matchedBook.availableCopies}/{matchedBook.totalCopies})
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold shrink-0">
                      <AlertCircle size={11} className="mr-1" />
                      Hết sách (0/{matchedBook.totalCopies})
                    </Badge>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-100 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">ISBN:</span>
                    <span className="text-slate-700 truncate block">{matchedBook.isbn}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Barcode / Kệ:</span>
                    <span className="text-slate-700 truncate block">{matchedBook.barcode || matchedBook.shelf || 'N/A'}</span>
                  </div>
                </div>

                {matchedBook.availableCopies <= 0 && activeTab === 'checkout' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0 text-amber-600" />
                    <span>Đầu sách đã hết bản khả dụng. Vui lòng chuyển sang tab &quot;Đặt giữ sách&quot;.</span>
                  </div>
                )}
              </div>
            ) : currentCopyId ? (
              <div className="bg-white rounded-xl p-3 border border-dashed border-slate-300 text-xs text-slate-500 flex items-center gap-2">
                <BookMarked size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">
                  Mã tài liệu nhập: <strong className="font-mono text-slate-700">{currentCopyId}</strong>
                </span>
              </div>
            ) : (
              <div className="bg-slate-100/60 rounded-xl p-3 border border-dashed border-slate-200 text-xs text-slate-400 flex items-center gap-2">
                <BookMarked size={15} className="text-slate-300 shrink-0" />
                <span>Chưa quét hoặc chọn tài liệu</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Helper / Keyboard shortcuts guide */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-500 space-y-2">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Info size={14} className="text-teal-600 shrink-0" />
            <span>Phím tắt thao tác nhanh:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 flex items-center justify-between">
              <span>Chuyển ô nhập:</span>
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-slate-100 border border-slate-200 rounded text-slate-700">Tab</kbd>
            </div>
            <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 flex items-center justify-between">
              <span>Xác nhận gửi:</span>
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-slate-100 border border-slate-200 rounded text-slate-700">Enter ↵</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Barcode & QR Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={(open) => { if (!open) setScannerOpen(false); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[560px] w-full rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 shadow-xl">
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
              background-color: #0d9488;
              animation: scan-laser 2s infinite linear;
              box-shadow: 0 0 12px 3px rgba(13, 148, 136, 0.8);
            }
          `}</style>

          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
                <Scan size={18} />
              </div>
              <span>{scannerType === 'member' ? 'Quét Thẻ Độc Giả (QR / Barcode)' : 'Quét Mã Vạch Sách (Barcode)'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Chế độ mô phỏng đầu đọc mã vạch và máy quét QR phục vụ kiểm thử luồng lưu thông tài liệu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Camera Viewport Simulation */}
            <div className={`relative h-48 w-full bg-slate-950 rounded-xl overflow-hidden border-2 ${
              scanningStatus === 'success' ? 'border-emerald-500' : 'border-teal-500'
            } flex flex-col items-center justify-center`}>
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-teal-400" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-teal-400" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-teal-400" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-teal-400" />

              {/* Status indicators */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-slate-200 flex items-center gap-1.5 border border-white/10">
                <span className={`w-2 h-2 rounded-full ${scanningStatus === 'verifying' ? 'bg-amber-400 animate-pulse' : scanningStatus === 'success' ? 'bg-emerald-400' : 'bg-teal-400 animate-pulse'}`} />
                {scanningStatus === 'scanning' && 'ĐANG QUÉT MÃ...'}
                {scanningStatus === 'verifying' && 'ĐANG GIẢI MÃ DỮ LIỆU...'}
                {scanningStatus === 'success' && 'HOÀN THÀNH!'}
              </div>

              {/* Teal laser animation line */}
              {scanningStatus === 'scanning' && <div className="animate-laser" />}

              {/* Central scanning zone */}
              <div className="w-36 h-28 border border-white/20 rounded-lg flex flex-col items-center justify-center">
                {scannerType === 'member' ? (
                  <QrCode size={40} className={`text-slate-400 ${scanningStatus === 'scanning' ? 'animate-pulse' : ''}`} />
                ) : (
                  <Scan size={40} className={`text-slate-400 ${scanningStatus === 'scanning' ? 'animate-pulse' : ''}`} />
                )}
              </div>

              {scanningStatus === 'verifying' && (
                <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="animate-spin text-teal-400" size={28} />
                  <span className="text-xs text-teal-200 font-mono">Đang giải mã ID {scanVal}...</span>
                </div>
              )}

              {scanningStatus === 'success' && (
                <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center space-y-1">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-lg">
                    ✓
                  </div>
                  <span className="text-xs text-emerald-200 font-bold">Quét thành công!</span>
                  <span className="text-[11px] font-mono text-white bg-emerald-800 px-2.5 py-0.5 rounded mt-1">
                    {scanVal}
                  </span>
                </div>
              )}
            </div>

            {/* Quick sample click options */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                Mã mẫu khả dụng trong hệ thống:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {scannerType === 'member' ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecuteScan('U002')}
                      className="h-auto py-2 px-3 bg-white hover:bg-teal-50 hover:border-teal-200 border-slate-200 text-left flex flex-col items-start justify-center w-full transition-colors"
                    >
                      <span className="text-xs font-mono font-bold text-slate-800">💳 U002</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-full">John Doe (Độc giả - Hoạt động)</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecuteScan('U003')}
                      className="h-auto py-2 px-3 bg-white hover:bg-teal-50 hover:border-teal-200 border-slate-200 text-left flex flex-col items-start justify-center w-full transition-colors"
                    >
                      <span className="text-xs font-mono font-bold text-slate-800">💳 U003</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-full">Jane Smith (Độc giả - Hoạt động)</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecuteScan('MEMBER-999')}
                      className="h-auto py-2 px-3 bg-white hover:bg-rose-50 hover:border-rose-200 border-slate-200 text-left flex flex-col items-start justify-center w-full col-span-1 sm:col-span-2 transition-colors"
                    >
                      <span className="text-xs font-mono font-bold text-rose-700">💳 MEMBER-999</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-full">Thẻ không tồn tại / Kiểm thử lỗi validation</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecuteScan('BAR-CLEAN-001')}
                      className="h-auto py-2 px-3 bg-white hover:bg-teal-50 hover:border-teal-200 border-slate-200 text-left flex flex-col items-start justify-center w-full transition-colors"
                    >
                      <span className="text-xs font-mono font-bold text-slate-800">📚 BAR-CLEAN-001</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-full">Clean Code</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecuteScan('BAR-DESIGN-002')}
                      className="h-auto py-2 px-3 bg-white hover:bg-teal-50 hover:border-teal-200 border-slate-200 text-left flex flex-col items-start justify-center w-full transition-colors"
                    >
                      <span className="text-xs font-mono font-bold text-slate-800">📚 BAR-DESIGN-002</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-full">Design Patterns</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecuteScan('BAR-JAVA-003')}
                      className="h-auto py-2 px-3 bg-white hover:bg-teal-50 hover:border-teal-200 border-slate-200 text-left flex flex-col items-start justify-center w-full transition-colors"
                    >
                      <span className="text-xs font-mono font-bold text-slate-800">📚 BAR-JAVA-003</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-full">Effective Java</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecuteScan('BAR-C-004')}
                      className="h-auto py-2 px-3 bg-white hover:bg-amber-50 hover:border-amber-200 border-slate-200 text-left flex flex-col items-start justify-center w-full transition-colors"
                      title="Sách Hết Bản Khả Dụng"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-mono font-bold text-amber-700">📚 BAR-C-004</span>
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider shrink-0">
                          Hết sách
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 truncate max-w-full">The C Programming Language</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Manual code input for physical USB scanner or custom typing */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Input
                placeholder="Nhập mã barcode/QR thủ công..."
                className="h-10 bg-slate-50 font-mono text-sm flex-1 rounded-xl border-slate-200 focus:bg-white focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                value={scanVal}
                onChange={(e) => setScanVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleExecuteScan(scanVal);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => handleExecuteScan(scanVal)}
                className="h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold w-full sm:w-auto shrink-0 rounded-xl"
              >
                Xác nhận mã
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  User, 
  ShieldCheck, 
  Mail, 
  Phone, 
  IdCard, 
  CheckSquare, 
  CreditCard, 
  Wallet, 
  Landmark, 
  DollarSign,
  Library,
  Bookmark,
  XCircle,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { axiosInstance } from '../../../shared/api/axiosInstance';
import { parseFriendlyError } from '../../../shared/utils/errorParser';
import { BookCoverImage } from '../../books/components/BookCoverImage';
import { QRCodeSVG } from 'qrcode.react';

// ============================================================================
// 1. MEMBER LOANS COMPONENT (Sách đang mượn & Lịch sử lưu hành)
// ============================================================================
export const MemberLoansView: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  // Fine payment state variables
  const [payFineOpen, setPayFineOpen] = useState(false);
  const [selectedLoanForFine, setSelectedLoanForFine] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'momo' | 'demo'>('demo');
  const [payingFine, setPayingFine] = useState(false);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/member/loans');
      if (res.data && res.data.success) {
        setLoans(res.data.data || []);
      } else {
        setError(res.data?.message || 'Không thể tải danh sách mượn sách');
      }
    } catch (err: any) {
      console.error('Error fetching member loans:', err);
      setError(parseFriendlyError(err, 'Lỗi kết nối khi tải danh sách mượn trả'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleRenew = async (loanId: string) => {
    try {
      setRenewingId(loanId);
      const res = await axiosInstance.post(`/loans/${loanId}/renew`);
      if (res.data && res.data.success) {
        toast.success(t('circulation.renew_success', 'Gia hạn thành công theo chính sách mượn hiện tại'));
        fetchLoans();
        queryClient.invalidateQueries({ queryKey: ['memberLoans'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
        queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
      } else {
        toast.error(res.data?.message ? t(res.data.message, 'Gia hạn không thành công') : 'Yêu cầu gia hạn không được chấp nhận.');
      }
    } catch (err) {
      toast.error(parseFriendlyError(err, 'Không thể kết nối đến máy chủ gia hạn.'));
    } finally {
      setRenewingId(null);
    }
  };

  const handlePayFine = async () => {
    if (!selectedLoanForFine) return;
    try {
      setPayingFine(true);
      const res = await axiosInstance.post(`/member/fines/${selectedLoanForFine.id}/pay`, {
        paymentMethod
      });
      if (res.data && res.data.success) {
        toast.success('Thanh toán phạt thành công!');
        setPayFineOpen(false);
        setSelectedLoanForFine(null);
        fetchLoans();
        queryClient.invalidateQueries({ queryKey: ['memberLoans'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
        queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
      } else {
        toast.error(res.data?.message || 'Thanh toán phạt không thành công');
      }
    } catch (err: any) {
      toast.error(parseFriendlyError(err, 'Không thể thực hiện thanh toán phạt lúc này.'));
    } finally {
      setPayingFine(false);
    }
  };

  const activeLoans = loans.filter((l: any) => l.status === 'Active' || l.status === 'Overdue');
  const historyLoans = loans.filter((l: any) => l.status === 'Returned');
  const unpaidFineLoans = loans.filter((l: any) => l.fineAmount > 0 && !l.finePaid);
  const totalUnpaidFine = unpaidFineLoans.reduce((acc, current) => acc + (current.fineAmount || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. VIEW HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-600 shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Sách đang mượn &amp; Lịch sử lưu hành
              </h2>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                Độc giả
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Theo dõi hạn trả, gia hạn thời gian mượn trực tuyến và thanh toán phí phạt quá hạn.
            </p>
          </div>
        </div>

        <Button
          onClick={fetchLoans}
          disabled={loading}
          variant="outline"
          size="sm"
          className="self-start sm:self-auto border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs h-9 px-3 shrink-0 gap-1.5 cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-teal-600' : 'text-slate-500'} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* 2. OVERDUE FINE NOTIFICATION BANNER */}
      {unpaidFineLoans.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
              <AlertCircle size={20} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-rose-900">
                Bạn có khoản phạt quá hạn chưa thanh toán!
              </h4>
              <p className="text-xs text-rose-700 leading-relaxed">
                Tổng tiền phạt: <span className="font-extrabold text-rose-900">{totalUnpaidFine.toLocaleString('vi-VN')}đ</span> cho <span className="font-bold text-rose-900">{unpaidFineLoans.length}</span> cuốn sách quá hạn. Vui lòng thanh toán để tiếp tục mượn sách.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              setSelectedLoanForFine(unpaidFineLoans[0]);
              setPaymentMethod('demo');
              setPayFineOpen(true);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0 gap-1.5 rounded-xl text-xs h-9 px-4 shadow-sm shadow-rose-600/20 cursor-pointer self-start md:self-auto"
          >
            <DollarSign size={14} />
            <span>Thanh toán ngay</span>
          </Button>
        </div>
      )}

      {/* 3. LOADING STATE */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 border border-teal-100">
            <RefreshCw className="animate-spin text-teal-600" size={20} />
          </div>
          <p className="text-sm font-bold text-slate-800">Đang tải danh sách sách mượn...</p>
          <p className="text-xs text-slate-500 mt-1">Hệ thống đang truy xuất thông tin phiếu mượn của bạn.</p>
        </div>
      )}

      {/* 4. ERROR STATE */}
      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center shadow-xs flex flex-col items-center justify-center">
          <XCircle className="text-rose-500 mb-2" size={28} />
          <h3 className="text-sm font-bold text-rose-900">Không thể tải dữ liệu mượn sách</h3>
          <p className="text-xs text-rose-700 mt-1 max-w-md">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLoans}
            className="mt-3 border-rose-300 text-rose-700 hover:bg-rose-100 font-semibold rounded-xl text-xs h-8 px-3"
          >
            <RefreshCw size={12} className="mr-1.5" /> Thử lại
          </Button>
        </div>
      )}

      {/* 5. ACTIVE LOANS SECTION */}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h3 className="text-base font-bold text-slate-900">
                Sách đang mượn ({activeLoans.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Giới hạn gia hạn 1 lần / sách
            </span>
          </div>

          {activeLoans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 border-dashed p-8 sm:p-12 text-center text-slate-500 space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <BookOpen size={24} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-sm">Hiện tại bạn chưa mượn sách nào</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hãy tra cứu đầu sách bạn yêu thích trong mục Tra cứu học liệu và đến quầy thư viện để hoàn tất thủ tục mượn.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {activeLoans.map((loan) => {
                const isOverdue = loan.status === 'Overdue';
                const hasUnpaidFine = loan.fineAmount > 0 && !loan.finePaid;

                return (
                  <div
                    key={loan.id}
                    className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 ${
                      isOverdue ? 'border-rose-200/90' : 'border-slate-200/80 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex gap-3.5">
                      <BookCoverImage 
                        src={loan.coverUrl} 
                        title={loan.bookTitle} 
                        className="w-16 h-22 sm:w-20 sm:h-28 rounded-xl shadow-xs border border-slate-100 shrink-0" 
                      />
                      <div className="space-y-1.5 min-w-0 flex-1">
                        {/* Status Pills */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isOverdue 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            {isOverdue ? 'Quá hạn trả' : 'Đang mượn'}
                          </span>

                          {loan.fineAmount > 0 && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              loan.finePaid 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                            }`}>
                              {loan.finePaid ? 'Đã trả phạt' : 'Chưa đóng phạt'}
                            </span>
                          )}
                        </div>

                        {/* Title & Author */}
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate" title={loan.bookTitle}>
                          {loan.bookTitle}
                        </h4>
                        <p className="text-xs font-medium text-slate-500 truncate">
                          Tác giả: {loan.author || 'Đang cập nhật'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          ISBN: {loan.isbn || 'N/A'}
                        </p>
                        
                        {/* Dates grid */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Calendar size={12} /> Ngày mượn:
                          </div>
                          <div className="text-slate-800 font-medium">
                            {new Date(loan.checkoutDate).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock size={12} /> Hạn trả:
                          </div>
                          <div className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-teal-700'}`}>
                            {new Date(loan.dueDate).toLocaleDateString('vi-VN')}
                          </div>

                          {loan.fineAmount > 0 && (
                            <>
                              {loan.overdueDays > 0 && (
                                <>
                                  <div className="flex items-center gap-1 text-rose-500 col-span-1 pt-1">
                                    <AlertCircle size={12} /> Trễ hạn:
                                  </div>
                                  <div className="text-rose-600 font-bold pt-1">{loan.overdueDays} ngày</div>
                                </>
                              )}
                              <div className="flex items-center gap-1 text-rose-500 col-span-1">
                                <DollarSign size={12} /> Tiền phạt:
                              </div>
                              <div className="text-rose-600 font-extrabold">
                                {(loan.fineAmount || 0).toLocaleString('vi-VN')}đ
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                      {hasUnpaidFine && (
                        <Button
                          onClick={() => {
                            setSelectedLoanForFine(loan);
                            setPaymentMethod('demo');
                            setPayFineOpen(true);
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-1.5 text-xs h-8 px-3 font-bold cursor-pointer"
                        >
                          <DollarSign size={13} />
                          <span>Thanh toán phạt</span>
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => handleRenew(loan.id)}
                        disabled={renewingId === loan.id || isOverdue}
                        variant="outline"
                        className={`border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 text-xs h-8 px-3 font-semibold cursor-pointer ${
                          isOverdue ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                        title={isOverdue ? 'Sách đã quá hạn, vui lòng đến quầy trả sách' : 'Gia hạn thêm hạn mượn trực tuyến'}
                      >
                        <RefreshCw size={13} className={renewingId === loan.id ? 'animate-spin text-teal-600' : 'text-slate-500'} />
                        <span>{renewingId === loan.id ? 'Đang xử lý...' : 'Gia hạn trực tiếp'}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. HISTORY LOANS SECTION */}
      {!loading && !error && (
        <div className="space-y-4 pt-4 border-t border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <h3 className="text-base font-bold text-slate-900">
              Lịch sử mượn &amp; trả ({historyLoans.length})
            </h3>
          </div>

          {historyLoans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 border-dashed p-8 text-center text-slate-400 space-y-2 shadow-xs">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto text-slate-400">
                <CheckSquare size={18} />
              </div>
              <p className="font-semibold text-slate-600 text-xs">Chưa có lịch sử mượn trả</p>
              <p className="text-[11px] text-slate-400">Các cuốn sách bạn đã hoàn tất trả thư viện sẽ được lưu vết tại đây.</p>
            </div>
          ) : (
            <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {historyLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex gap-3">
                    <BookCoverImage 
                      src={loan.coverUrl} 
                      title={loan.bookTitle} 
                      className="w-14 h-20 rounded-lg shadow-xs border border-slate-100 shrink-0" 
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={10} /> Đã trả sách
                      </span>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug truncate" title={loan.bookTitle}>
                        {loan.bookTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">Tác giả: {loan.author || 'N/A'}</p>
                      
                      <div className="pt-2 mt-1 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Mượn:</span>
                          <span className="font-medium text-slate-700">{new Date(loan.checkoutDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Đã trả:</span>
                          <span className="font-bold text-emerald-700">
                            {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString('vi-VN') : 'Đã ghi nhận'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. FINE PAYMENT MODAL (Slate/Teal styling) */}
      {payFineOpen && selectedLoanForFine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <DollarSign size={18} className="text-teal-400" />
                  Xác nhận thanh toán phí phạt
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">Hoàn tất biểu phí để khôi phục quyền mượn sách.</p>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Summary box */}
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2 text-xs text-slate-600">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 shrink-0">Tên sách:</span>
                  <span className="font-bold text-slate-800 text-right truncate">{selectedLoanForFine.bookTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hạn trả gốc:</span>
                  <span className="font-semibold text-slate-700">{new Date(selectedLoanForFine.dueDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số ngày quá hạn:</span>
                  <span className="font-bold text-rose-600">{selectedLoanForFine.overdueDays || 1} ngày</span>
                </div>
                <div className="border-t border-slate-200/80 pt-2 flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-800">Số tiền phải nộp:</span>
                  <span className="text-rose-600 font-extrabold text-base">
                    {(selectedLoanForFine.fineAmount || 0).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              {/* Payment methods */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('demo')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'demo'
                        ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Sparkles size={16} className={`${paymentMethod === 'demo' ? 'text-teal-600' : 'text-slate-400'} mb-1`} />
                    <span className="text-xs font-bold">Demo (Tức thì)</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Wallet size={16} className={`${paymentMethod === 'cash' ? 'text-teal-600' : 'text-slate-400'} mb-1`} />
                    <span className="text-xs font-bold">Tiền mặt tại quầy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Landmark size={16} className={`${paymentMethod === 'bank_transfer' ? 'text-teal-600' : 'text-slate-400'} mb-1`} />
                    <span className="text-xs font-bold">Chuyển khoản QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('momo')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      paymentMethod === 'momo'
                        ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CreditCard size={16} className={`${paymentMethod === 'momo' ? 'text-teal-600' : 'text-slate-400'} mb-1`} />
                    <span className="text-xs font-bold">Ví điện tử MoMo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="bg-slate-50 p-4 flex gap-2 justify-end border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setPayFineOpen(false);
                  setSelectedLoanForFine(null);
                }}
                className="rounded-xl h-9 text-xs font-semibold cursor-pointer border-slate-200 hover:bg-white"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handlePayFine}
                disabled={payingFine}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-9 text-xs font-bold px-4 shadow-sm shadow-teal-600/20 cursor-pointer"
              >
                {payingFine ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw size={13} className="animate-spin" /> Đang thanh toán...
                  </span>
                ) : (
                  'Xác nhận thanh toán'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ============================================================================
// 2. MEMBER HOLDS SUMMARY (Đặt giữ của tôi & Danh sách chờ)
// ============================================================================
export const MemberHoldsView: React.FC = () => {
  const [holds, setHolds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHolds = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/member/holds');
      if (res.data && res.data.success) {
        setHolds(res.data.data || []);
      } else {
        setError(res.data?.message || 'Không thể tải danh sách đặt giữ');
      }
    } catch (err: any) {
      console.error('Error fetching member holds:', err);
      setError(parseFriendlyError(err, 'Lỗi kết nối khi tải danh sách đặt giữ'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolds();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. VIEW HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-600 shrink-0">
            <Bookmark size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Đặt giữ của tôi &amp; Danh sách chờ
              </h2>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                Hold Queue
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Theo dõi vị trí thứ tự ưu tiên nhận sách khi tài liệu mượn trước đó được hoàn trả về thư viện.
            </p>
          </div>
        </div>

        <Button
          onClick={fetchHolds}
          disabled={loading}
          variant="outline"
          size="sm"
          className="self-start sm:self-auto border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs h-9 px-3 shrink-0 gap-1.5 cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-teal-600' : 'text-slate-500'} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* 2. LOADING STATE */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 border border-teal-100">
            <RefreshCw className="animate-spin text-teal-600" size={20} />
          </div>
          <p className="text-sm font-bold text-slate-800">Đang tải danh sách đặt giữ...</p>
          <p className="text-xs text-slate-500 mt-1">Hệ thống đang kiểm tra trạng thái hàng chờ của bạn.</p>
        </div>
      )}

      {/* 3. ERROR STATE */}
      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center shadow-xs flex flex-col items-center justify-center">
          <XCircle className="text-rose-500 mb-2" size={28} />
          <h3 className="text-sm font-bold text-rose-900">Không thể tải dữ liệu đặt giữ</h3>
          <p className="text-xs text-rose-700 mt-1 max-w-md">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHolds}
            className="mt-3 border-rose-300 text-rose-700 hover:bg-rose-100 font-semibold rounded-xl text-xs h-8 px-3"
          >
            <RefreshCw size={12} className="mr-1.5" /> Thử lại
          </Button>
        </div>
      )}

      {/* 4. CONTENT LIST */}
      {!loading && !error && (
        <>
          {holds.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 border-dashed p-10 sm:p-14 text-center text-slate-500 space-y-3 shadow-xs">
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto border border-teal-100">
                <Clock size={28} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-base">Bạn chưa đặt giữ cuốn sách nào</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Khi tài liệu yêu thích đang hết bản sao sẵn có, hãy nhấn nút "Đặt giữ" tại trang Tra cứu để xếp hàng nhận sách ngay khi có bạn đọc trả lại.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1">
              {holds.map((hold) => {
                const getStatusConfig = () => {
                  const status = hold.status;
                  const isReady = hold.isReadyForPickup || status === 'Ready' || status === 'Waiting';
                  
                  if (isReady) {
                    return {
                      text: 'Sẵn sàng nhận',
                      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      badgeDot: 'bg-emerald-500',
                      description: 'Sách đã có sẵn tại quầy. Vui lòng mang thẻ thư viện đến nhận trước ngày hết hạn.'
                    };
                  }
                  if (status === 'Pending') {
                    return {
                      text: 'Đang chờ sách',
                      classes: 'bg-amber-50 text-amber-700 border-amber-200',
                      badgeDot: 'bg-amber-500',
                      description: 'Bạn đang trong hàng đợi. Ngay khi có sách hoàn trả, hệ thống sẽ tự động gửi thông báo.'
                    };
                  }
                  if (status === 'Fulfilled') {
                    return {
                      text: 'Đã hoàn tất nhận',
                      classes: 'bg-teal-50 text-teal-700 border-teal-200',
                      badgeDot: 'bg-teal-500',
                      description: 'Yêu cầu đặt giữ đã được chuyển đổi thành phiếu mượn thành công.'
                    };
                  }
                  if (status === 'Cancelled' || status === 'Expired') {
                    return {
                      text: 'Đã hủy / Hết hạn',
                      classes: 'bg-slate-100 text-slate-600 border-slate-200',
                      badgeDot: 'bg-slate-400',
                      description: 'Yêu cầu đặt giữ đã quá thời gian chờ nhận hoặc đã được hủy.'
                    };
                  }
                  return {
                    text: status || 'Chờ xử lý',
                    classes: 'bg-slate-100 text-slate-600 border-slate-200',
                    badgeDot: 'bg-slate-400',
                    description: 'Trạng thái yêu cầu đặt giữ.'
                  };
                };

                const statusConfig = getStatusConfig();

                return (
                  <div 
                    key={hold.id} 
                    className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl hover:border-teal-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex gap-3.5 sm:gap-4 items-start">
                      <BookCoverImage 
                        src={hold.coverUrl} 
                        title={hold.bookTitle} 
                        className="w-16 h-22 sm:w-18 sm:h-26 rounded-xl shadow-xs border border-slate-100 shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2" title={hold.bookTitle}>
                          {hold.bookTitle}
                        </h4>
                        <p className="text-xs font-medium text-slate-500 truncate">
                          Tác giả: {hold.author || 'Đang cập nhật'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          ISBN: {hold.isbn || 'N/A'}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-600 font-medium pt-1">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar size={12} className="text-slate-400" /> Ngày đặt: <strong className="text-slate-800">{new Date(hold.holdDate).toLocaleDateString('vi-VN')}</strong>
                          </span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock size={12} className="text-slate-400" /> Hạn giữ chỗ: <strong className="text-slate-800">{new Date(hold.expiryDate).toLocaleDateString('vi-VN')}</strong>
                          </span>
                        </div>

                        {statusConfig.description && (
                          <p className="text-xs text-slate-600 font-medium mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 leading-relaxed">
                            {statusConfig.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right side: queue position & status */}
                    <div className="flex items-center md:flex-col md:items-end justify-between border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 gap-2 shrink-0">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Vị trí hàng chờ</p>
                        <p className="text-base sm:text-lg font-extrabold text-teal-700 font-mono">
                          STT #{hold.queuePosition || 1}
                        </p>
                      </div>

                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.classes}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.badgeDot}`} />
                        {statusConfig.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};


// ============================================================================
// 3. MEMBER PROFILE & VIRTUAL ID CARD COMPONENT (Hồ sơ / Thẻ thư viện)
// ============================================================================
export const MemberProfileView: React.FC = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/member/profile');
      if (res.data && res.data.success) {
        setProfile(res.data.data);
      } else {
        setError(res.data?.message || 'Không thể tải hồ sơ độc giả');
      }
    } catch (err: any) {
      console.error('Error fetching member profile:', err);
      setError(parseFriendlyError(err, 'Lỗi kết nối khi tải hồ sơ độc giả'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 border border-teal-100">
          <RefreshCw className="animate-spin text-teal-600" size={20} />
        </div>
        <p className="text-sm font-bold text-slate-800">Đang tải hồ sơ độc giả...</p>
        <p className="text-xs text-slate-500 mt-1">Đang kết xuất thông tin thẻ và định danh thư viện số.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center shadow-xs flex flex-col items-center justify-center">
        <XCircle className="text-rose-500 mb-2" size={28} />
        <h3 className="text-sm font-bold text-rose-900">Không thể tải thông tin hồ sơ</h3>
        <p className="text-xs text-rose-700 mt-1 max-w-md">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProfile}
          className="mt-3 border-rose-300 text-rose-700 hover:bg-rose-100 font-semibold rounded-xl text-xs h-8 px-3"
        >
          <RefreshCw size={12} className="mr-1.5" /> Thử lại
        </Button>
      </div>
    );
  }

  const fullName = profile?.fullName || 'Độc giả Thư viện';
  const memberCode = profile?.memberCode || 'U002';
  const email = profile?.email || 'member@example.com';
  const phone = profile?.phone || '0987654321';
  const memberType = profile?.memberType || 'Student';
  const status = profile?.status || 'Active';
  const joinDate = profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString('vi-VN') : '15/02/2025';
  const expiryDate = profile?.expiryDate ? new Date(profile.expiryDate).toLocaleDateString('vi-VN') : '15/02/2026';
  const cardNumberValue = profile?.cardNumber || profile?.libraryCardNumber || memberCode;

  return (
    <div className="space-y-6 pb-16">
      {/* 1. VIEW HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-600 shrink-0">
            <IdCard size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Hồ sơ cá nhân &amp; Thẻ thư viện điện tử
              </h2>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                Digital ID
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Quản lý định danh thành viên, mã vạch mượn trả và thời hạn hiệu lực của thẻ độc giả.
            </p>
          </div>
        </div>

        <Button
          onClick={fetchProfile}
          variant="outline"
          size="sm"
          className="self-start sm:self-auto border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs h-9 px-3 shrink-0 gap-1.5 cursor-pointer"
        >
          <RefreshCw size={13} className="text-slate-500" />
          <span>Cập nhật</span>
        </Button>
      </div>

      {/* 2. TWO-COLUMN LAYOUT: SPECS & CARD */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side (2 cols): Personal specs & usage details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Chi tiết thông tin độc giả</h3>
              <span className="text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-teal-600" /> Đã xác thực
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Họ và Tên</span>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User size={15} className="text-teal-600 shrink-0" /> {fullName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mã độc giả (ID)</span>
                <p className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                  <IdCard size={15} className="text-teal-600 shrink-0" /> {memberCode}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hộp thư điện tử (Email)</span>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 truncate">
                  <Mail size={15} className="text-teal-600 shrink-0" /> {email}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Số điện thoại liên lạc</span>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Phone size={15} className="text-teal-600 shrink-0" /> {phone}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Phân hạng độc giả</span>
                <div className="pt-0.5">
                  <span className="text-xs font-bold text-teal-800 border border-teal-200 bg-teal-50 px-2.5 py-1 rounded-lg inline-block">
                    {memberType === 'Student' ? 'Sinh viên (Student)' : memberType}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Thời hạn thẻ thư viện</span>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 pt-1 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{joinDate}</span>
                  <ArrowRight size={12} className="text-slate-400" />
                  <span className="font-bold text-teal-700">{expiryDate}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick status cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái thẻ</p>
              <p className="text-sm font-extrabold text-emerald-600 mt-1 uppercase flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {status === 'Active' ? 'Đang hoạt động' : status}
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hiệu lực đến</p>
              <p className="text-sm font-extrabold text-teal-700 mt-1">{expiryDate}</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trợ lý AI Ngữ nghĩa</p>
              <p className="text-sm font-extrabold text-slate-800 mt-1 uppercase flex items-center justify-center gap-1">
                <Sparkles size={13} className="text-teal-500" />
                Sẵn sàng
              </p>
            </div>
          </div>
        </div>

        {/* Right Side (1 col): Virtual Digital ID Card (Slate / Teal aesthetic) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Thẻ thư viện số
            </h3>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
              E-Card
            </span>
          </div>
          
          {/* Glowing Card Component */}
          <div className="relative w-full rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-5 sm:p-6 shadow-xl flex flex-col justify-between text-white border border-teal-500/20 overflow-hidden group space-y-5">
            {/* Ambient Teal glow effects */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

            {/* Top Bar: Brand & Status */}
            <div className="flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-teal-600 rounded-lg flex items-center justify-center text-white text-[10px] font-extrabold shadow-sm shadow-teal-500/30">
                  <Library size={13} />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold tracking-wider text-slate-200 block leading-none">TBD LIBRARY</span>
                  <span className="text-[8px] font-bold text-teal-300 tracking-widest uppercase">Smart Campus</span>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                status === 'Active' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {status === 'Active' ? 'Thẻ hợp lệ' : status}
              </span>
            </div>

            {/* Central QR Code Container */}
            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-lg border border-white/20 z-10 shrink-0 group-hover:scale-102 transition-transform">
              <div className="p-1 bg-white rounded-xl">
                <QRCodeSVG 
                  value={cardNumberValue} 
                  size={120}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="text-[11px] text-slate-900 font-mono font-extrabold tracking-widest mt-2">
                {cardNumberValue}
              </div>
            </div>

            {/* Cardholder metadata */}
            <div className="z-10 text-center space-y-1">
              <p className="text-[9px] text-teal-200/70 uppercase tracking-widest font-semibold">Chủ thẻ thư viện</p>
              <h4 className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase truncate px-2">
                {fullName}
              </h4>
              <div className="flex items-center justify-center gap-3 text-[10px] text-slate-300 pt-0.5">
                <span>Mã: <strong className="text-teal-300 font-mono">{memberCode}</strong></span>
                <span>•</span>
                <span>Hạn: <strong className="text-slate-100">{expiryDate}</strong></span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-normal px-2">
            Xuất trình mã QR tại quầy thủ thư hoặc máy mượn trả tự động để xác thực giao dịch nhanh chóng.
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, Clock, Calendar, CheckCircle2, AlertCircle, RefreshCw, Sparkles, User, ShieldCheck, Mail, Phone, IdCard, CheckSquare, CreditCard, Wallet, Landmark, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { axiosInstance } from '../../../shared/api/axiosInstance';
import { parseFriendlyError } from '../../../shared/utils/errorParser';
import { BookCoverImage } from '../../books/components/BookCoverImage';
import { QRCodeSVG } from 'qrcode.react';

// 1. MEMBER LOANS COMPONENT
export const MemberLoansView: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  // Fine payment state variables
  const [payFineOpen, setPayFineOpen] = useState(false);
  const [selectedLoanForFine, setSelectedLoanForFine] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'momo' | 'demo'>('demo');
  const [payingFine, setPayingFine] = useState(false);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/member/loans');
      if (res.data && res.data.success) {
        setLoans(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching member loans:', err);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const activeLoans = loans.filter((l: any) => l.status === 'Active' || l.status === 'Overdue');
  const historyLoans = loans.filter((l: any) => l.status === 'Returned');
  const unpaidFineLoans = loans.filter((l: any) => l.fineAmount > 0 && !l.finePaid);
  const totalUnpaidFine = unpaidFineLoans.reduce((acc, current) => acc + (current.fineAmount || 0), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* ALERT BOX PHẠT QUÁ HẠN NẾU CÓ */}
      {unpaidFineLoans.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex gap-3 items-start md:items-center">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-rose-800">Bạn có khoản phạt quá hạn chưa thanh toán!</h4>
              <p className="text-xs text-rose-600">
                Tổng số tiền phạt: <span className="font-extrabold">{totalUnpaidFine.toLocaleString('vi-VN')}đ</span> cho <span className="font-bold">{unpaidFineLoans.length}</span> cuốn sách quá hạn. Vui lòng hoàn tất biểu phí.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              setSelectedLoanForFine(unpaidFineLoans[0]);
              setPaymentMethod('demo');
              setPayFineOpen(true);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white shrink-0 gap-1 rounded-xl text-xs"
          >
            <DollarSign size={14} /> Thanh toán khoản đầu tiên
          </Button>
        </div>
      )}

      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-100 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-orange-500 w-5 h-5 animate-pulse" />
            Cổng tự phục vụ độc giả
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            Bạn có thể trực tiếp gia hạn sách đang mượn trực tuyến tối đa 1 lần nếu sách không có ai đặt chờ trong hàng đợi và thanh toán phạt quá hạn.
          </p>
        </div>
        <Button onClick={fetchLoans} variant="outline" size="sm" className="bg-white hover:bg-slate-50 shrink-0 gap-1 rounded-xl">
          <RefreshCw size={14} /> Làm mới
        </Button>
      </div>

      {/* KHỐI 1: SÁCH ĐANG MƯỢN */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <BookOpen className="text-orange-600 w-5 h-5" />
          <h3 className="text-base font-bold text-slate-800">Sách đang mượn ({activeLoans.length})</h3>
        </div>

        {activeLoans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <BookOpen size={20} />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-500 text-sm">Bạn chưa mượn sách nào</p>
              <p className="text-xs text-slate-400">Hãy tìm sách trong danh mục và đến quầy thư viện để mượn sách.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {activeLoans.map((loan) => {
              const isOverdue = loan.status === 'Overdue';
              return (
                <div
                  key={loan.id}
                  className="bg-white border border-slate-200 p-5 rounded-2xl hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
                >
                  <div className="flex gap-4">
                    <BookCoverImage src={loan.coverUrl} title={loan.bookTitle} className="w-14 h-20 rounded-lg shadow-sm border border-slate-100 shrink-0" />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5 items-center mb-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isOverdue 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {isOverdue ? (
                            <>
                              <AlertCircle size={10} /> Quá hạn
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={10} /> Đang mượn
                            </>
                          )}
                        </span>
                        {loan.fineAmount > 0 && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            loan.finePaid 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800 animate-pulse'
                          }`}>
                            {loan.finePaid ? 'Đã trả phạt' : 'Chưa đóng phạt'}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm md:text-base leading-tight truncate">
                        {loan.bookTitle}
                      </h4>
                      <p className="text-xs text-slate-500">Tác giả: {loan.author || 'Đang cập nhật'}</p>
                      <p className="text-xs text-slate-400 font-mono">ISBN: {loan.isbn || 'Đang cập nhật'}</p>
                      
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2.5 text-xs text-slate-500 font-medium pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar size={12} /> Ngày mượn:
                        </div>
                        <div className="text-slate-700">{new Date(loan.checkoutDate).toLocaleDateString('vi-VN')}</div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock size={12} /> Hạn trả:
                        </div>
                        <div className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                          {new Date(loan.dueDate).toLocaleDateString('vi-VN')}
                        </div>
                        {loan.fineAmount > 0 && (
                          <>
                            {loan.overdueDays > 0 && (
                              <>
                                <div className="flex items-center gap-1 text-rose-500 col-span-1 pt-1">
                                  <AlertCircle size={12} /> Số ngày trễ:
                                </div>
                                <div className="text-rose-600 font-bold pt-1">{loan.overdueDays} ngày</div>
                              </>
                            )}
                            <div className="flex items-center gap-1 text-rose-500 col-span-1">
                              <AlertCircle size={12} /> Tiền phạt:
                            </div>
                            <div className="text-rose-600 font-extrabold">{(loan.fineAmount || 0).toLocaleString('vi-VN')}đ</div>
                            <div className="flex items-center gap-1 text-slate-400 col-span-1">
                              <ShieldCheck size={12} /> Phạt quá hạn:
                            </div>
                            <div className={`font-bold ${loan.finePaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {loan.finePaid ? `Đã thanh toán (${loan.paymentMethod})` : 'Chưa thanh toán'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-3">
                    {loan.fineAmount > 0 && !loan.finePaid && (
                      <Button
                        onClick={() => {
                          setSelectedLoanForFine(loan);
                          setPaymentMethod('demo');
                          setPayFineOpen(true);
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg gap-1.5 text-xs h-9 font-bold animate-pulse hover:animate-none"
                      >
                        <DollarSign size={13} />
                        Thanh toán phạt
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleRenew(loan.id)}
                      disabled={renewingId === loan.id || isOverdue}
                      variant="outline"
                      className="border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg gap-1.5 text-xs h-9"
                    >
                      <RefreshCw size={13} className={renewingId === loan.id ? 'animate-spin' : ''} />
                      {renewingId === loan.id ? 'Đang gia hạn...' : 'Gia hạn trực tiếp'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KHỐI 2: LỊCH SỬ MƯỢN TRẢ */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <CheckSquare className="text-emerald-600 w-5 h-5" />
          <h3 className="text-base font-bold text-slate-800">Lịch sử mượn/trả ({historyLoans.length})</h3>
        </div>

        {historyLoans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <CheckSquare size={20} />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-500 text-sm">Chưa có lịch sử mượn trả</p>
              <p className="text-xs text-slate-400">Các cuốn sách bạn đã hoàn tất trả thư viện sẽ xuất hiện tại đây.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {historyLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between gap-4"
              >
                <div className="flex gap-4">
                  <BookCoverImage src={loan.coverUrl} title={loan.bookTitle} className="w-14 h-20 rounded-lg shadow-sm border border-slate-100 shrink-0" />
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      <CheckSquare size={10} /> Đã trả
                    </span>
                    <h4 className="font-bold text-slate-700 text-sm md:text-base leading-tight truncate">
                      {loan.bookTitle}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">Tác giả: {loan.author || 'Đang cập nhật'}</p>
                    
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2.5 text-xs text-slate-500 font-medium pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar size={12} /> Ngày mượn:
                      </div>
                      <div className="text-slate-600">{new Date(loan.checkoutDate).toLocaleDateString('vi-VN')}</div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <CheckSquare size={12} /> Ngày trả:
                      </div>
                      <div className="text-emerald-600 font-semibold">
                        {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DIALOG XÁC NHẬN THANH TOÁN PHẠT */}
      {payFineOpen && selectedLoanForFine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-6 text-slate-800 bg-rose-50 border-b border-rose-100">
              <h3 className="text-lg font-extrabold text-rose-800">Xác nhận thanh toán phạt</h3>
              <p className="text-xs text-rose-600 mt-1">Vui lòng chọn một phương thức thanh toán để tiếp tục demo.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Bạn muốn thanh toán khoản phạt <span className="font-bold text-rose-600">{(selectedLoanForFine.fineAmount || 0).toLocaleString('vi-VN')}đ</span> cho sách <span className="font-bold text-slate-800">[{selectedLoanForFine.bookTitle}]</span>?
              </p>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Sách:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">{selectedLoanForFine.bookTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hạn trả gốc:</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedLoanForFine.dueDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Số ngày trễ:</span>
                  <span className="font-semibold text-rose-600 font-mono">{selectedLoanForFine.overdueDays} ngày</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-slate-800">Số tiền phạt:</span>
                  <span className="text-rose-600 font-mono">{(selectedLoanForFine.fineAmount || 0).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phương thức thanh toán</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('demo')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === 'demo'
                        ? 'border-orange-600 bg-orange-50/50 text-orange-600 ring-2 ring-orange-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Sparkles size={16} className={`${paymentMethod === 'demo' ? 'text-orange-500' : 'text-slate-400'} mb-1`} />
                    <span className="text-xs font-bold">Demo (Mặc định)</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-orange-600 bg-orange-50/50 text-orange-600 ring-2 ring-orange-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Wallet size={16} className={`${paymentMethod === 'cash' ? 'text-orange-500' : 'text-slate-400'} mb-1`} />
                    <span className="text-xs font-bold">Tiền mặt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-orange-600 bg-orange-50/50 text-orange-600 ring-2 ring-orange-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Landmark size={16} className={`${paymentMethod === 'bank_transfer' ? 'text-orange-500' : 'text-slate-400'} mb-1`} />
                    <span className="text-xs font-bold">Chuyển khoản</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('momo')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === 'momo'
                        ? 'border-orange-600 bg-orange-50/50 text-orange-600 ring-2 ring-orange-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CreditCard size={16} className={`${paymentMethod === 'momo' ? 'text-orange-500' : 'text-slate-400'} mb-1`} />
                    <span className="text-xs font-bold">Ví Momo</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 flex gap-2 justify-end border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setPayFineOpen(false);
                  setSelectedLoanForFine(null);
                }}
                className="rounded-xl h-10 text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handlePayFine}
                disabled={payingFine}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 text-xs font-bold px-4 shadow-md shadow-orange-500/20"
              >
                {payingFine ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. MEMBER HOLDS SUMMARY
export const MemberHoldsView: React.FC = () => {
  const [holds, setHolds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHolds = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/member/holds');
      if (res.data && res.data.success) {
        setHolds(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching member holds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolds();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-5 flex items-center justify-between gap-4 animate-in fade-in duration-300">
        <div>
          <h3 className="text-base font-bold text-slate-800">Sách đặt chỗ & Danh sách chờ (Hold Queue)</h3>
          <p className="text-xs text-slate-500 mt-0.5">Khi sách mượn trước đó được trả lại, bạn sẽ nhận được thông báo để tới quầy nhận sách trong thời hạn giữ chỗ.</p>
        </div>
        <Button onClick={fetchHolds} variant="outline" size="sm" className="bg-white hover:bg-slate-50 shrink-0 gap-1 rounded-xl">
          <RefreshCw size={14} /> Làm mới
        </Button>
      </div>

      {holds.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Clock size={28} />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-600">Bạn chưa đặt giữ sách nào</p>
            <p className="text-xs text-slate-400">Các sách không sẵn có bạn có thể đặt giữ thông qua nhân viên thư viện.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-1">
          {holds.map((hold) => {
            const getStatusConfig = () => {
              const status = hold.status;
              const isReady = hold.isReadyForPickup || status === 'Ready' || status === 'Waiting';
              
              if (isReady) {
                return {
                  text: 'Sẵn sàng nhận',
                  classes: 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse',
                  description: 'Sách đã có sẵn, vui lòng đến quầy nhận.'
                };
              }
              if (status === 'Pending') {
                return {
                  text: 'Đang chờ sách',
                  classes: 'bg-amber-50 text-amber-600 border border-amber-100',
                  description: 'Bạn đang trong hàng chờ. Khi sách có sẵn, thư viện sẽ xử lý.'
                };
              }
              if (status === 'Fulfilled') {
                return {
                  text: 'Đã cho mượn',
                  classes: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
                  description: 'Yêu cầu đặt giữ đã được chuyển thành phiếu mượn.'
                };
              }
              if (status === 'Cancelled' || status === 'Expired') {
                return {
                  text: 'Đã hủy / Hết hạn',
                  classes: 'bg-slate-100 text-slate-600 border border-slate-200',
                  description: 'Yêu cầu đặt giữ đã bị hủy hoặc hết hạn hạn chờ.'
                };
              }
              return {
                text: status || 'Không rõ',
                classes: 'bg-slate-100 text-slate-600 border border-slate-200',
                description: 'Trạng thái yêu cầu đặt giữ.'
              };
            };

            const statusConfig = getStatusConfig();

            return (
              <div key={hold.id} className="bg-white border border-slate-200 p-5 rounded-2xl hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-16 bg-slate-50 rounded-lg shrink-0 flex items-center justify-center border border-slate-200 relative overflow-hidden">
                    <BookCoverImage src={hold.coverUrl} title={hold.bookTitle} className="w-12 h-16 rounded-lg"/>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm md:text-base leading-tight truncate">{hold.bookTitle}</h4>
                    <p className="text-xs text-slate-500">Tác giả: {hold.author || 'Đang cập nhật'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">ISBN: {hold.isbn}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><Calendar size={12} /> Đăng ký: {new Date(hold.holdDate).toLocaleDateString('vi-VN')}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> Giữ đến: {new Date(hold.expiryDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    {statusConfig.description && (
                      <p className="text-xs text-slate-400 font-medium mt-1.5 italic bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block">
                        {statusConfig.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center md:flex-col md:items-end justify-between border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 gap-2 shrink-0">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Vị trí hàng chờ</p>
                    <p className="text-lg font-extrabold text-blue-600">STT #{hold.queuePosition}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.classes}`}>
                    {statusConfig.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 3. MEMBER PROFILE & VIRTUAL ID CARD COMPONENT
export const MemberProfileView: React.FC = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/member/profile');
        if (res.data && res.data.success) {
          setProfile(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching member profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const fullName = profile?.fullName || 'John Doe';
  const memberCode = profile?.memberCode || 'U002';
  const email = profile?.email || 'john@example.com';
  const phone = profile?.phone || '0987654321';
  const memberType = profile?.memberType || 'Student';
  const status = profile?.status || 'Active';
  const joinDate = profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString('vi-VN') : '15/02/2025';
  const expiryDate = profile?.expiryDate ? new Date(profile.expiryDate).toLocaleDateString('vi-VN') : '15/02/2026';

  return (
    <div className="grid gap-8 lg:grid-cols-3 pb-16">
      {/* 2/3 Left Side: Personal specs */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800">Thông tin cá nhân độc giả</h3>
            <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={14} /> ID Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Họ và Tên</span>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User size={15} className="text-slate-400" /> {fullName}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Mã độc giả</span>
              <p className="text-sm font-bold text-slate-700 font-mono flex items-center gap-2">
                <IdCard size={15} className="text-slate-400" /> {memberCode}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Hộp thư điện tử (Email)</span>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Mail size={15} className="text-slate-400" /> {email}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Số điện thoại</span>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Phone size={15} className="text-slate-400" /> {phone}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Loại độc giả</span>
              <p className="text-sm font-bold text-blue-600 border border-blue-50 bg-blue-500/5 px-2.5 py-0.5 rounded-md inline-block">
                {memberType}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Thời hạn tài khoản</span>
              <p className="text-sm font-semibold text-slate-700">
                {joinDate} - {expiryDate}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic usage stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Trạng thái thẻ</p>
            <p className="text-base font-extrabold text-emerald-600 mt-1 uppercase">{status === 'Active' ? 'Hoạt động' : status}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center border-l-indigo-500 border-l-[3px]">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hạn dùng</p>
            <p className="text-xs font-extrabold text-indigo-600 mt-1.5">{expiryDate}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hỗ trợ AI</p>
            <p className="text-xs font-extrabold text-blue-600 mt-1.5 uppercase">Kích hoạt</p>
          </div>
        </div>
      </div>

      {/* 1/3 Right Side: Beautiful Virtual ID Card */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1 font-sans">Thẻ thư viện số</h3>
        
        {/* Glowing wallet-like card */}
        <div className="relative w-full rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 shadow-2xl flex flex-col justify-between text-white border border-slate-700/60 overflow-hidden group space-y-6">
          {/* Accent graphics background */}
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-gradient-to-bl from-indigo-500/10 via-rose-500/10 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-350" />
          <div className="absolute -bottom-10 -left-10 w-[120px] h-[120px] bg-teal-500/5 rounded-full blur-xl" />

          {/* Header */}
          <div className="flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-white text-[11px] font-extrabold shadow-md shadow-indigo-500/25">L</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-200">LIBRA PLATFORM</span>
            </div>
            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border uppercase ${
              status === 'Active' 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              {status === 'Active' ? 'Thẻ Hoạt động' : status}
            </span>
          </div>

          {/* QR Code central container */}
          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl shadow-lg border border-white/25 hover:scale-105 transition-transform shrink-0">
            {/* Real SVG QR code using qrcode.react */}
            <div className="p-1.5 bg-white rounded-md">
              <QRCodeSVG 
                value={profile?.cardNumber || profile?.libraryCardNumber || memberCode || ""} 
                size={110}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="text-[10px] text-slate-800 font-mono font-bold tracking-widest mt-2">
              {profile?.cardNumber || profile?.libraryCardNumber || memberCode}
            </div>
          </div>

          {/* User Details */}
          <div className="z-10 text-center space-y-1">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">Họ và Tên chủ thẻ</p>
            <h4 className="text-base font-bold tracking-tight text-white uppercase">{fullName}</h4>
            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-300 pt-1">
              <span>Mã độc giả: <strong className="text-white font-mono">{memberCode}</strong></span>
              <span>•</span>
              <span>Hạn dùng: <strong className="text-white">{expiryDate}</strong></span>
            </div>
          </div>
        </div>

        <p className="text-[11.5px] text-slate-400 text-center leading-normal">
          Quét mã QR/Thẻ thư viện số trên đây tại quầy thủ thư để làm thủ tục mượn hoặc trả sách nhanh chóng.
        </p>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policyService } from '../services/policyService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Save,
  BookOpen,
  Clock,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Calendar,
  Trash2,
  Plus,
  Bookmark,
  DollarSign,
  Info,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { LibraryPolicy, Holiday } from '../types';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

export const PolicyManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<LibraryPolicy>>({});

  const { data: policy, isLoading: loadingPolicy } = useQuery({
    queryKey: ['libraryPolicy'],
    queryFn: () => policyService.getPolicy()
  });

  const saveMutation = useMutation({
    mutationFn: () => policyService.updatePolicy(formData),
    onSuccess: () => {
      toast.success('Đã lưu chính sách mượn/phạt thành công');
      ['libraryPolicy', 'activeLoans', 'dashboardOverview', 'memberLoans', 'reports', 'reportPreview'].forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Không thể lưu chính sách. Vui lòng kiểm tra cấu hình.'));
    }
  });

  useEffect(() => {
    if (policy && Object.keys(formData).length === 0) {
      setFormData(policy);
    }
  }, [policy]);

  const handleChange = (section: keyof LibraryPolicy, field: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) && value !== '') return;
    
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value === '' ? 0 : numValue
      }
    }));
  };

  const currentHolidays = formData.holidays || [];
  const addHoliday = () => {
    setFormData(prev => ({
      ...prev,
      holidays: [...(prev.holidays || []), { id: `h-${Date.now()}`, name: '', date: '' }]
    }));
  };

  const updateHoliday = (idx: number, field: keyof Holiday, value: string) => {
    setFormData(prev => {
      const newHolidays = [...(prev.holidays || [])];
      newHolidays[idx] = { ...newHolidays[idx], [field]: value };
      return { ...prev, holidays: newHolidays };
    });
  };

  const removeHoliday = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      holidays: (prev.holidays || []).filter((_, i) => i !== idx)
    }));
  };

  if (loadingPolicy || Object.keys(formData).length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
          <Skeleton className="h-6 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const curCirc = formData.circulation || { maxItemsPerMember: 0, maxDaysToBorrow: 0, maxRenewals: 0 };
  const curFines = formData.fines || { finePerDay: 0, maxFinePerItem: 0, gracePeriodDays: 0 };
  const curHolds = formData.holds || { maxHoldsPerMember: 0, holdExpirationDays: 0 };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-2xs">
            <BookOpen size={22} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Cấu hình Chính sách Thư viện
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Quy định mượn trả tài liệu, định mức phạt quá hạn, đặt chỗ và lịch nghỉ lễ của thư viện
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <Button 
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFormData(policy || {})}
            className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold h-9 px-3.5 cursor-pointer text-xs"
          >
            <RotateCcw size={14} className="mr-1.5" />
            Khôi phục
          </Button>

          <Button 
            type="button"
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl h-9 px-4 shadow-2xs cursor-pointer text-xs inline-flex items-center transition-colors"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin mr-1.5" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save size={14} className="mr-1.5" />
                <span>Lưu chính sách</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Configuration Tabs */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <Tabs defaultValue="circulation" className="w-full">
            <TabsList className="bg-slate-100/90 border border-slate-200/80 p-1 w-full justify-start h-auto rounded-xl mb-6 shadow-2xs flex flex-wrap gap-1">
              <TabsTrigger 
                value="circulation" 
                className="font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-2xs inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <BookOpen size={15} />
                <span>Mượn trả (Circulation)</span>
              </TabsTrigger>

              <TabsTrigger 
                value="fines" 
                className="font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-2xs inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <DollarSign size={15} />
                <span>Phạt & Trễ hạn (Fines)</span>
              </TabsTrigger>

              <TabsTrigger 
                value="holds" 
                className="font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-2xs inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <Bookmark size={15} />
                <span>Đặt chỗ (Holds)</span>
              </TabsTrigger>

              <TabsTrigger 
                value="holidays" 
                className="font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-2xs inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <Calendar size={15} />
                <span>Ngày nghỉ lễ ({currentHolidays.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: CIRCULATION */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-7">
              <TabsContent value="circulation" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Quy định Mượn trả & Gia hạn tài liệu
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Thiết lập định mức số lượng sách mượn cùng lúc, số ngày mượn cho mỗi đợt và giới hạn lượt gia hạn của độc giả.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                  {/* Field 1 */}
                  <div className="space-y-2 p-4 rounded-xl bg-slate-50/60 border border-slate-200/70 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-800">
                        Số sách mượn tối đa / người
                      </label>
                      <Badge variant="outline" className="text-[10px] font-semibold bg-teal-50 text-teal-800 border-teal-200">
                        quyển
                      </Badge>
                    </div>
                    <Input 
                      type="number" 
                      min={0}
                      value={curCirc.maxItemsPerMember}
                      onChange={e => handleChange('circulation', 'maxItemsPerMember', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-900 bg-white border-slate-200 focus:border-teal-500 h-11"
                    />
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Số lượng ấn phẩm tối đa một độc giả được phép mượn đồng thời trong cùng một thời điểm.
                    </p>
                  </div>

                  {/* Field 2 */}
                  <div className="space-y-2 p-4 rounded-xl bg-slate-50/60 border border-slate-200/70 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-800">
                        Thời hạn mượn mặc định
                      </label>
                      <Badge variant="outline" className="text-[10px] font-semibold bg-teal-50 text-teal-800 border-teal-200">
                        ngày
                      </Badge>
                    </div>
                    <Input 
                      type="number" 
                      min={1}
                      value={curCirc.maxDaysToBorrow}
                      onChange={e => handleChange('circulation', 'maxDaysToBorrow', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-900 bg-white border-slate-200 focus:border-teal-500 h-11"
                    />
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Khoảng thời gian mượn tiêu chuẩn cho mỗi lượt mượn sách trước khi bắt đầu tính quá hạn.
                    </p>
                  </div>

                  {/* Field 3 */}
                  <div className="space-y-2 p-4 rounded-xl bg-slate-50/60 border border-slate-200/70 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-800">
                        Số lần gia hạn tối đa
                      </label>
                      <Badge variant="outline" className="text-[10px] font-semibold bg-teal-50 text-teal-800 border-teal-200">
                        lần
                      </Badge>
                    </div>
                    <Input 
                      type="number" 
                      min={0}
                      value={curCirc.maxRenewals}
                      onChange={e => handleChange('circulation', 'maxRenewals', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-900 bg-white border-slate-200 focus:border-teal-500 h-11"
                    />
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Số lần tối đa bạn đọc được phép gia hạn thêm thời gian mượn nếu sách chưa có người khác đặt trước.
                    </p>
                  </div>
                </div>

                {/* Warning / Policy Guidance Box */}
                <div className="rounded-xl bg-teal-50/70 border border-teal-200/70 p-4 flex items-start gap-3 text-xs text-teal-900">
                  <ShieldCheck size={18} className="text-teal-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Lưu ý áp dụng chính sách:</strong> Khi cập nhật thời hạn hoặc hạn mức mượn sách, quy tắc mới sẽ áp dụng cho tất cả các giao dịch xuất mượn mới. Các phiếu mượn đang diễn ra sẽ giữ nguyên hạn trả ban đầu cho đến khi có thao tác gia hạn mới.
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: FINES */}
              <TabsContent value="fines" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Quy định Tính Phạt Quá Hạn & Mức Bồi Thường
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Thiết lập đơn giá phạt trễ hạn mỗi ngày, mức phạt trần tối đa cho mỗi đầu sách và thời gian ân hạn miễn phạt.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                  {/* Field 1 */}
                  <div className="space-y-2 p-4 rounded-xl bg-slate-50/60 border border-slate-200/70 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-800">
                        Mức phạt trễ hạn / ngày
                      </label>
                      <Badge variant="outline" className="text-[10px] font-semibold bg-rose-50 text-rose-800 border-rose-200">
                        VNĐ / ngày
                      </Badge>
                    </div>
                    <Input 
                      type="number" 
                      min={0}
                      step={1000}
                      value={curFines.finePerDay}
                      onChange={e => handleChange('fines', 'finePerDay', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-900 bg-white border-slate-200 focus:border-teal-500 h-11"
                    />
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Số tiền phạt tính cho mỗi ngày trả trễ hạn trên từng quyển tài liệu (ví dụ: 5.000đ/ngày).
                    </p>
                  </div>

                  {/* Field 2 */}
                  <div className="space-y-2 p-4 rounded-xl bg-slate-50/60 border border-slate-200/70 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-800">
                        Phạt tối đa / quyển sách
                      </label>
                      <Badge variant="outline" className="text-[10px] font-semibold bg-rose-50 text-rose-800 border-rose-200">
                        VNĐ trần
                      </Badge>
                    </div>
                    <Input 
                      type="number" 
                      min={0}
                      step={5000}
                      value={curFines.maxFinePerItem}
                      onChange={e => handleChange('fines', 'maxFinePerItem', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-900 bg-white border-slate-200 focus:border-teal-500 h-11"
                    />
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Giới hạn trần tiền phạt tối đa trên một quyển sách để tránh vượt quá giá trị mua mới của tài liệu.
                    </p>
                  </div>

                  {/* Field 3 */}
                  <div className="space-y-2 p-4 rounded-xl bg-slate-50/60 border border-slate-200/70 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-800">
                        Ân hạn (Grace period)
                      </label>
                      <Badge variant="outline" className="text-[10px] font-semibold bg-amber-50 text-amber-800 border-amber-200">
                        ngày miễn phạt
                      </Badge>
                    </div>
                    <Input 
                      type="number" 
                      min={0}
                      value={curFines.gracePeriodDays}
                      onChange={e => handleChange('fines', 'gracePeriodDays', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-900 bg-white border-slate-200 focus:border-teal-500 h-11"
                    />
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Số ngày quá hạn được miễn tính phạt nếu độc giả kịp thời mang sách hoàn trả trong khoảng thời gian này.
                    </p>
                  </div>
                </div>

                {/* Warning Notice Box */}
                <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-4 flex items-start gap-3 text-xs text-amber-900">
                  <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Cơ chế tính phạt tự động:</strong> Tiền phạt được tính lũy kế theo từng ngày quá hạn. Khi độc giả mang sách đến trả, nếu số ngày quá hạn vượt quá thời gian ân hạn, hệ thống sẽ tự động tính phí và tạo bản ghi nợ phạt để thủ thư đối soát thu ngân.
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: HOLDS */}
              <TabsContent value="holds" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Quy định Đặt Giữ Sách (Hold Queue Policy)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Kiểm soát số lượng tài liệu độc giả được xếp hàng đặt giữ đồng thời và thời gian chờ bạn đọc đến nhận sách tại quầy.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  {/* Field 1 */}
                  <div className="space-y-2 p-4 rounded-xl bg-slate-50/60 border border-slate-200/70 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-800">
                        Số lượng đặt giữ tối đa / người
                      </label>
                      <Badge variant="outline" className="text-[10px] font-semibold bg-teal-50 text-teal-800 border-teal-200">
                        quyển / người
                      </Badge>
                    </div>
                    <Input 
                      type="number" 
                      min={0}
                      value={curHolds.maxHoldsPerMember}
                      onChange={e => handleChange('holds', 'maxHoldsPerMember', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-900 bg-white border-slate-200 focus:border-teal-500 h-11"
                    />
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Số lượng tài liệu đang hết bản khả dụng mà một bạn đọc được quyền xếp hàng đặt trước đồng thời.
                    </p>
                  </div>

                  {/* Field 2 */}
                  <div className="space-y-2 p-4 rounded-xl bg-slate-50/60 border border-slate-200/70 hover:border-teal-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-800">
                        Thời gian giữ sách chờ nhận
                      </label>
                      <Badge variant="outline" className="text-[10px] font-semibold bg-teal-50 text-teal-800 border-teal-200">
                        ngày chờ nhận
                      </Badge>
                    </div>
                    <Input 
                      type="number" 
                      min={1}
                      value={curHolds.holdExpirationDays}
                      onChange={e => handleChange('holds', 'holdExpirationDays', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-900 bg-white border-slate-200 focus:border-teal-500 h-11"
                    />
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Thời hạn lưu sách tại giá đặt trước để độc giả đến nhận. Quá thời hạn này, hệ thống sẽ chuyển lượt cho độc giả kế tiếp.
                    </p>
                  </div>
                </div>

                {/* Info Guidance Box */}
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 flex items-start gap-3 text-xs text-slate-700">
                  <Bookmark size={18} className="text-teal-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Quy trình thực hiện đặt giữ:</strong> Độc giả chỉ có thể đặt giữ khi cuốn sách không còn bản khả dụng nào trong kho. Khi có người hoàn trả sách, thủ thư vào mục Đặt giữ sách (Holds Queue) để xuất mượn cho độc giả đang chờ ở đầu hàng đợi.
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: HOLIDAYS */}
              <TabsContent value="holidays" className="mt-0 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Danh Sách Ngày Nghỉ Lễ & Đóng Cửa Thư Viện
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bạn đọc sẽ được miễn tính phạt và tự động dời ngày hết hạn nếu hạn trả rơi vào các ngày nghỉ lễ này.
                    </p>
                  </div>

                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={addHoliday} 
                    className="border-teal-200 text-teal-700 hover:bg-teal-50 font-semibold h-9 rounded-xl text-xs inline-flex items-center shrink-0 cursor-pointer"
                  >
                    <Plus size={15} className="mr-1.5" />
                    Thêm ngày nghỉ
                  </Button>
                </div>

                {currentHolidays.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Calendar size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">Chưa có ngày nghỉ lễ nào</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Hiện tại lịch thư viện hoạt động liên tục 365 ngày. Bấm "Thêm ngày nghỉ" để khai báo các dịp Tết, Quốc khánh hoặc ngày bảo trì.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentHolidays.map((holiday, idx) => (
                      <div 
                        key={holiday.id} 
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 hover:border-teal-200 transition-colors"
                      >
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Tên dịp nghỉ lễ
                          </label>
                          <Input 
                            placeholder="Ví dụ: Tết Nguyên Đán, Quốc khánh 2/9..." 
                            value={holiday.name} 
                            onChange={e => updateHoliday(idx, 'name', e.target.value)} 
                            className="bg-white text-xs sm:text-sm font-medium h-9 border-slate-200 focus:border-teal-500 rounded-lg"
                          />
                        </div>

                        <div className="w-full sm:w-[200px]">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Ngày áp dụng
                          </label>
                          <Input 
                            type="date" 
                            value={holiday.date} 
                            onChange={e => updateHoliday(idx, 'date', e.target.value)} 
                            className="bg-white text-xs sm:text-sm font-mono h-9 border-slate-200 focus:border-teal-500 rounded-lg"
                          />
                        </div>

                        <div className="sm:pt-5 flex justify-end">
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeHoliday(idx)} 
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-9 w-9 rounded-lg transition-colors cursor-pointer"
                            title="Xóa ngày nghỉ này"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};


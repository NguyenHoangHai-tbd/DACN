import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policyService } from '../services/policyService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Sparkles, BookOpen, Clock, AlertTriangle, TrendingDown, TrendingUp, Loader2, RotateCcw, Activity, Calendar, Trash2, Plus } from 'lucide-react';
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
         <Skeleton className="h-16 w-full rounded-2xl" />
         <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  const curCirc = formData.circulation || { maxItemsPerMember: 0, maxDaysToBorrow: 0, maxRenewals: 0 };
  const curFines = formData.fines || { finePerDay: 0, maxFinePerItem: 0, gracePeriodDays: 0 };
  const curHolds = formData.holds || { maxHoldsPerMember: 0, holdExpirationDays: 0 };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="text-indigo-600" /> Cấu hình Chính sách Thư viện
            </h2>
            <p className="text-sm text-slate-500">Quy định mượn trả, phạt trễ hạn và các giới hạn tài khoản.</p>
         </div>
         <div className="flex gap-3 w-full justify-end md:w-auto">
            <Button 
               variant="outline"
               onClick={() => setFormData(policy || {})}
            >
               <RotateCcw size={16} className="mr-2" /> Khôi phục
            </Button>
            <Button 
               className="bg-indigo-600 hover:bg-indigo-700 font-bold"
               onClick={() => saveMutation.mutate()}
               disabled={saveMutation.isPending}
            >
               {saveMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
               Lưu chính sách
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <Tabs defaultValue="circulation" className="w-full">
            <TabsList className="bg-white border text-slate-600 border-slate-200 p-1 w-full justify-start h-12 rounded-xl mb-6 shadow-sm">
              <TabsTrigger value="circulation" className="font-semibold px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700">Mượn trả (Circulation)</TabsTrigger>
              <TabsTrigger value="fines" className="font-semibold px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700">Phạt & Trễ hạn (Fines)</TabsTrigger>
              <TabsTrigger value="holds" className="font-semibold px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700">Đặt chỗ (Holds)</TabsTrigger>
              <TabsTrigger value="holidays" className="font-semibold px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700 flex items-center gap-2"><Calendar size={14}/> Ngày nghỉ lễ</TabsTrigger>
            </TabsList>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <TabsContent value="circulation" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                       Số sách mượn tối đa / người
                       <span className="text-xs text-slate-400 font-normal">quyển</span>
                    </label>
                    <Input 
                      type="number" 
                      min={0}
                      value={curCirc.maxItemsPerMember}
                      onChange={e => handleChange('circulation', 'maxItemsPerMember', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                       Thời hạn mượn mặc định
                       <span className="text-xs text-slate-400 font-normal">ngày</span>
                    </label>
                    <Input 
                      type="number" 
                      min={1}
                      value={curCirc.maxDaysToBorrow}
                      onChange={e => handleChange('circulation', 'maxDaysToBorrow', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                       Số lần gia hạn tối đa
                       <span className="text-xs text-slate-400 font-normal">lần</span>
                    </label>
                    <Input 
                      type="number" 
                      min={0}
                      value={curCirc.maxRenewals}
                      onChange={e => handleChange('circulation', 'maxRenewals', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-800"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fines" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                       Mức phạt trễ hạn / ngày
                       <span className="text-xs text-slate-400 font-normal">VND</span>
                    </label>
                    <Input 
                      type="number" 
                      min={0}
                      step={1000}
                      value={curFines.finePerDay}
                      onChange={e => handleChange('fines', 'finePerDay', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                       Phạt tối đa / quyển sách
                       <span className="text-xs text-slate-400 font-normal">VND</span>
                    </label>
                    <Input 
                      type="number" 
                      min={0}
                      step={5000}
                      value={curFines.maxFinePerItem}
                      onChange={e => handleChange('fines', 'maxFinePerItem', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                       Ân hạn (Grace period)
                       <span className="text-xs text-slate-400 font-normal">ngày trễ miễn phạt</span>
                    </label>
                    <Input 
                      type="number" 
                      min={0}
                      value={curFines.gracePeriodDays}
                      onChange={e => handleChange('fines', 'gracePeriodDays', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-800"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="holds" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                       Số lượng Hold tối đa
                       <span className="text-xs text-slate-400 font-normal">quyển/người</span>
                    </label>
                    <Input 
                      type="number" 
                      min={0}
                      value={curHolds.maxHoldsPerMember}
                      onChange={e => handleChange('holds', 'maxHoldsPerMember', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                       Thời gian giữ sách
                       <span className="text-xs text-slate-400 font-normal">ngày tới nhận</span>
                    </label>
                    <Input 
                      type="number" 
                      min={1}
                      value={curHolds.holdExpirationDays}
                      onChange={e => handleChange('holds', 'holdExpirationDays', e.target.value)}
                      className="font-mono text-lg font-bold text-slate-800"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="holidays" className="mt-0 space-y-6">
                <div className="flex items-center justify-between mb-4">
                   <p className="text-sm text-slate-500">Người mượn sẽ được miễn phạt và tự động dời ngày hết hạn nếu rơi vào ngày nghỉ lễ này.</p>
                   <Button variant="outline" size="sm" onClick={addHoliday} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                     <Plus size={16} className="mr-2" /> Thêm ngày nghỉ
                   </Button>
                </div>
                {currentHolidays.length === 0 ? (
                   <p className="text-sm text-slate-400 italic text-center py-6">Chưa có ngày nghỉ lễ nào. Lịch thư viện sẽ mở cửa 365 ngày.</p>
                ) : (
                   <div className="space-y-3">
                     {currentHolidays.map((holiday, idx) => (
                       <div key={holiday.id} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                         <div className="flex-1">
                           <Input 
                             placeholder="Tên ngày lễ (VD: Quốc khánh)" 
                             value={holiday.name} 
                             onChange={e => updateHoliday(idx, 'name', e.target.value)} 
                             className="bg-white"
                           />
                         </div>
                         <div className="w-[180px]">
                           <Input 
                             type="date" 
                             value={holiday.date} 
                             onChange={e => updateHoliday(idx, 'date', e.target.value)} 
                             className="bg-white"
                           />
                         </div>
                         <Button variant="ghost" size="icon" onClick={() => removeHoliday(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                           <Trash2 size={16} />
                         </Button>
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

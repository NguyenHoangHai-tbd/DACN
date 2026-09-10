import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandingService } from '../services/brandingService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Globe2, Languages, Sparkles, UploadCloud, Save, LayoutTemplate, Type, Paintbrush, Moon, Sun, Monitor } from 'lucide-react';
import { toast } from 'sonner';

export const BrandingManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('theme');
  
  const { data: branding, isLoading: loadBranding } = useQuery({ queryKey: ['branding'], queryFn: brandingService.getBranding });
  const { data: locale, isLoading: loadLocale } = useQuery({ queryKey: ['locale'], queryFn: brandingService.getLocale });

  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [themeMode, setThemeMode] = useState<'light'|'dark'|'system'>('light');

  const [libraryType, setLibraryType] = useState('Thư viện Công cộng');
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  // Sync state when data loaded
  React.useEffect(() => {
    if (branding) {
      setPrimaryColor(branding.primaryColor || '#4f46e5');
      setFontFamily(branding.fontFamily || 'Inter');
      setThemeMode(branding.themeStyle || 'light');
    }
  }, [branding]);

  const saveBrandingMutation = useMutation({
    mutationFn: (data: any) => brandingService.updateBranding(data),
    onSuccess: () => {
      toast.success('Cập nhật giao diện thành công!');
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    }
  });

  const aiSuggestMutation = useMutation({
    mutationFn: (type: string) => brandingService.getAiThemeSuggestion(type),
    onSuccess: (data) => {
      setAiSuggestion(data);
      toast.success('AI đã tạo đề xuất giao diện.');
    }
  });

  const handleSaveBranding = () => {
    saveBrandingMutation.mutate({
      primaryColor,
      fontFamily,
      themeStyle: themeMode
    });
  };

  const applyAiSuggestion = () => {
    if (aiSuggestion) {
      setPrimaryColor(aiSuggestion.primaryColor);
      setFontFamily(aiSuggestion.fontFamily);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
               <Palette size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cấu hình Giao diện & Ngôn ngữ</h2>
              <p className="text-sm text-slate-500">Tùy chỉnh giao diện, logo và ngôn ngữ theo từng thư viện.</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Config Panel */}
         <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
               <TabsList className="bg-white border text-slate-600 border-slate-200 p-1 w-full h-12 rounded-xl shadow-sm mb-6 inline-flex">
                 <TabsTrigger value="theme" className="font-semibold px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700 flex-1"><Paintbrush size={16} className="mr-2"/> Giao diện & Logo</TabsTrigger>
                 <TabsTrigger value="locale" className="font-semibold px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700 flex-1"><Globe2 size={16} className="mr-2"/> Khu vực & Ngôn ngữ</TabsTrigger>
                 <TabsTrigger value="ai" className="hidden font-semibold px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700 flex-1"><Sparkles size={16} className="mr-2"/> Đề xuất từ AI</TabsTrigger>
               </TabsList>

               <TabsContent value="theme" className="mt-0 space-y-6">
                  <Card className="border-slate-200 shadow-sm">
                     <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-base flex items-center gap-2"><LayoutTemplate size={18}/> Nhận diện thương hiệu (Branding)</CardTitle>
                     </CardHeader>
                     <CardContent className="p-6 space-y-6">
                        {/* Logo Upload - Mock visual only */}
                        <div>
                           <Label className="font-bold text-slate-700 mb-2 block">Logo thư viện</Label>
                           <div className="flex items-start gap-6">
                              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                                 <UploadCloud size={24} />
                              </div>
                              <div className="space-y-2">
                                 <Button variant="outline" size="sm">Tải ảnh lên</Button>
                                 <p className="text-xs text-slate-500">Kích thước tối đa 2MB. Hỗ trợ JPG, PNG, SVG.<br/>Nên dùng ảnh tỷ lệ 1:1 hoặc 16:9 trong suốt.</p>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                           {/* Color Picker */}
                           <div>
                              <Label className="font-bold text-slate-700 mb-2 block text-sm">Màu sắc chủ đạo (Primary Color)</Label>
                              <div className="flex gap-3 items-center">
                                 <div className="w-10 h-10 rounded-lg shadow-sm border border-slate-200" style={{ backgroundColor: primaryColor }}></div>
                                 <Input 
                                    type="color" 
                                    className="w-16 h-10 p-1 cursor-pointer" 
                                    value={primaryColor} 
                                    onChange={(e) => setPrimaryColor(e.target.value)} 
                                 />
                                 <Input 
                                    type="text" 
                                    className="w-32 font-mono uppercase text-sm" 
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                 />
                              </div>
                           </div>
                           
                           {/* Font family */}
                           <div>
                              <Label className="font-bold text-slate-700 mb-2 block text-sm">Font chữ chính (Typography)</Label>
                              <select 
                                 className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                 value={fontFamily}
                                 onChange={(e) => setFontFamily(e.target.value)}
                              >
                                 <option value="Inter">Inter (Mặc định)</option>
                                 <option value="Roboto">Roboto</option>
                                 <option value="Space Grotesk">Space Grotesk</option>
                                 <option value="Playfair Display">Playfair Display (Serif)</option>
                              </select>
                           </div>
                        </div>

                        {/* Theme Mode */}
                        <div className="pt-4 border-t border-slate-100">
                           <Label className="font-bold text-slate-700 mb-3 block text-sm">Chế độ giao diện (Mode)</Label>
                           <div className="flex gap-4">
                              <Button 
                                 variant={themeMode === 'light' ? 'default' : 'outline'} 
                                 className={themeMode === 'light' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : ''}
                                 onClick={() => setThemeMode('light')}
                              >
                                 <Sun size={16} className="mr-2"/> Sáng
                              </Button>
                              <Button 
                                 variant={themeMode === 'dark' ? 'default' : 'outline'}
                                 className={themeMode === 'dark' ? 'bg-slate-800 text-slate-50 border-slate-700 hover:bg-slate-700' : ''}
                                 onClick={() => setThemeMode('dark')}
                              >
                                 <Moon size={16} className="mr-2"/> Tối
                              </Button>
                              <Button 
                                 variant={themeMode === 'system' ? 'default' : 'outline'}
                                 onClick={() => setThemeMode('system')}
                              >
                                 <Monitor size={16} className="mr-2"/> Theo OS
                              </Button>
                           </div>
                        </div>
                     </CardContent>
                     <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveBranding} disabled={saveBrandingMutation.isPending}>
                           <Save size={16} className="mr-2"/> Lưu Thiết lập Giao diện
                        </Button>
                     </div>
                  </Card>
               </TabsContent>

               <TabsContent value="locale" className="mt-0">
                  <Card className="border-slate-200 shadow-sm mb-6">
                     <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-base flex items-center gap-2"><Globe2 size={18}/> Khu vực & Ngôn ngữ Mặc định</CardTitle>
                     </CardHeader>
                     <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <Label className="font-bold text-slate-700 mb-2 block text-sm">Ngôn ngữ mặc định (Default Locale)</Label>
                              <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                                 <option value="vi-VN">Tiếng Việt (vi-VN)</option>
                                 <option value="en-US">English (en-US)</option>
                              </select>
                           </div>
                           <div>
                              <Label className="font-bold text-slate-700 mb-2 block text-sm">Định dạng ngày (Date Format)</Label>
                              <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                                 <option value="dd/MM/yyyy">dd/MM/yyyy (31/12/2026)</option>
                                 <option value="MM/dd/yyyy">MM/dd/yyyy (12/31/2026)</option>
                                 <option value="yyyy-MM-dd">yyyy-MM-dd (2026-12-31)</option>
                              </select>
                           </div>
                        </div>
                     </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-sm">
                     <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <div className="flex justify-between items-center">
                           <CardTitle className="text-base flex items-center gap-2"><Languages size={18}/> Tùy chỉnh Dịch thuật (Overrides)</CardTitle>
                           <Button size="sm" variant="outline" className="hidden"><Sparkles size={14} className="mr-2"/> Dịch bằng AI</Button>
                        </div>
                     </CardHeader>
                     <CardContent className="p-0">
                        <div className="p-4 bg-amber-50 border-b border-amber-100 text-amber-800 text-sm">
                           Thay đổi các từ khóa mặc định của hệ thống để phù hợp hơn với loại hình thư viện của bạn (VD: đổi "Đọc giả" thành "Học sinh").
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                               <Label className="text-xs text-slate-500 font-mono">member.profile.title</Label>
                               <Input defaultValue="Hồ sơ Hội viên" />
                            </div>
                            <div className="space-y-1">
                               <Label className="text-xs text-slate-500 font-mono">loan.checkout.success</Label>
                               <Input defaultValue="Đã ghi nhận mượn tài liệu thành công" />
                            </div>
                            <Button variant="outline" className="w-full text-slate-500 border-dashed">Thêm Key Mới...</Button>
                        </div>
                     </CardContent>
                  </Card>
               </TabsContent>

               <TabsContent value="ai" className="mt-0">
                  <Card className="border-indigo-100 shadow-sm border bg-indigo-50/10">
                     <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2 text-indigo-900"><Sparkles size={18} className="text-indigo-600"/> Trợ lý Thiết kế AI</CardTitle>
                        <CardDescription>Nhập loại hình hoạt động để AI đề xuất bảng màu và font chữ phù hợp nhất.</CardDescription>
                     </CardHeader>
                     <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                           <Label className="font-bold text-slate-700">Loại hình thư viện / Tổ chức</Label>
                           <div className="flex gap-2">
                              <Input 
                                 placeholder="VD: Trường Tiểu học, Thư viện Doanh nghiệp IT..." 
                                 value={libraryType}
                                 onChange={e => setLibraryType(e.target.value)}
                              />
                              <Button 
                                 className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                                 onClick={() => aiSuggestMutation.mutate(libraryType)}
                                 disabled={aiSuggestMutation.isPending || !libraryType}
                              >
                                 Tạo đề xuất
                              </Button>
                           </div>
                        </div>

                        {aiSuggestion && (
                           <div className="border border-indigo-200 bg-white rounded-xl p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                              <h3 className="font-bold text-slate-800 mb-4">Kết quả đề xuất từ AI:</h3>
                              
                              <div className="grid grid-cols-2 gap-6 mb-4">
                                 <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Màu chủ đạo đề xuất</p>
                                    <div className="flex items-center gap-3">
                                       <div className="w-12 h-12 rounded-xl shadow-md border-2 border-white" style={{ backgroundColor: aiSuggestion.primaryColor }}></div>
                                       <span className="font-mono text-sm font-bold text-slate-700">{aiSuggestion.primaryColor}</span>
                                    </div>
                                 </div>
                                 <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Font chữ đề xuất</p>
                                    <div className="flex items-center gap-2 h-12">
                                       <Type size={20} className="text-slate-400" />
                                       <span className="text-lg" style={{ fontFamily: aiSuggestion.fontFamily }}>{aiSuggestion.fontFamily}</span>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 italic mb-6">
                                 "{aiSuggestion.reason}"
                              </div>

                              <Button onClick={applyAiSuggestion} className="w-full gap-2">
                                 <Paintbrush size={16}/> Áp dụng thiết kế này
                              </Button>
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </TabsContent>
            </Tabs>
         </div>

         {/* Live Preview Panel */}
         <div className="lg:col-span-1">
            <div className="sticky top-6">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><LayoutTemplate size={18}/> Live Preview</h3>
               
               <div 
                  className={`border border-slate-200 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${themeMode === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50'}`}
                  style={{ fontFamily }}
               >
                  {/* Mock Window Header */}
                  <div className={`h-8 border-b flex items-center px-3 gap-1.5 ${themeMode === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
                     <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  </div>

                  {/* App Mockup */}
                  <div className="p-4">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: primaryColor }}>
                              L
                           </div>
                           <span className={`font-bold text-sm ${themeMode === 'dark' ? 'text-white' : 'text-slate-800'}`}>Tên Thư Viện</span>
                        </div>
                        <div className="w-6 h-6 rounded-full overflow-hidden border" style={{ borderColor: primaryColor }}>
                           <img src="https://i.pravatar.cc/100" alt="avatar" />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className={`h-24 rounded-xl p-4 flex flex-col justify-end text-white relative overflow-hidden`} style={{ backgroundColor: primaryColor }}>
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                           <h4 className="font-bold text-lg drop-shadow-md">Khám phá<br/>Tri thức mới</h4>
                        </div>

                        <div className={`p-3 rounded-lg border ${themeMode === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} flex items-center justify-between shadow-sm`}>
                           <div>
                              <p className={`text-xs ${themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Tài liệu đang mượn</p>
                              <p className={`font-bold ${themeMode === 'dark' ? 'text-white' : 'text-slate-800'}`}>03 Cuốn</p>
                           </div>
                           <Button size="sm" style={{ backgroundColor: primaryColor }} className="text-white hover:opacity-90 h-7 rounded px-3 text-xs">
                              Xem chi tiết
                           </Button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

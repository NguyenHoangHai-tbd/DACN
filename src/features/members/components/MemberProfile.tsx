import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { memberService } from '../services/memberService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, Calendar, Clock, Edit, X, QrCode} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MemberForm } from './MemberForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';

interface MemberProfileProps {
  memberId: string;
  onClose: () => void;
}

export const MemberProfile: React.FC<MemberProfileProps> = ({ memberId, onClose }) => {
  const { t, i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => memberService.getMember(memberId)
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['memberHistory', memberId],
    queryFn: () => memberService.getMemberHistory(memberId)
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!member) {
    return <div className="p-8 text-center text-red-500">{t('member.not_found', 'Không tìm thấy độc giả.')}</div>;
  }

  const typeColors: Record<string, string> = {
    'Student': 'bg-blue-50 text-blue-700',
    'Teacher': 'bg-purple-50 text-purple-700',
    'Staff': 'bg-orange-50 text-orange-700',
    'External': 'bg-stone-50 text-stone-700'
  };

  const statusColors: Record<string, string> = {
    'Active': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Inactive': 'bg-slate-100 text-slate-800 border-slate-200',
    'Suspended': 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold flex items-center gap-2">
          {t('member.profile_title', 'Hồ sơ Độc giả')}
          <Badge variant="outline" className="font-mono">{member.memberCode}</Badge>
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100"><X size={20}/></Button>
      </div>

      <div className="overflow-y-auto p-6 bg-slate-50/50">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 mb-6 shadow-sm">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
            <User size={40} className="text-slate-400" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
               <div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-1">{member.fullName}</h1>
                  <div className="flex gap-2 items-center">
                    <Badge variant="secondary" className={`${typeColors[member.memberType] || 'bg-slate-100'} border-none uppercase text-xs tracking-wider font-bold`}>
                      {member.memberType === 'Student' ? 'Học sinh / Sinh viên' : 
                       member.memberType === 'Teacher' ? 'Giáo viên / Giảng viên' : 
                       member.memberType === 'Staff' ? 'Nhân viên' : 'Khách ngoài'}
                    </Badge>
                    <Badge variant="outline" className={`${statusColors[member.status] || ''} text-[10px] uppercase font-bold tracking-wider`}>
                      {member.status === 'Active' ? 'Hoạt động' : 
                       member.status === 'Suspended' ? 'Bị khóa / Đình chỉ' : 'Ngừng hoạt động'}
                    </Badge>
                  </div>
               </div>
               {!isEditing && (
                 <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                   <Edit size={14} className="mr-2" /> {t('member.edit_profile', 'Sửa hồ sơ')}
                 </Button>
               )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div className="flex items-center gap-2 text-slate-600"><Mail size={16} className="text-slate-400"/> {member.email || 'N/A'}</div>
              <div className="flex items-center gap-2 text-slate-600"><Phone size={16} className="text-slate-400"/> {member.phone || 'N/A'}</div>
              <div className="flex items-center gap-2 text-slate-600"><Calendar size={16} className="text-slate-400"/> {t('member.join_date', 'Ngày tạo')}: {new Date(member.joinDate).toLocaleDateString(i18n.language)}</div>
              <div className="flex items-center gap-2 text-slate-600"><Clock size={16} className="text-slate-400"/> {t('member.expiry_date', 'Hết hạn')}: <span className="font-semibold">{new Date(member.expiryDate).toLocaleDateString(i18n.language)}</span></div>
            </div>
          </div>
          {/* QR Code */}
          <div className="hidden lg:flex flex-col items-center justify-center border-l border-slate-100 pl-6 ml-2">
            <div className="p-2 bg-white outline outline-1 outline-slate-200 rounded-lg shadow-sm">
              <QRCodeSVG value={member.memberCode} size={80} level="H" />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-1"><QrCode size={10} /> {t('member.card_number', 'Thẻ số')}: {member.memberCode}</span>
          </div>
        </div>

        {isEditing ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">{t('member.edit_profile', 'Chỉnh sửa hồ sơ')}</h3>
            <MemberForm 
              initialData={{...member, expiryDate: member.expiryDate.split('T')[0]}} 
              onSuccess={() => setIsEditing(false)} 
            />
          </div>
        ) : (
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="bg-white border border-slate-200 rounded-xl p-1 mb-6">
              <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">{t('member.history_tab', 'Lịch sử mượn trả')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {historyLoading ? (
                 <div className="p-6">
                   <div className="text-sm font-medium text-slate-500 animate-pulse flex items-center gap-2 mb-3">
                     <Clock className="animate-spin text-indigo-600" size={16} />
                     Đang tải lịch sử mượn trả của độc giả...
                   </div>
                   <Skeleton className="h-24 w-full rounded-xl" />
                 </div>
              ) : !history || history.length === 0 ? (
                 <div className="p-12 text-center text-slate-400">
                   Chưa có lịch sử giao dịch mượn/trả sách nào đối với độc giả này.
                 </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[650px] table-fixed">
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[170px]">Thời gian giao dịch</TableHead>
                        <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[130px]">Loại hoạt động</TableHead>
                        <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[120px]">Trạng thái</TableHead>
                        <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[230px]">Chi tiết sách</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {history.map((h: any) => (
                         <TableRow key={h.id} className="hover:bg-slate-50/50 transition-colors">
                           <TableCell className="text-sm font-medium text-slate-600">
                             {new Date(h.timestamp).toLocaleString('vi-VN')}
                           </TableCell>
                           <TableCell>
                              <Badge variant="outline" className={h.action === 'checkout' ? 'border-amber-200 bg-amber-50 text-amber-700 font-bold' : 'border-emerald-200 bg-emerald-50 text-emerald-700 font-bold'}>
                                {h.action === 'checkout' ? 'Mượn sách' : 'Trả sách'}
                              </Badge>
                           </TableCell>
                           <TableCell>
                              {h.status && (
                                <Badge variant="outline" className={h.status === 'Active' ? 'border-blue-200 bg-blue-50 text-blue-700 font-bold' : h.status === 'Overdue' ? 'border-red-200 bg-red-50 text-red-700 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600'}>
                                  {h.status === 'Active' ? 'Đang mượn' : h.status === 'Overdue' ? 'Quá hạn' : 'Đã trả'}
                                </Badge>
                              )}
                           </TableCell>
                           <TableCell className="font-medium text-slate-800">
                             <div className="line-clamp-1" title={h.bookTitle}>
                               {h.action === 'checkout' ? `Đã mượn "${h.bookTitle}"` : `Đã trả "${h.bookTitle}"`}
                             </div>
                           </TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

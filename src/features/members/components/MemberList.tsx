import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { memberService } from '../services/memberService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Search, Plus, User } from 'lucide-react';
import { MemberProfile } from './MemberProfile';
import { MemberForm } from './MemberForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

export const MemberList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: members, isLoading, isError } = useQuery({
    queryKey: ['members', searchTerm],
    queryFn: () => memberService.getMembers(searchTerm)
  });

  const handleRowClick = (id: string) => {
    setSelectedMemberId(id);
    setIsProfileOpen(true);
  };

  const statusColors: Record<string, string> = {
    'Active': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Inactive': 'bg-slate-100 text-slate-800 border-slate-200',
    'Suspended': 'bg-red-100 text-red-800 border-red-200'
  };

  const typeColors: Record<string, string> = {
    'Student': 'bg-blue-50 text-blue-700',
    'Teacher': 'bg-purple-50 text-purple-700',
    'Staff': 'bg-orange-50 text-orange-700',
    'External': 'bg-stone-50 text-stone-700'
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="text-indigo-600" size={20} />
          <h3 className="font-bold text-slate-800 text-lg">{t('menu.members', 'Quản lý Độc giả')}</h3>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder={t('member.search_placeholder', 'Tìm mã thẻ, họ tên, email...')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-white"
            />
          </div>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger render={<Button className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shrink-0" />}>
              <Plus size={16} className="mr-2" />
              {t('member.add_new', 'Thêm Độc giả')}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-2xl">
              <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <User className="text-indigo-600" />
                  {t('member.add_new', 'Thêm mới Độc giả')}
                </DialogTitle>
              </DialogHeader>
              <div className="p-6">
                <MemberForm onSuccess={() => setIsFormOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="w-full overflow-x-auto min-h-[400px]">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="text-sm font-medium text-slate-500 animate-pulse flex items-center gap-2">
              <Users className="animate-spin text-indigo-600" size={16} />
              Đang tải danh sách độc giả... Vui lòng đợi trong giây lát.
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600 bg-red-50 rounded-2xl border border-red-100 font-medium">
            Không thể tải dữ liệu danh sách độc giả. Vui lòng thử lại sau.
          </div>
        ) : !members || members.length === 0 ? (
          <div className="p-16 text-center text-slate-500 bg-white">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="font-semibold text-slate-700 text-lg">Chưa có dữ liệu độc giả</p>
            <p className="text-sm text-slate-400 mt-1">Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm của bạn.</p>
          </div>
        ) : (
          <Table className="min-w-[700px] table-fixed">
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[130px]">{t('member.col_code', 'Mã thẻ')}</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[220px]">Thông tin độc giả</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[110px]">Phân loại</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[120px]">Trạng thái thẻ</TableHead>
                <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[120px]">{t('member.expiry', 'Hạn thẻ')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member: any) => (
                <TableRow 
                  key={member.id} 
                  onClick={() => handleRowClick(member.id)}
                  className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                >
                  <TableCell className="font-mono text-sm text-indigo-600 font-bold group-hover:underline">
                    {member.memberCode}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col pr-2">
                      <span className="font-bold text-slate-800 line-clamp-1">{member.fullName}</span>
                      <span className="text-xs text-slate-500 truncate" title={member.email || member.phone}>
                        {member.email || member.phone || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${typeColors[member.memberType] || 'bg-slate-100'} border-none uppercase text-[10px] tracking-wider font-bold`}>
                      {member.memberType === 'Student' ? 'Học sinh / Sinh viên' : 
                       member.memberType === 'Teacher' ? 'Giáo viên / Giảng viên' : 
                       member.memberType === 'Staff' ? 'Nhân viên' : 'Khách ngoài'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${statusColors[member.status] || ''} text-[10px] uppercase font-bold tracking-wider`}>
                      {member.status === 'Active' ? 'Hoạt động' : 
                       member.status === 'Suspended' ? 'Bị khóa / Đình chỉ' : 'Ngừng hoạt động'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-600">
                    {new Date(member.expiryDate).toLocaleDateString('vi-VN')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-slate-50">
           {selectedMemberId && <MemberProfile memberId={selectedMemberId} onClose={() => setIsProfileOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

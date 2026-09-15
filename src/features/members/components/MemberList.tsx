import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { memberService } from '../services/memberService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Users,
  Search,
  Plus,
  UserPlus,
  Eye,
  Mail,
  Phone,
  Calendar,
  RotateCw,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CreditCard,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { MemberProfile } from './MemberProfile';
import { MemberForm } from './MemberForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Member } from '../types';

export const MemberList: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: members, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['members', searchTerm],
    queryFn: () => memberService.getMembers(searchTerm)
  });

  const handleRowClick = (id: string) => {
    setSelectedMemberId(id);
    setIsProfileOpen(true);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Client-side filtering
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members.filter((member: Member) => {
      if (typeFilter !== 'all' && member.memberType !== typeFilter) {
        return false;
      }
      if (statusFilter !== 'all' && member.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [members, typeFilter, statusFilter]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  // Key metrics
  const totalCount = members?.length ?? 0;
  const activeCount = useMemo(() => members?.filter(m => m.status === 'Active').length ?? 0, [members]);
  const suspendedCount = useMemo(() => members?.filter(m => m.status === 'Suspended').length ?? 0, [members]);
  const studentCount = useMemo(() => members?.filter(m => m.memberType === 'Student').length ?? 0, [members]);
  const teacherCount = useMemo(() => members?.filter(m => m.memberType === 'Teacher').length ?? 0, [members]);

  const hasActiveFilters = searchTerm.trim() !== '' || typeFilter !== 'all' || statusFilter !== 'all';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.getTime() < Date.now();
    } catch {
      return false;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200/80 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Hoạt động
          </Badge>
        );
      case 'Suspended':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200/80 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Bị khóa / Đình chỉ
          </Badge>
        );
      case 'Inactive':
      default:
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Ngừng hoạt động
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Student':
        return (
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200/80 text-xs font-semibold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
            <GraduationCap size={12} className="text-teal-600" />
            Học sinh / Sinh viên
          </Badge>
        );
      case 'Teacher':
        return (
          <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200/80 text-xs font-semibold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
            <BookOpen size={12} className="text-sky-600" />
            Giáo viên / Giảng viên
          </Badge>
        );
      case 'Staff':
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200/80 text-xs font-semibold px-2.5 py-0.5 rounded-md">
            Nhân viên
          </Badge>
        );
      case 'External':
      default:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200/80 text-xs font-semibold px-2.5 py-0.5 rounded-md">
            Khách ngoài
          </Badge>
        );
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'ĐG';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="space-y-4 sm:space-y-5 w-full">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex-shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                {t('menu.members', 'Quản lý Độc giả')}
              </h2>
              <Badge variant="outline" className="bg-teal-50/80 text-teal-700 border-teal-200/80 font-semibold text-xs px-2.5 py-0.5">
                {totalCount} bạn đọc
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Hồ sơ thành viên, cấp phát thẻ mượn và theo dõi hạn sử dụng thẻ thư viện
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-auto self-stretch">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 px-3 rounded-xl border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50/50 hover:border-teal-200 transition-colors"
            title="Tải lại danh sách"
          >
            <RotateCw size={15} className={`mr-1.5 ${isFetching ? 'animate-spin text-teal-600' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>

          <Button
            onClick={() => setIsFormOpen(true)}
            className="flex-1 sm:flex-none h-10 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs hover:shadow-sm transition-all inline-flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            <span>{t('member.add_new', 'Thêm Độc giả')}</span>
          </Button>
        </div>
      </div>

      {/* Metric summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 flex-shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Tổng bạn đọc</p>
            <p className="text-lg font-bold text-slate-800">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <CreditCard size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Đang hoạt động</p>
            <p className="text-lg font-bold text-emerald-700">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 flex-shrink-0">
            <GraduationCap size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Học sinh / SV</p>
            <p className="text-lg font-bold text-sky-700">{studentCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 flex-shrink-0">
            <BookOpen size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Giáo viên / CB</p>
            <p className="text-lg font-bold text-amber-700">{teacherCount}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={17} />
            <Input
              placeholder={t('member.search_placeholder', 'Tìm mã thẻ, họ tên, email, số điện thoại...')}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-9 h-10 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white text-sm transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-48">
              <select
                value={typeFilter}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full h-10 pl-3 pr-8 rounded-xl bg-slate-50/50 border border-slate-200 text-sm text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none cursor-pointer"
              >
                <option value="all">Tất cả đối tượng</option>
                <option value="Student">Học sinh / Sinh viên</option>
                <option value="Teacher">Giáo viên / Giảng viên</option>
                <option value="Staff">Nhân viên thư viện</option>
                <option value="External">Khách ngoài / Khác</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
            </div>

            {/* Status Filter */}
            <div className="relative w-full sm:w-44">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full h-10 pl-3 pr-8 rounded-xl bg-slate-50/50 border border-slate-200 text-sm text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Active">Đang hoạt động</option>
                <option value="Inactive">Ngừng hoạt động</option>
                <option value="Suspended">Bị khóa / Đình chỉ</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-10 px-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-medium shrink-0"
                title="Đặt lại bộ lọc"
              >
                <X size={14} className="mr-1" />
                <span className="hidden sm:inline">Đặt lại</span>
              </Button>
            )}
          </div>
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <Filter size={12} className="text-teal-600" />
              Đang lọc:
            </span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 font-medium">
                Từ khóa: &quot;{searchTerm}&quot;
                <X size={11} className="cursor-pointer hover:text-teal-900" onClick={() => handleSearchChange('')} />
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 font-medium">
                Đối tượng: {typeFilter}
                <X size={11} className="cursor-pointer hover:text-teal-900" onClick={() => handleTypeChange('all')} />
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 font-medium">
                Trạng thái: {statusFilter}
                <X size={11} className="cursor-pointer hover:text-teal-900" onClick={() => handleStatusChange('all')} />
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-teal-600 hover:text-teal-800 hover:underline ml-auto font-medium"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Main Data Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
              <RotateCw size={16} className="animate-spin text-teal-600" />
              <span>Đang tải danh sách độc giả... Vui lòng đợi trong giây lát.</span>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Không thể tải dữ liệu danh sách độc giả</p>
              <p className="text-sm text-slate-500 mt-1">Đã xảy ra lỗi khi truy vấn máy chủ. Vui lòng thử lại.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-2 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
            >
              <RotateCw size={15} />
              Thử lại ngay
            </Button>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 mx-auto flex items-center justify-center text-slate-400 mb-3">
              <Users size={28} />
            </div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">Không tìm thấy độc giả phù hợp</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {hasActiveFilters
                ? 'Không có hồ sơ nào trùng khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại.'
                : 'Chưa có hồ sơ độc giả nào trong hệ thống. Hãy thêm mới độc giả đầu tiên.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Xóa bộ lọc tìm kiếm
                </Button>
              ) : (
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Thêm mới độc giả
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {paginatedMembers.map((member: Member) => {
                const expired = isExpired(member.expiryDate);
                return (
                  <div
                    key={member.id}
                    onClick={() => handleRowClick(member.id)}
                    className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-bold text-sm flex items-center justify-center border border-teal-100 flex-shrink-0">
                          {getInitials(member.fullName)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm line-clamp-1">{member.fullName}</p>
                          <span className="inline-block font-mono text-xs font-semibold text-teal-700 bg-teal-50/80 px-2 py-0.5 rounded border border-teal-100 mt-0.5">
                            {member.memberCode}
                          </span>
                        </div>
                      </div>
                      <div>{getStatusBadge(member.status)}</div>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium w-16">Đối tượng:</span>
                        <div>{getTypeBadge(member.memberType)}</div>
                      </div>
                      {(member.email || member.phone) && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="text-slate-400 font-medium w-16">Liên hệ:</span>
                          <span className="truncate">{member.email || member.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium w-16">Hạn thẻ:</span>
                        <span className={`inline-flex items-center gap-1 font-medium ${expired ? 'text-rose-600' : 'text-slate-700'}`}>
                          <Calendar size={12} className={expired ? 'text-rose-500' : 'text-slate-400'} />
                          {formatDate(member.expiryDate)}
                          {expired && (
                            <span className="ml-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Đã hết hạn
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Nhấn để xem chi tiết</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(member.id);
                        }}
                        className="h-8 px-2 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg inline-flex items-center gap-1"
                      >
                        <Eye size={13} />
                        Hồ sơ
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 border-b border-slate-200/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider py-3.5 pl-6 w-[140px]">
                      {t('member.col_code', 'Mã thẻ')}
                    </TableHead>
                    <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider py-3.5">
                      Thông tin độc giả
                    </TableHead>
                    <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider py-3.5 w-[190px]">
                      Phân loại
                    </TableHead>
                    <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider py-3.5 w-[160px]">
                      Trạng thái thẻ
                    </TableHead>
                    <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider py-3.5 w-[140px]">
                      {t('member.expiry', 'Hạn thẻ')}
                    </TableHead>
                    <TableHead className="font-bold text-slate-600 uppercase text-[11px] tracking-wider py-3.5 pr-6 text-right w-[110px]">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {paginatedMembers.map((member: Member) => {
                    const expired = isExpired(member.expiryDate);
                    return (
                      <TableRow
                        key={member.id}
                        onClick={() => handleRowClick(member.id)}
                        className="hover:bg-teal-50/30 cursor-pointer transition-colors group"
                      >
                        <TableCell className="py-3.5 pl-6 font-mono text-sm font-bold text-teal-700 group-hover:text-teal-800">
                          <span className="inline-block px-2 py-0.5 rounded bg-teal-50/70 border border-teal-100/80">
                            {member.memberCode}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 flex-shrink-0 group-hover:bg-teal-100/50 group-hover:text-teal-800 group-hover:border-teal-200 transition-colors">
                              {getInitials(member.fullName)}
                            </div>
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="font-semibold text-slate-800 text-sm group-hover:text-teal-900 transition-colors truncate">
                                {member.fullName}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                {member.email && (
                                  <span className="inline-flex items-center gap-1 truncate max-w-[170px]" title={member.email}>
                                    <Mail size={12} className="text-slate-400 flex-shrink-0" />
                                    {member.email}
                                  </span>
                                )}
                                {member.phone && (
                                  <span className="inline-flex items-center gap-1 text-slate-400 truncate" title={member.phone}>
                                    <Phone size={12} className="text-slate-400 flex-shrink-0" />
                                    {member.phone}
                                  </span>
                                )}
                                {!member.email && !member.phone && (
                                  <span className="text-slate-400 italic">Chưa có liên hệ</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5">
                          {getTypeBadge(member.memberType)}
                        </TableCell>
                        <TableCell className="py-3.5">
                          {getStatusBadge(member.status)}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="flex flex-col">
                            <span className={`text-xs font-semibold inline-flex items-center gap-1 ${expired ? 'text-rose-600' : 'text-slate-700'}`}>
                              <Calendar size={12} className={expired ? 'text-rose-500' : 'text-slate-400'} />
                              {formatDate(member.expiryDate)}
                            </span>
                            {expired && (
                              <span className="text-[10px] font-bold text-rose-600 mt-0.5">Hết hạn</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRowClick(member.id)}
                            className="h-8 px-2.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <Eye size={14} />
                            <span>Hồ sơ</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-center sm:text-left">
                <span>
                  Hiển thị <span className="font-semibold text-slate-800">{filteredMembers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> - <span className="font-semibold text-slate-800">{Math.min(currentPage * pageSize, filteredMembers.length)}</span> trong tổng số <span className="font-semibold text-slate-800">{filteredMembers.length}</span> độc giả
                </span>
                {filteredMembers.length !== totalCount && (
                  <span className="text-slate-400 hidden lg:inline">(Lọc từ {totalCount} bạn đọc)</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Page Size selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Số dòng:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Page buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40"
                    title="Trang trước"
                  >
                    <ChevronLeft size={15} />
                  </Button>
                  <span className="px-2 font-semibold text-slate-700">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40"
                    title="Trang sau"
                  >
                    <ChevronRight size={15} />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dialog: Thêm Độc giả */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-w-[95vw] p-0 overflow-hidden rounded-2xl border-slate-200 shadow-xl max-h-[90vh] flex flex-col bg-white">
          <DialogHeader className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex-shrink-0">
                <UserPlus size={22} />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-slate-800">
                  {t('member.add_new', 'Thêm mới Độc giả')}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Nhập thông tin cá nhân và thiết lập tài khoản thẻ bạn đọc thư viện
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-5 sm:p-6 overflow-y-auto flex-1">
            <MemberForm onSuccess={() => setIsFormOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Chi tiết Hồ sơ Độc giả */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-4xl max-w-[95vw] p-0 overflow-hidden rounded-2xl border-slate-200 shadow-xl bg-slate-50 max-h-[90vh] flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Hồ sơ độc giả</DialogTitle>
            <DialogDescription>Xem thông tin chi tiết và lịch sử mượn trả của độc giả</DialogDescription>
          </DialogHeader>
          {selectedMemberId && (
            <MemberProfile
              memberId={selectedMemberId}
              onClose={() => setIsProfileOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

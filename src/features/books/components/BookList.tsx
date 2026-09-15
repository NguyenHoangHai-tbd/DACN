import React, { useState, useMemo } from 'react';
import { BookCoverImage } from './BookCoverImage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookService } from '../services/bookService';
import { searchService } from '../../search/services/searchService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Library,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Sparkles,
  Loader2,
  X,
  AlertTriangle,
  RotateCw,
  AlertCircle,
  Filter,
  CheckCircle2,
  Layers,
  MapPin,
  Barcode
} from 'lucide-react';
import { usePermission } from '../../../shared/hooks/usePermission';
import { BookForm } from './BookForm';
import { toast } from 'sonner';
import { parseFriendlyError } from '../../../shared/utils/errorParser';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Book } from '../types';

export const BookList: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { hasPermission, isLibrarian } = usePermission();
  const canManageCatalog = hasPermission('catalog.manage');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedDetailBook, setSelectedDetailBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAiMode, setIsAiMode] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{ id: string; title: string } | null>(null);

  const { data: books, isLoading, isError, refetch } = useQuery({
    queryKey: ['books'],
    queryFn: bookService.getBooks
  });

  const aiSearchMutation = useMutation({
    mutationFn: searchService.aiSearch,
    onSuccess: () => {
      setIsAiMode(true);
    },
    onError: (_error: any) => {
      toast.error('AI tìm kiếm ngữ nghĩa thất bại. Vui lòng thử lại sau.');
    }
  });

  const handleAiSearch = () => {
    if (searchQuery.trim().length >= 3) {
      aiSearchMutation.mutate(searchQuery);
    }
  };

  // Extract unique categories from books
  const categories = useMemo(() => {
    if (!books) return [];
    const unique = new Set(books.map(b => b.category).filter(Boolean));
    return Array.from(unique);
  }, [books]);

  // Filter books locally for standard search & category/status filters
  const filteredBooks = useMemo(() => {
    if (!books) return [];
    if (isAiMode) return books;

    return books.filter(book => {
      // Search query filter
      if (searchQuery && searchQuery.trim()) {
        const q = (searchQuery || '').toLowerCase().trim();
        const matchesSearch =
          (book?.title || '').toLowerCase().includes(q) ||
          (book?.author || '').toLowerCase().includes(q) ||
          (book?.isbn || '').toLowerCase().includes(q) ||
          (book?.barcode || '').toLowerCase().includes(q) ||
          (book?.category || '').toLowerCase().includes(q);

        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && book.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'available' && book.availableCopies <= 0) {
        return false;
      }
      if (statusFilter === 'out_of_stock' && book.availableCopies > 0) {
        return false;
      }

      return true;
    });
  }, [books, searchQuery, isAiMode, categoryFilter, statusFilter]);

  const displayedBooks = useMemo(() => {
    if (isAiMode && aiSearchMutation.data) {
      return aiSearchMutation.data.map((item: any) => item.book);
    }
    return filteredBooks;
  }, [isAiMode, aiSearchMutation.data, filteredBooks]);

  const getAiMatchReason = (bookId: string) => {
    if (!isAiMode || !aiSearchMutation.data) return null;
    const found = aiSearchMutation.data.find((item: any) => item.book.id === bookId);
    return found ? found.matchReason : null;
  };

  const deleteMutation = useMutation({
    mutationFn: bookService.deleteBook,
    onSuccess: () => {
      toast.success('Xóa sách thành công');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setBookToDelete(null);
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Không thể xóa sách, vui lòng thử lại sau.'));
      setBookToDelete(null);
    }
  });

  const handleDelete = (id: string, title: string) => {
    setBookToDelete({ id, title });
  };

  const handleOpenEdit = (book: Book) => {
    setEditingBook(book);
    setIsFormOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingBook(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingBook(null);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setIsAiMode(false);
    aiSearchMutation.reset();
  };

  const hasActiveFilters = searchQuery.trim() !== '' || categoryFilter !== 'all' || statusFilter !== 'all' || isAiMode;

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
          <RotateCw className="animate-spin text-teal-600" size={16} />
          <span>Đang tải danh mục sách thư viện...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
          <Skeleton className="h-8 w-1/3 rounded-lg" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6">
        <div className="p-8 text-center bg-rose-50/80 border border-rose-200/80 rounded-2xl max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-1">
            <AlertCircle size={24} />
          </div>
          <h3 className="font-bold text-base text-slate-900">Không thể tải dữ liệu danh mục sách</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Vui lòng kiểm tra lại kết nối mạng hoặc phiên đăng nhập của bạn.
          </p>
          <Button
            onClick={() => refetch()}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl h-9 px-4 cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCw size={13} /> Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const availableCount = (books || []).filter(b => b.availableCopies > 0).length;
  const totalBookCount = (books || []).length;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100/80 flex items-center justify-center shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {canManageCatalog ? 'Quản lý danh mục sách' : 'Tra cứu sách thư viện'}
              </h2>
              <Badge variant="outline" className="text-[11px] font-semibold text-teal-700 bg-teal-50 border-teal-200/80">
                {availableCount} / {totalBookCount} sẵn sàng
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {canManageCatalog 
                ? 'Thêm, hiệu chỉnh thông tin, vị trí lưu kho và quản lý số lượng bản sao' 
                : 'Tìm kiếm sách theo tên, tác giả, ISBN, thể loại và tra cứu vị trí kệ sách'}
            </p>
          </div>
        </div>

        {canManageCatalog && (
          <Button 
            onClick={handleOpenCreate}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl h-9 sm:h-10 px-4 shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus size={16} />
            Thêm sách mới
          </Button>
        )}
      </div>

      {/* Search & Filter Controls Section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          {/* Main Keyword Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setIsAiMode(false);
                  aiSearchMutation.reset();
                }
              }}
              placeholder="Tìm theo tên sách, tác giả, ISBN, barcode hoặc thể loại..."
              className="pl-9 pr-8 h-10 bg-slate-50/70 border-slate-200/80 rounded-xl focus-visible:ring-teal-500 text-xs w-full text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsAiMode(false);
                  aiSearchMutation.reset();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                title="Xóa từ khóa"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown Filter */}
          {!isAiMode && categories.length > 0 && (
            <div className="w-full md:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-10 bg-slate-50/70 border-slate-200/80 rounded-xl text-xs text-slate-800 focus-visible:ring-teal-500">
                  <SelectValue placeholder="Tất cả thể loại" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200/80 shadow-lg rounded-xl text-xs">
                  <SelectItem value="all">Tất cả thể loại ({categories.length})</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status Dropdown Filter */}
          {!isAiMode && (
            <div className="w-full md:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 bg-slate-50/70 border-slate-200/80 rounded-xl text-xs text-slate-800 focus-visible:ring-teal-500">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200/80 shadow-lg rounded-xl text-xs">
                  <SelectItem value="all">Tất cả tình trạng</SelectItem>
                  <SelectItem value="available">Còn sách khả dụng</SelectItem>
                  <SelectItem value="out_of_stock">Đã hết sách</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* AI Semantic Search Button */}
          {isLibrarian && (
            <Button
              onClick={handleAiSearch}
              disabled={aiSearchMutation.isPending || searchQuery.trim().length < 3}
              className="h-10 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs px-4 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {aiSearchMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
              AI Tìm ngữ nghĩa
            </Button>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-10 px-3 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl shrink-0 cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <X size={14} className="mr-1" /> Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {(!books || books.length === 0) ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-slate-100">
            <BookOpen size={24} />
          </div>
          <p className="font-bold text-slate-800 text-sm">Chưa có sách trong hệ thống thư viện</p>
          <p className="text-xs text-slate-400">Sử dụng nút "Thêm sách mới" ở góc phải phía trên để bổ sung đầu sách.</p>
        </div>
      ) : (
        <>
          {/* AI Mode Notice Banner */}
          {isAiMode && (
            <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-xl text-xs text-teal-900 font-medium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="text-teal-600 shrink-0" size={16} />
                <span>
                  Đang hiển thị kết quả tìm kiếm ngữ nghĩa AI cho: <strong className="text-teal-950 font-bold">"{searchQuery}"</strong>
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsAiMode(false);
                  aiSearchMutation.reset();
                }}
                className="h-7 text-teal-800 hover:text-teal-950 hover:bg-teal-100 font-semibold text-[11px] px-2.5 rounded-lg border border-teal-200/80 self-start sm:self-auto cursor-pointer"
              >
                Quay lại danh mục thông thường
              </Button>
            </div>
          )}

          {displayedBooks.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-slate-100">
                <Search size={24} />
              </div>
              <p className="font-bold text-slate-800 text-sm">Không tìm thấy sách phù hợp</p>
              <p className="text-xs text-slate-400">Hãy thử thay đổi từ khóa hoặc xóa bớt tiêu chí bộ lọc.</p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="mt-2 text-xs font-semibold rounded-xl border-slate-200/80 text-slate-700 hover:bg-slate-50"
                >
                  Xóa toàn bộ bộ lọc
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              {/* Header Bar of Table */}
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>{isAiMode ? "Kết quả tìm kiếm AI" : "Danh mục sách"}</span>
                  <span className="text-xs font-normal text-slate-400">({displayedBooks.length} đầu sách)</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold bg-white text-slate-600 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                    Sẵn có: {displayedBooks.filter(b => b.availableCopies > 0).length} / {displayedBooks.length} cuốn
                  </span>
                </div>
              </div>
              
              {/* Desktop Table View (Hidden on mobile < md) */}
              <div className="hidden md:block w-full overflow-x-auto">
                <Table className="min-w-full w-full">
                  <TableHeader className="bg-slate-50/80 border-b border-slate-200/80">
                    <TableRow>
                      <TableHead className="font-bold text-slate-700 uppercase text-[11px] tracking-wider w-[130px] pl-5">ISBN</TableHead>
                      <TableHead className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">Tên sách & Tác giả</TableHead>
                      <TableHead className="font-bold text-slate-700 uppercase text-[11px] tracking-wider w-[140px]">Thể loại</TableHead>
                      <TableHead className="font-bold text-slate-700 uppercase text-[11px] tracking-wider text-right w-[90px]">Tổng số</TableHead>
                      <TableHead className="font-bold text-slate-700 uppercase text-[11px] tracking-wider text-right w-[90px]">Còn lại</TableHead>
                      <TableHead className="font-bold text-slate-700 uppercase text-[11px] tracking-wider text-center w-[110px]">Trạng thái</TableHead>
                      <TableHead className="font-bold text-slate-700 uppercase text-[11px] tracking-wider text-center w-[150px] pr-5">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedBooks.map(book => {
                      const isAvailable = book.availableCopies > 0;
                      return (
                        <TableRow key={book.id} className="hover:bg-slate-50/70 transition-colors text-xs border-b border-slate-100">
                          <TableCell className="font-mono text-xs font-semibold text-slate-600 pl-5 truncate" title={book.isbn}>
                            {book.isbn}
                          </TableCell>
                          <TableCell className="py-3 text-slate-900">
                            <div className="flex items-start gap-3">
                              <BookCoverImage 
                                src={book.coverUrl} 
                                title={book.title} 
                                className="w-10 h-14 rounded-lg shadow-xs border border-slate-200/70 shrink-0 mt-0.5 object-cover" 
                              />
                              <div className="space-y-1 min-w-0">
                                <div className="line-clamp-1 font-bold text-slate-900 text-xs" title={book.title}>
                                  {book.title}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium truncate max-w-[280px]" title={book.author}>
                                  {book.author}
                                </div>
                                <div className="flex flex-wrap gap-1 items-center pt-0.5">
                                  <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-100/80 px-1.5 py-0.5 rounded font-mono font-medium">
                                    BC: {book.barcode || book.isbn || book.id}
                                  </span>
                                  {book.shelf && (
                                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100/80 px-1.5 py-0.5 rounded font-medium">
                                      Kệ: {book.shelf}
                                    </span>
                                  )}
                                </div>
                                {(() => {
                                  const reason = getAiMatchReason(book.id);
                                  return reason ? (
                                    <div className="mt-1 p-1.5 bg-teal-50 border border-teal-100/80 rounded-lg text-teal-800 text-[10px] leading-tight flex items-start gap-1 max-w-[320px]">
                                      <Sparkles size={11} className="text-teal-600 shrink-0 mt-0.5" />
                                      <span>AI: {reason}</span>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium text-[11px] text-teal-700 bg-teal-50 border-teal-200/80 whitespace-nowrap">
                              {book.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-600">
                            {book.totalCopies}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900">
                            {book.availableCopies}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={isAvailable 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100 text-[10px] font-semibold" 
                              : "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100 text-[10px] font-semibold"
                            }>
                              {isAvailable ? "Còn sách" : "Hết sách"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center pr-5">
                            <div className="flex items-center justify-center gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedDetailBook(book)}
                                title="Xem chi tiết sách"
                                className="text-teal-700 hover:text-teal-800 border-teal-200/80 hover:bg-teal-50 text-xs font-semibold h-8 px-2.5 rounded-lg cursor-pointer"
                              >
                                <Eye size={13} className="mr-1" /> Chi tiết
                              </Button>
                              
                              {canManageCatalog && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleOpenEdit(book)}
                                    title="Sửa thông tin"
                                    className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 w-8 h-8 rounded-lg cursor-pointer"
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDelete(book.id, book.title)}
                                    title="Xóa sách"
                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 w-8 h-8 rounded-lg cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View (Visible on screens < md, prevents horizontal table overflow) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {displayedBooks.map(book => {
                  const isAvailable = book.availableCopies > 0;
                  const reason = getAiMatchReason(book.id);
                  return (
                    <div key={book.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <BookCoverImage 
                          src={book.coverUrl} 
                          title={book.title} 
                          className="w-14 h-20 rounded-lg shadow-xs border border-slate-200/80 shrink-0 object-cover" 
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                              {book.title}
                            </h4>
                            <Badge className={isAvailable 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 text-[10px] font-semibold shrink-0" 
                              : "bg-rose-50 text-rose-700 border-rose-200/80 text-[10px] font-semibold shrink-0"
                            }>
                              {isAvailable ? "Còn sách" : "Hết sách"}
                            </Badge>
                          </div>
                          
                          <p className="text-[11px] text-slate-500 truncate">
                            {book.author}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <Badge variant="outline" className="text-[10px] font-medium text-teal-700 bg-teal-50 border-teal-200/80">
                              {book.category}
                            </Badge>
                            {book.shelf && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-medium">
                                Kệ: {book.shelf}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {reason && (
                        <div className="p-2 bg-teal-50 border border-teal-100 rounded-lg text-teal-800 text-[10px] leading-tight flex items-start gap-1">
                          <Sparkles size={11} className="text-teal-600 shrink-0 mt-0.5" />
                          <span>AI: {reason}</span>
                        </div>
                      )}

                      {/* Stock Info & Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-xs">
                        <div className="text-[11px] text-slate-500">
                          ISBN: <span className="font-mono text-slate-700 font-semibold">{book.isbn}</span>
                          <span className="mx-1.5 text-slate-300">•</span>
                          Khả dụng: <span className="font-bold text-slate-900">{book.availableCopies} / {book.totalCopies}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedDetailBook(book)}
                            className="text-teal-700 border-teal-200/80 hover:bg-teal-50 text-xs font-semibold h-8 px-2.5 rounded-lg cursor-pointer"
                          >
                            <Eye size={13} className="mr-1" /> Xem
                          </Button>
                          
                          {canManageCatalog && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleOpenEdit(book)}
                                className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 w-8 h-8 rounded-lg cursor-pointer"
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(book.id, book.title)}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 w-8 h-8 rounded-lg cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        if (!open) {
          setIsFormOpen(false);
          setEditingBook(null);
        }
      }}>
        <DialogContent className="max-w-lg rounded-2xl p-5 sm:p-6 bg-white border border-slate-200/80 shadow-xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-100/80 flex items-center justify-center shrink-0">
                <Library size={18} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  {editingBook ? 'Cập nhật thông tin sách' : 'Thêm sách mới vào thư viện'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  {editingBook 
                    ? 'Chỉnh sửa các trường dữ liệu và số lượng của đầu sách hiện tại' 
                    : 'Nhập thông tin mới hoặc sử dụng AI Copilot để tự động hoàn thành từ mã ISBN'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <BookForm 
            book={editingBook} 
            onSuccess={handleFormSuccess} 
            onCancel={() => {
              setIsFormOpen(false);
              setEditingBook(null);
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Book Details Dialog */}
      {selectedDetailBook && (
        <Dialog open={selectedDetailBook !== null} onOpenChange={() => setSelectedDetailBook(null)}>
          <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6 bg-white border border-slate-200/80 shadow-xl">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {selectedDetailBook.title}
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold text-teal-700">
                Tác giả: {selectedDetailBook.author}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="flex gap-4 items-start">
                {/* Left Column: Big Cover */}
                <div className="shrink-0 shadow-xs rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50">
                  <BookCoverImage 
                    src={selectedDetailBook.coverUrl} 
                    title={selectedDetailBook.title} 
                    className="w-24 h-36 sm:w-28 sm:h-40 rounded-xl object-cover" 
                  />
                </div>

                {/* Right Column: Key info */}
                <div className="flex-1 grid grid-cols-1 gap-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mã ISBN</span>
                    <span className="text-xs font-mono text-slate-800 font-semibold">{selectedDetailBook.isbn}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mã Barcode / QR</span>
                    <span className="text-xs font-mono text-teal-700 font-bold">
                      {selectedDetailBook.barcode || selectedDetailBook.isbn || selectedDetailBook.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Thể loại</span>
                    <span className="text-xs text-slate-800 font-semibold">{selectedDetailBook.category}</span>
                  </div>
                  {selectedDetailBook.publisher && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nhà xuất bản</span>
                      <span className="text-xs text-slate-700 font-medium truncate max-w-[170px] block" title={selectedDetailBook.publisher}>
                        {selectedDetailBook.publisher}
                      </span>
                    </div>
                  )}
                  {selectedDetailBook.shelf && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vị trí kệ sách</span>
                      <span className="text-xs text-amber-800 font-medium">{selectedDetailBook.shelf}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedDetailBook.description && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mô tả tóm tắt</span>
                  <p className="text-xs text-slate-600 bg-slate-50/60 p-3 rounded-xl border border-slate-100 leading-relaxed italic">
                    "{selectedDetailBook.description}"
                  </p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tình trạng sách</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${selectedDetailBook.availableCopies > 0 ? "bg-emerald-500" : "bg-rose-500"}`}></span> 
                    <span className="text-xs font-bold text-slate-800">
                      {selectedDetailBook.availableCopies > 0 ? "Còn sách khả dụng" : "Đã hết sách khả dụng"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sẵn có / Tổng số</span>
                  <span className="text-xs font-extrabold text-teal-700 block mt-0.5">
                    {selectedDetailBook.availableCopies} / {selectedDetailBook.totalCopies} cuốn
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button 
                onClick={() => setSelectedDetailBook(null)} 
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl h-9 px-5 cursor-pointer"
              >
                Đóng chi tiết
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {bookToDelete && (
        <Dialog open={bookToDelete !== null} onOpenChange={() => setBookToDelete(null)}>
          <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6 bg-white border border-slate-200/80 shadow-xl">
            <DialogHeader className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
                <AlertTriangle size={22} />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Xác nhận xóa sách
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1.5 max-w-xs">
                Bạn có chắc chắn muốn xóa đầu sách <strong className="text-slate-800">"{bookToDelete.title}"</strong> khỏi hệ thống thư viện không? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 flex flex-col sm:flex-row gap-2.5 justify-center w-full">
              <Button
                variant="outline"
                onClick={() => setBookToDelete(null)}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto h-9 border-slate-200/80 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={() => deleteMutation.mutate(bookToDelete.id)}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto h-9 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs min-w-[110px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {deleteMutation.isPending ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
                Xác nhận xóa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};


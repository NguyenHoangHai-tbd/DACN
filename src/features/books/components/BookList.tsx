import React, { useState } from 'react';
import { BookCoverImage } from './BookCoverImage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookService } from '../services/bookService';
import { searchService } from '../../search/services/searchService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { BookOpen, Library, Plus, Pencil, Trash2, Eye, Search, Sparkles, Loader2, X, AlertTriangle } from 'lucide-react';
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
  const [isAiMode, setIsAiMode] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{ id: string; title: string } | null>(null);

  const { data: books, isLoading, isError } = useQuery({
    queryKey: ['books'],
    queryFn: bookService.getBooks
  });

  const aiSearchMutation = useMutation({
    mutationFn: searchService.aiSearch,
    onSuccess: () => {
      setIsAiMode(true);
    },
    onError: (error: any) => {
      toast.error('AI tìm kiếm ngữ nghĩa thất bại. Vui lòng thử lại sau.');
    }
  });

  const handleAiSearch = () => {
    if (searchQuery.trim().length >= 3) {
      aiSearchMutation.mutate(searchQuery);
    }
  };

  // Filter books locally for standard search
  const filteredBooks = React.useMemo(() => {
    if (!books) return [];
    if (!searchQuery.trim() || isAiMode) return books;
    const q = searchQuery.toLowerCase().trim();
    return books.filter(book => {
      return (
        (book.title || '').toLowerCase().includes(q) ||
        (book.author || '').toLowerCase().includes(q) ||
        (book.isbn || '').toLowerCase().includes(q) ||
        (book.barcode || '').toLowerCase().includes(q) ||
        (book.category || '').toLowerCase().includes(q)
      );
    });
  }, [books, searchQuery, isAiMode]);

  const displayedBooks = React.useMemo(() => {
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

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="text-sm font-medium text-slate-500 animate-pulse flex items-center gap-2">
          <Library className="animate-spin text-indigo-600" size={16} />
          Đang tải danh sách sách... Vui lòng đợi trong giây lát.
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-red-600 bg-red-50 rounded-xl border border-red-100 font-medium m-6">
        Không thể tải dữ liệu danh sách sách. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
            <BookOpen className="text-indigo-600" />
            {canManageCatalog ? 'Quản lý sách' : 'Danh mục sách'}
          </h2>
          <p className="text-sm text-slate-500">
            {canManageCatalog 
              ? 'Thêm, sửa, xóa và theo dõi tình trạng sách trong thư viện' 
              : 'Tra cứu thông tin sách, số lượng còn lại và vị trí kệ sách'}
          </p>
        </div>
        {canManageCatalog && (
          <Button 
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold rounded-xl h-11 shrink-0 px-5 shadow-lg shadow-indigo-500/10"
          >
            <Plus size={18} />
            Thêm sách
          </Button>
        )}
      </div>

      {/* Search & AI Section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
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
            className="pl-9 h-11 bg-slate-50/50 border-slate-200 rounded-xl focus-visible:ring-indigo-500 font-medium text-xs w-full"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsAiMode(false);
                aiSearchMutation.reset();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        {isLibrarian && (
          <Button
            onClick={handleAiSearch}
            disabled={aiSearchMutation.isPending || searchQuery.trim().length < 3}
            className="w-full sm:w-auto h-11 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold rounded-xl shadow-md px-5 shrink-0 flex items-center justify-center gap-1.5 transition-all active:scale-95 text-xs disabled:opacity-50"
          >
            {aiSearchMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
            AI Tìm kiếm ngữ nghĩa
          </Button>
        )}
      </div>

      {(!books || books.length === 0) ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <BookOpen className="mx-auto text-slate-300 mb-2 animate-bounce" size={40} />
          <p className="font-semibold text-slate-700">Chưa có sách trong hệ thống</p>
          <p className="text-xs text-slate-400 mt-1">Sử dụng nút "Thêm sách" ở trên để điền thêm đầu sách mới.</p>
        </div>
      ) : (
        <>
          {/* AI Mode notice bar */}
          {isAiMode && (
            <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-800 font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-violet-600 font-bold animate-pulse" size={16} />
                <span>
                  Đang hiển thị kết quả tìm kiếm ngữ nghĩa bằng AI cho từ khóa: <strong className="text-violet-950 font-bold">"{searchQuery}"</strong>
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsAiMode(false);
                  aiSearchMutation.reset();
                }}
                className="h-7 text-violet-700 hover:text-violet-800 hover:bg-violet-100 font-bold text-[11px] px-2.5 rounded-lg border border-violet-200/50"
              >
                Quay lại danh mục thông thường
              </Button>
            </div>
          )}

          {displayedBooks.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <Search className="mx-auto text-slate-300 mb-2 animate-pulse" size={40} />
              <p className="font-semibold text-slate-700">Không tìm thấy sách phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">Hãy thử tìm với các từ khóa hoặc thông tin khác.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">
                  {isAiMode ? "Kết Quả Tìm Kiếm AI" : "Danh Mục Sách Thư Viện"} ({displayedBooks.length})
                </h3>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs">
                  Mức độ phủ: {displayedBooks.filter(b => b.availableCopies > 0).length} / {displayedBooks.length} đầu sách sẵn sàng
                </Badge>
              </div>
              
              <div className="w-full overflow-x-auto bg-white">
                <Table className="min-w-[850px] table-fixed">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[140px]">ISBN</TableHead>
                      <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[320px]">Sách & Tác giả</TableHead>
                      <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider w-[130px]">Thể Loại</TableHead>
                      <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider text-right w-[90px]">Tổng số</TableHead>
                      <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider text-right w-[90px]">Còn lại</TableHead>
                      <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider text-center w-[110px]">Trạng thái</TableHead>
                      <TableHead className="font-bold text-slate-600 uppercase text-xs tracking-wider text-center w-[160px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedBooks.map(book => {
                      const isAvailable = book.availableCopies > 0;
                      return (
                        <TableRow key={book.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-mono text-xs font-semibold text-slate-600 truncate" title={book.isbn}>
                            {book.isbn}
                          </TableCell>
                          <TableCell className="font-medium text-slate-950">
                            <div className="flex items-start gap-3">
                              <BookCoverImage src={book.coverUrl} title={book.title} className="w-12 h-16 rounded-lg shadow-sm border border-slate-100 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <div className="line-clamp-2 leading-tight font-bold text-slate-900 text-sm" title={book.title}>
                                  {book.title}
                                </div>
                                <div className="text-[11px] text-slate-400 font-semibold truncate max-w-[210px]" title={book.author}>
                                  {book.author}
                                </div>
                                <div className="flex flex-wrap gap-1 items-center mt-1">
                                  <div className="text-[10px] text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-sm inline-block font-mono font-bold">
                                    BC: {book.barcode || book.isbn || book.id}
                                  </div>
                                  {book.shelf && (
                                    <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm inline-block font-bold">
                                      Kệ: {book.shelf}
                                    </div>
                                  )}
                                </div>
                                {(() => {
                                  const reason = getAiMatchReason(book.id);
                                  return reason ? (
                                    <div className="mt-1.5 p-2 bg-violet-50 border border-violet-100 rounded-lg text-violet-800 text-[10px] italic leading-tight flex items-start gap-1 max-w-[280px]">
                                      <Sparkles size={11} className="text-violet-500 shrink-0 mt-0.5" />
                                      <span>AI: "{reason}"</span>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-semibold text-xs text-indigo-700 bg-indigo-50/10 border-indigo-200/50 whitespace-nowrap">
                              {book.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-600">
                            {book.totalCopies}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-800">
                            {book.availableCopies}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={isAvailable ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 text-[10px] font-bold" : "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 text-[10px] font-bold"}>
                              {isAvailable ? "Còn sách" : "Hết sách"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Simple text or styled Button showing "Chi tiết" */}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedDetailBook(book)}
                                title="Xem chi tiết"
                                className="text-indigo-600 hover:text-indigo-700 border-indigo-100 hover:bg-indigo-50/30 text-xs font-bold gap-1 px-2.5 h-8 rounded-lg"
                              >
                                <Eye size={13} /> Chi tiết
                              </Button>
                              
                              {canManageCatalog && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleOpenEdit(book)}
                                    title="Sửa thông tin"
                                    className="text-slate-500 hover:text-amber-600 hover:bg-amber-50 w-8 h-8 rounded-lg"
                                  >
                                    <Pencil size={15} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDelete(book.id, book.title)}
                                    title="Xóa sách"
                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 w-8 h-8 rounded-lg"
                                  >
                                    <Trash2 size={15} />
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
        <DialogContent className="max-w-lg rounded-2xl p-6 bg-white border border-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Library className="text-indigo-600" size={20} />
              {editingBook ? 'Cập nhật thông tin sách' : 'Thêm sách mới vào thư viện'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editingBook ? 'Cập nhật các thông tin của đầu sách hiện tại. ISBN của chính cuốn sách này không tính là trùng.' : 'Nhập thông tin mới hoặc sử dụng AI Copilot để tự động hoàn thành từ mã ISBN.'}
            </DialogDescription>
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

      {/* Book details Dialog */}
      {selectedDetailBook && (
        <Dialog open={selectedDetailBook !== null} onOpenChange={() => setSelectedDetailBook(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-slate-100 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-slate-900 leading-snug">{selectedDetailBook.title}</DialogTitle>
              <DialogDescription className="text-sm font-semibold text-indigo-600 mt-1">Tác giả: {selectedDetailBook.author}</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="flex gap-4 items-start">
                {/* Left Column: Big Cover */}
                <div className="shrink-0 shadow-sm rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <BookCoverImage 
                    src={selectedDetailBook.coverUrl} 
                    title={selectedDetailBook.title} 
                    className="w-28 h-40 rounded-xl" 
                  />
                </div>
                {/* Right Column: Key info */}
                <div className="flex-1 grid grid-cols-1 gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[160px]">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mã ISBN</span>
                    <span className="text-xs font-mono text-slate-800 font-semibold">{selectedDetailBook.isbn}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mã Barcode / QR</span>
                    <span className="text-xs font-mono text-indigo-700 font-bold">{selectedDetailBook.barcode || selectedDetailBook.isbn || selectedDetailBook.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Thể loại</span>
                    <span className="text-xs text-slate-800 font-semibold">{selectedDetailBook.category}</span>
                  </div>
                  {selectedDetailBook.publisher && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nhà xuất bản</span>
                      <span className="text-xs text-slate-700 font-medium truncate max-w-[180px] block" title={selectedDetailBook.publisher}>
                        {selectedDetailBook.publisher}
                      </span>
                    </div>
                  )}
                  {selectedDetailBook.shelf && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vị trí kệ sách</span>
                      <span className="text-xs text-slate-700 font-medium">{selectedDetailBook.shelf}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedDetailBook.description && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mô tả tóm tắt</span>
                  <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed italic">
                    "{selectedDetailBook.description}"
                  </p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Tình trạng sách</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${selectedDetailBook.availableCopies > 0 ? "bg-emerald-500" : "bg-rose-500"}`}></span> 
                    <span className="text-sm font-bold text-slate-700">
                      {selectedDetailBook.availableCopies > 0 ? "Còn sách khả dụng" : "Đã hết sách khả dụng"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Sẵn có / Tổng số bản</span>
                  <span className="text-sm font-extrabold text-indigo-600 block mt-1">{selectedDetailBook.availableCopies} / {selectedDetailBook.totalCopies}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedDetailBook(null)} className="w-full sm:w-auto bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl h-11">
                Đóng chi tiết
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {bookToDelete && (
        <Dialog open={bookToDelete !== null} onOpenChange={() => setBookToDelete(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-slate-100 shadow-xl">
            <DialogHeader className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <AlertTriangle size={24} />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Xác nhận xóa sách
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-2">
                Bạn có chắc chắn muốn xóa đầu sách <strong className="text-slate-800">"{bookToDelete.title}"</strong> khỏi hệ thống thư viện không? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center w-full">
              <Button
                variant="outline"
                onClick={() => setBookToDelete(null)}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto h-11 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={() => deleteMutation.mutate(bookToDelete.id)}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md min-w-[120px] flex items-center justify-center gap-1.5 transition-all active:scale-95 text-xs"
              >
                {deleteMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                Xác nhận xóa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationService } from '../services/recommendationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  Loader2, 
  Bot, 
  Target, 
  Info,
  RefreshCw,
  AlertCircle,
  XCircle,
  Bookmark,
  CheckCircle2,
  Library,
  Flame,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useRoleStore } from '../../../shared/store/roleStore';
import { BookCoverImage } from '../../books/components/BookCoverImage';
import { searchService } from '../../search/services/searchService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export const RecommendationCenter: React.FC = () => {
  const currentRole = useRoleStore(state => state.currentRole);
  const queryClient = useQueryClient();
  const [selectedBook, setSelectedBook] = useState<any | null>(null);

  const { 
    data: books = [], 
    isLoading: loadingBooks, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['bookRecommendations'],
    queryFn: recommendationService.getBookRecommendations
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ id, isPositive }: { id: string, isPositive: boolean }) => 
      recommendationService.sendFeedback(id, isPositive),
    onSuccess: () => {
      toast.success('Đã ghi nhận phản hồi để cải thiện mô hình AI.');
    }
  });

  const holdMutation = useMutation({
    mutationFn: (bookId: string) => searchService.requestHold(bookId),
    onSuccess: () => {
      toast.success('Đặt giữ sách thành công');
      queryClient.invalidateQueries({ queryKey: ['memberHolds'] });
      queryClient.invalidateQueries({ queryKey: ['bookRecommendations'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Đặt giữ sách thất bại');
    }
  });

  return (
    <div className="space-y-6 pb-16">
      {/* 1. VIEW HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-600 shrink-0">
            <Sparkles size={22} className="text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                AI Gợi ý &amp; Đề xuất cá nhân hóa
              </h2>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                AI Powered
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Khám phá tác phẩm phù hợp nhất với sở thích đọc, lịch sử mượn trả và xu hướng học thuật của bạn.
            </p>
          </div>
        </div>

        <Button
          onClick={() => refetch()}
          disabled={loadingBooks}
          variant="outline"
          size="sm"
          className="self-start sm:self-auto border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs h-9 px-3 shrink-0 gap-1.5 cursor-pointer"
        >
          <RefreshCw size={13} className={loadingBooks ? 'animate-spin text-teal-600' : 'text-slate-500'} />
          <span>Làm mới gợi ý</span>
        </Button>
      </div>

      {/* 2. MAIN RECOMMENDATION CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Target className="text-teal-600" size={20}/>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Danh sách tác phẩm đề xuất cho bạn
            </h3>
          </div>
          {!loadingBooks && !isError && books.length > 0 && (
            <span className="text-xs text-slate-500 font-medium">
              Tìm thấy <strong className="text-teal-700 font-bold">{books.length}</strong> cuốn sách gợi ý
            </span>
          )}
        </div>
        
        {/* 2.1 LOADING STATE */}
        {loadingBooks && (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mb-3">
              <Loader2 className="animate-spin text-teal-600" size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">Đang phân tích và tổng hợp gợi ý AI...</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Hệ thống đang đối chiếu dữ liệu mượn sách và sở thích học liệu để chọn lọc danh sách phù hợp nhất.
            </p>
          </div>
        )}

        {/* 2.2 ERROR STATE */}
        {!loadingBooks && isError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center my-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-sm font-bold text-rose-900">Không thể tải gợi ý sách</h4>
            <p className="text-xs text-rose-700 mt-1 max-w-md">
              {(error as any)?.response?.data?.message || (error as any)?.message || 'Đã xảy ra sự cố trong quá trình kết nối với dịch vụ AI gợi ý.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-4 border-rose-300 text-rose-700 hover:bg-rose-100 font-semibold rounded-xl text-xs h-8 px-3 cursor-pointer"
            >
              <RefreshCw size={12} className="mr-1.5" /> Thử lại ngay
            </Button>
          </div>
        )}

        {/* 2.3 EMPTY STATE */}
        {!loadingBooks && !isError && books.length === 0 && (
          <div className="py-16 text-center border border-slate-200/80 border-dashed rounded-2xl p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <BookOpen size={24} />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <p className="font-bold text-slate-800 text-sm">Chưa đủ dữ liệu để tạo gợi ý</p>
              <p className="text-xs text-slate-500">
                Hãy tiếp tục mượn thêm sách và tìm kiếm các đầu sách bạn yêu thích để AI có thể hiểu rõ hơn về phong cách đọc của bạn.
              </p>
            </div>
          </div>
        )}

        {/* 2.4 BOOK LIST GRID */}
        {!loadingBooks && !isError && books.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {books.map(book => {
              const isAvailable = book.availableCopies > 0;
              const matchPercent = Math.round((book.matchScore || 0.85) * 100);

              return (
                <div 
                  key={book.id} 
                  className="group relative flex flex-col bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-md hover:border-teal-300 transition-all duration-200"
                >
                  {/* Feedback quick buttons */}
                  <div className="absolute top-2.5 right-2.5 z-10 flex gap-1.5">
                    <button 
                      onClick={() => feedbackMutation.mutate({ id: book.id, isPositive: true })} 
                      title="Gợi ý này hữu ích"
                      className="w-8 h-8 rounded-xl bg-white/90 shadow-xs border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-teal-600 hover:bg-teal-50 backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <ThumbsUp size={13}/>
                    </button>
                    <button 
                      onClick={() => feedbackMutation.mutate({ id: book.id, isPositive: false })} 
                      title="Không thích gợi ý này"
                      className="w-8 h-8 rounded-xl bg-white/90 shadow-xs border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-50 backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <ThumbsDown size={13}/>
                    </button>
                  </div>
                  
                  {/* Book cover preview */}
                  <div className="h-44 sm:h-48 bg-slate-50/80 flex items-center justify-center border-b border-slate-100 p-4 shrink-0">
                    <BookCoverImage 
                      src={book.coverUrl || book.coverImage} 
                      title={book.title} 
                      className="h-full max-w-[125px] rounded-xl shadow-xs object-cover border border-slate-100 group-hover:scale-102 transition-transform duration-200" 
                    />
                  </div>

                  {/* Book metadata */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="mb-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md">
                          <Flame size={11} className="text-teal-600" />
                          {matchPercent}% Phù hợp
                        </span>
                        <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 bg-slate-50 text-slate-600 max-w-[120px] truncate">
                          {book.category || 'Tài liệu'}
                        </Badge>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 min-h-[2.5rem]" title={book.title}>
                        {book.title}
                      </h4>
                      <p className="text-xs font-medium text-slate-500 truncate">
                        Tác giả: {book.author || 'Đang cập nhật'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        ISBN: {book.isbn || 'N/A'}
                      </p>
                    </div>
                    
                    {/* Recommendation reason */}
                    <div className="mt-auto pt-3 border-t border-slate-100 space-y-3">
                      <div className="text-xs text-slate-600 flex items-start gap-2 bg-teal-50/50 p-2.5 rounded-xl border border-teal-100/60 leading-relaxed">
                        <Sparkles size={14} className="text-teal-600 shrink-0 mt-0.5"/> 
                        <span className="text-[11px] sm:text-xs italic text-slate-700 line-clamp-3">
                          {book.reason || 'Được đề xuất dựa trên sở thích và xu hướng bạn quan tâm.'}
                        </span>
                      </div>

                      {/* Availability status */}
                      <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100/70">
                        <span className="text-slate-500 font-medium">Bản khả dụng:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className={`font-bold ${isAvailable ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {book.availableCopies} / {book.totalCopies || book.availableCopies || 0} bản
                          </span>
                        </div>
                      </div>

                      {/* Role-based action button */}
                      {currentRole === 'member' && (
                        isAvailable ? (
                          <Button 
                            variant="outline"
                            onClick={() => setSelectedBook(book)}
                            className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 font-semibold rounded-xl text-xs h-9 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Info size={14} /> 
                            <span>Xem chi tiết mượn</span>
                          </Button>
                        ) : (
                          <Button 
                            type="button"
                            onClick={() => holdMutation.mutate(book.bookId)}
                            disabled={holdMutation.isPending}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs h-9 flex items-center justify-center gap-1.5 shadow-sm shadow-teal-600/20 cursor-pointer"
                          >
                            {holdMutation.isPending ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Bookmark size={14} />
                            )}
                            <span>Đặt giữ sách</span>
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. BOOK DETAIL DIALOG */}
      {selectedBook && (
        <Dialog open={selectedBook !== null} onOpenChange={() => setSelectedBook(null)}>
          <DialogContent className="max-w-lg rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl">
            <DialogHeader className="pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-600">
                <BookOpen size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Thông tin tài liệu đề xuất</span>
              </div>
            </DialogHeader>

            <div className="flex flex-col sm:flex-row gap-5 mt-3">
              <div className="flex justify-center shrink-0">
                <BookCoverImage 
                  src={selectedBook.coverUrl || selectedBook.coverImage} 
                  title={selectedBook.title} 
                  className="w-[120px] h-[175px] rounded-xl shadow-sm border border-slate-200 object-cover" 
                />
              </div>

              <div className="flex-1 space-y-3.5">
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900 leading-snug">
                    {selectedBook.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs font-semibold text-teal-700 mt-1">
                    Tác giả: {selectedBook.author || 'Đang cập nhật'}
                  </DialogDescription>
                </div>

                <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ISBN</span>
                    <span className="text-xs font-mono text-slate-800 font-semibold">{selectedBook.isbn || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Thể loại</span>
                    <span className="text-xs text-slate-800 font-semibold">{selectedBook.category || 'N/A'}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tình trạng</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${selectedBook.availableCopies > 0 ? "bg-emerald-500" : "bg-rose-500"}`}></span> 
                      <span className="font-bold text-slate-800">
                        {selectedBook.availableCopies > 0 ? "Còn sách khả dụng" : "Tạm hết sách"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Khả dụng / Tổng</span>
                    <span className="font-bold text-teal-700 mt-0.5 block">
                      {selectedBook.availableCopies} / {selectedBook.totalCopies || selectedBook.availableCopies || 0} bản
                    </span>
                  </div>
                </div>

                {currentRole === 'member' && (
                  <div className="pt-2">
                    <Button
                      className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold rounded-xl text-xs h-9 cursor-pointer"
                      onClick={() => {
                        toast.info("Sách còn bản khả dụng, vui lòng đến quầy thư viện để hoàn tất thủ tục mượn");
                      }}
                    >
                      <Library size={14} className="mr-1.5" /> Đến quầy mượn sách
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button 
                onClick={() => setSelectedBook(null)} 
                variant="outline" 
                className="w-full sm:w-auto border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs h-9 px-4 cursor-pointer"
              >
                Đóng
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { BookCoverImage } from '../../books/components/BookCoverImage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { searchService } from '../services/searchService';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useRoleStore } from '../../../shared/store/roleStore';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, BookOpen, Loader2, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const SearchInterface: React.FC = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const currentRole = useRoleStore(state => state.currentRole);
  const queryClient = useQueryClient();

  // Standard search - always enabled so books load immediately by default or whenever query changes
  const { data: standardResults, isLoading: isSearchLoading, isError: isSearchError } = useQuery({
    queryKey: ['books', 'search', debouncedQuery],
    queryFn: () => searchService.searchBooks({ query: debouncedQuery }),
    enabled: true,
    staleTime: 30000,
  });

  // AI Search
  const aiSearchMutation = useMutation({
    mutationFn: searchService.aiSearch
  });

  const holdMutation = useMutation({
    mutationFn: (bookId: string) => searchService.requestHold(bookId),
    onSuccess: () => {
      toast.success('Đặt giữ sách thành công');
      queryClient.invalidateQueries({ queryKey: ['memberHolds'] });
      queryClient.invalidateQueries({ queryKey: ['books', 'search'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedBook(null);
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.message || 'Không thể đặt giữ sách. Vui lòng kiểm tra lại.';
      toast.error(errorMsg);
    }
  });

  const handleAiSearch = () => {
    if (query.trim().length > 2) {
      aiSearchMutation.mutate(query);
    }
  };

  const hasStandardResults = standardResults && standardResults.length > 0;
  const hasAiResults = aiSearchMutation.isSuccess && aiSearchMutation.data && aiSearchMutation.data.length > 0;
  const isTyping = query !== debouncedQuery;
  const standardLoading = isSearchLoading || isTyping;

  return (
    <div className="flex flex-col bg-slate-50 relative min-h-0 overflow-visible">
      {/* Search Header */}
      <div className="p-6 transition-all duration-300">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <BookOpen className="text-indigo-600" />
          {t('book.search.title', 'Tìm kiếm & Tra cứu sách')}
        </h2>
        
        <div className="flex gap-3 relative max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                aiSearchMutation.reset();
              }}
              placeholder={t('book.search.placeholder', 'Tìm theo tên sách, tác giả, ISBN, thể loại...')}
              className="pl-11 h-14 rounded-2xl bg-white border-slate-200 shadow-sm text-base focus-visible:ring-indigo-500 transition-all font-medium"
            />
          </div>
          <Button 
            onClick={handleAiSearch}
            disabled={aiSearchMutation.isPending || query.trim().length < 3}
            className="h-14 rounded-2xl px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-200/50 flex gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            {aiSearchMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            <span className="hidden sm:inline">{t('book.search.ai_search_button', 'AI Tìm kiếm ngữ nghĩa')}</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 px-6 pb-16 overflow-visible">
        {/* Loading State */}
        {standardLoading && !aiSearchMutation.isSuccess && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 mt-10">
            <Loader2 className="animate-spin mb-4 text-indigo-500" size={32} />
            <p className="font-semibold text-slate-600">Đang tải danh sách sách...</p>
          </div>
        )}

        {/* Error State */}
        {isSearchError && !standardLoading && !aiSearchMutation.isSuccess && (
          <div className="flex flex-col items-center justify-center p-12 text-rose-500 mt-10 p-6 bg-white rounded-2xl border border-rose-200 border-dashed">
            <p className="font-semibold text-rose-700">Không thể tải danh sách sách</p>
            <p className="text-sm text-slate-500 mt-1">Đã xảy ra lỗi khi kết nối đến hệ thống, vui lòng thử lại sau.</p>
          </div>
        )}

        {/* AI Results */}
        {aiSearchMutation.isSuccess && hasAiResults && (
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-violet-500" size={18} />
              <h3 className="font-bold tracking-tight text-slate-800 text-lg">Kết quả tìm kiếm AI</h3>
            </div>
            <div className="grid gap-4">
              {aiSearchMutation.data.map((result) => {
                const isAvailable = result.book.availableCopies > 0;
                return (
                  <div 
                    key={result.book.id} 
                    onClick={() => setSelectedBook(result.book)}
                    className="bg-white border border-violet-100 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-violet-300 transition-colors cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10">
                      <Sparkles size={100} />
                    </div>
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <BookCoverImage src={result.book.coverUrl} title={result.book.title} className="w-16 h-20 rounded-xl shadow-sm border border-slate-100 shrink-0" />
                      <div className="flex-1 ml-4">
                        <h4 className="font-bold text-slate-900 text-lg flex flex-wrap items-center gap-2">
                          {result.book.title}
                        </h4>
                        <p className="text-sm font-medium text-slate-500 mb-1">{result.book.author}</p>
                        <Badge className={isAvailable ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100"}>
                          {isAvailable ? "Còn sách" : "Hết sách"} ({result.book.availableCopies}/{result.book.totalCopies})
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-violet-50/50 rounded-xl p-3 border border-violet-100/50 mb-4 relative z-10">
                      <p className="text-xs font-semibold text-violet-800 mb-1 flex items-center gap-1">
                        <Sparkles size={12} /> {t('book.search.match_reason', 'Lý do phù hợp (AI)')}
                      </p>
                      <p className="text-sm text-slate-700 italic leading-relaxed">"{result.matchReason}"</p>
                    </div>
                    <div className="flex justify-between items-center relative z-10" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] text-slate-500 border-slate-200">
                          ISBN: {result.book.isbn}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-indigo-600 bg-indigo-50 border-indigo-100">
                          {result.book.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentRole === 'member' && (
                          isAvailable ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs py-1 h-7 rounded-lg"
                              onClick={() => {
                                toast.info("Sách còn bản khả dụng, vui lòng đến quầy thư viện để mượn");
                              }}
                            >
                              Đến quầy mượn
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={holdMutation.isPending}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-1 h-7 rounded-lg"
                              onClick={() => {
                                holdMutation.mutate(result.book.id);
                              }}
                            >
                              {holdMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : "Đặt giữ"}
                            </Button>
                          )
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold text-xs gap-1 py-1 h-7 rounded-lg"
                          onClick={() => setSelectedBook(result.book)}
                        >
                          <Info size={12} /> Chi tiết
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Standard Results */}
        {!aiSearchMutation.isSuccess && !standardLoading && !isSearchError && hasStandardResults && (
          <div className="space-y-4">
            <h3 className="font-bold tracking-tight text-slate-600 text-xs uppercase tracking-wider">
              {query.trim().length > 0 ? "Kết quả tìm kiếm" : "Tất cả sách trong hệ thống"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {standardResults.map((book) => {
                const isAvailable = book.availableCopies > 0;
                return (
                  <div 
                    key={book.id} 
                    onClick={() => setSelectedBook(book)}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col h-full cursor-pointer hover:shadow-md group"
                  >
                     <div className="flex gap-4">
                        <BookCoverImage src={book.coverUrl} title={book.title} className="w-16 h-20 rounded-xl shadow-sm border border-slate-100 shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors mb-1">{book.title}</h4>
                          <p className="text-sm font-medium text-slate-500 mb-2">{book.author}</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-[10px] text-slate-500 border-slate-200">
                              ISBN: {book.isbn}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] text-indigo-600 bg-indigo-50 border-indigo-100">
                              {book.category}
                            </Badge>
                          </div>
                        </div>
                     </div>
                     <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between mt-auto" onClick={(e) => e.stopPropagation()}>
                       <div className="flex items-center gap-1.5">
                         <BookOpen size={16} className={isAvailable ? "text-emerald-500" : "text-rose-400"} />
                         <span className={`text-xs font-bold ${isAvailable ? "text-emerald-700" : "text-rose-600"}`}>
                            {isAvailable ? "Còn sách" : "Hết sách"}: {book.availableCopies} / {book.totalCopies}
                         </span>
                       </div>
                       
                       <div className="flex items-center gap-2">
                         {currentRole === 'member' && (
                           isAvailable ? (
                             <Button
                               size="sm"
                               variant="outline"
                               className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs py-1 h-7 rounded-lg"
                               onClick={() => {
                                 toast.info("Sách còn bản khả dụng, vui lòng đến quầy thư viện để mượn");
                               }}
                             >
                               Đến quầy mượn
                             </Button>
                           ) : (
                             <Button
                               size="sm"
                               disabled={holdMutation.isPending}
                               className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-1 h-7 rounded-lg"
                               onClick={() => {
                                 holdMutation.mutate(book.id);
                               }}
                             >
                               {holdMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : "Đặt giữ"}
                             </Button>
                           )
                         )}
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold text-xs gap-1 py-1 h-7 rounded-lg"
                           onClick={() => setSelectedBook(book)}
                         >
                            <Info size={12} /> Chi tiết
                         </Button>
                       </div>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* State: No Results */}
        {!aiSearchMutation.isSuccess && !standardLoading && !isSearchError && !hasStandardResults && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 mt-10 p-6 bg-white rounded-2xl border border-slate-200 border-dashed">
            <Search size={32} className="mb-3 text-slate-300" />
            <p className="font-medium text-slate-700 mb-1">
              {query.trim().length > 0 ? "Không tìm thấy sách phù hợp" : "Chưa có sách trong hệ thống"}
            </p>
            {query.trim().length > 0 && (
              <p className="text-sm text-center">Vui lòng kiểm tra lại từ khóa hoặc thử sử dụng tính năng <b className="text-indigo-600">AI Tìm kiếm ngữ nghĩa</b>.</p>
            )}
          </div>
        )}
      </div>

      {/* Book details Dialog */}
      {selectedBook && (
        <Dialog open={selectedBook !== null} onOpenChange={() => setSelectedBook(null)}>
          <DialogContent className="max-w-lg rounded-2xl p-6 bg-white border border-slate-100 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-6 mt-2">
              {/* Cover Image */}
              <div className="flex justify-center shrink-0">
                <BookCoverImage 
                  src={selectedBook.coverUrl} 
                  title={selectedBook.title} 
                  className="w-[120px] h-[180px] rounded-xl shadow-md border border-slate-200" 
                />
              </div>

              {/* Text content details */}
              <div className="flex-1 space-y-4">
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 leading-snug">{selectedBook.title}</DialogTitle>
                  <DialogDescription className="text-sm font-medium text-indigo-600 mt-1">
                    Tác giả: {selectedBook.author}
                  </DialogDescription>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ISBN</span>
                    <span className="text-xs font-mono text-slate-700 font-semibold">{selectedBook.isbn}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Thể loại</span>
                    <span className="text-xs text-slate-700 font-semibold">{selectedBook.category}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Tình trạng sách</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${selectedBook.availableCopies > 0 ? "bg-emerald-500" : "bg-rose-500"}`}></span> 
                      <span className="text-xs font-bold text-slate-700">
                        {selectedBook.availableCopies > 0 ? "Còn sách" : "Hết sách"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-medium">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Bản khả dụng / Tổng số</span>
                    <span className="text-xs font-bold text-slate-800 mt-1 block">{selectedBook.availableCopies} / {selectedBook.totalCopies}</span>
                  </div>
                </div>

                {/* Member buttons inside dialog */}
                {currentRole === 'member' && (
                  <div className="pt-2">
                    {selectedBook.availableCopies > 0 ? (
                      <Button
                        className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-sm"
                        onClick={() => {
                          toast.info("Sách còn bản khả dụng, vui lòng đến quầy thư viện để mượn");
                        }}
                      >
                        Đến quầy mượn
                      </Button>
                    ) : (
                      <Button
                        disabled={holdMutation.isPending}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm gap-2"
                        onClick={() => {
                          holdMutation.mutate(selectedBook.id);
                        }}
                      >
                        {holdMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                        Đặt giữ
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={() => setSelectedBook(null)} variant="outline" className="w-full sm:w-auto border-slate-200 hover:bg-slate-50 font-semibold rounded-xl">
                Đóng
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

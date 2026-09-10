import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationService } from '../services/recommendationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, ThumbsUp, ThumbsDown, Loader2, Bot, Target, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useRoleStore } from '../../../shared/store/roleStore';
import { BookCoverImage } from '../../books/components/BookCoverImage';
import { searchService } from '../../search/services/searchService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export const RecommendationCenter: React.FC = () => {
  const currentRole = useRoleStore(state => state.currentRole);
  const queryClient = useQueryClient();
  const [selectedBook, setSelectedBook] = useState<any | null>(null);

  const { data: books = [], isLoading: loadingBooks } = useQuery({
    queryKey: ['bookRecommendations'],
    queryFn: recommendationService.getBookRecommendations
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ id, isPositive }: { id: string, isPositive: boolean }) => recommendationService.sendFeedback(id, isPositive),
    onSuccess: () => {
      toast.success('Đã gửi phản hồi cho AI để cải thiện độ chính xác.');
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
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
               <Bot size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">AI gợi ý & Phân tích</h2>
              <p className="text-sm text-slate-500">Hệ thống gợi ý thông minh dựa trên trí tuệ nhân tạo.</p>
            </div>
         </div>
      </div>

      <div className="w-full">
         <div className="mt-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                 <div className="flex items-center gap-2 mb-6">
                    <Target className="text-indigo-500" size={20}/>
                    <h3 className="font-bold text-slate-800 text-lg">Gợi ý tác phẩm hay phù hợp</h3>
                 </div>
                 
                 {loadingBooks ? (
                    <div className="flex justify-center p-12 text-slate-400"><Loader2 className="animate-spin" size={32}/></div>
                 ) : books.length === 0 ? (
                    <div className="text-center p-12 text-slate-400">Chưa đủ dữ liệu để gợi ý.</div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {books.map(book => {
                         const isAvailable = book.availableCopies > 0;
                         return (
                            <div key={book.id} className="group relative flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all hover:border-indigo-200">
                               <div className="absolute top-2 right-2 z-10 flex gap-1">
                                  <button onClick={() => feedbackMutation.mutate({ id: book.id, isPositive: true })} className="w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-400 hover:text-indigo-600 backdrop-blur-sm transition-colors"><ThumbsUp size={14}/></button>
                                  <button onClick={() => feedbackMutation.mutate({ id: book.id, isPositive: false })} className="w-8 h-8 rounded-full bg-white/95 shadow flex items-center justify-center text-slate-400 hover:text-red-500 backdrop-blur-sm transition-colors"><ThumbsDown size={14}/></button>
                               </div>
                               
                               <div className="h-48 bg-slate-50 flex items-center justify-center border-b border-slate-100 p-4 shrink-0">
                                  <BookCoverImage 
                                    src={book.coverUrl || book.coverImage} 
                                    title={book.title} 
                                    className="h-full max-w-[120px] rounded-lg shadow-sm object-cover" 
                                  />
                               </div>

                               <div className="p-5 flex flex-col flex-1">
                                  <div className="mb-3 space-y-2">
                                     <div className="flex items-center justify-between gap-2">
                                        <span className="inline-flex text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm">
                                           {Math.round(book.matchScore * 100)}% Phù hợp
                                        </span>
                                        <Badge variant="outline" className="text-[10px] font-semibold border-slate-200">
                                           {book.category}
                                        </Badge>
                                     </div>
                                     <h4 className="font-bold text-slate-800 leading-tight line-clamp-2 min-h-[2.5rem]">{book.title}</h4>
                                     <p className="text-xs text-slate-500 font-medium">Tác giả: {book.author}</p>
                                     <p className="text-[10px] text-slate-400 font-mono">ISBN: {book.isbn || 'N/A'}</p>
                                  </div>
                                  
                                  <div className="mt-auto pt-3 border-t border-slate-100 space-y-3">
                                     <p className="text-xs text-slate-600 flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100/50 italic leading-relaxed">
                                        <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5"/> 
                                        {book.reason}
                                     </p>

                                     <div className="flex items-center justify-between text-xs py-1">
                                        <span className="text-slate-500 font-medium">Số bản khả dụng:</span>
                                        <span className={`font-bold ${isAvailable ? 'text-emerald-600' : 'text-rose-500'}`}>
                                           {book.availableCopies} / {book.totalCopies || book.availableCopies || 0}
                                        </span>
                                     </div>

                                     {currentRole === 'member' && (
                                        isAvailable ? (
                                           <Button 
                                             variant="outline"
                                             onClick={() => setSelectedBook(book)}
                                             className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl text-xs flex items-center justify-center gap-1"
                                           >
                                              <Info size={14} /> Xem chi tiết
                                           </Button>
                                        ) : (
                                           <Button 
                                             type="button"
                                             onClick={() => holdMutation.mutate(book.bookId)}
                                             disabled={holdMutation.isPending}
                                             className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1"
                                           >
                                              {holdMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                                              Đặt giữ
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
         </div>
      </div>

      {/* Book Detail Dialog */}
      {selectedBook && (
         <Dialog open={selectedBook !== null} onOpenChange={() => setSelectedBook(null)}>
            <DialogContent className="max-w-lg rounded-2xl p-6 bg-white border border-slate-100 shadow-xl">
               <div className="flex flex-col sm:flex-row gap-6 mt-2">
                  <div className="flex justify-center shrink-0">
                     <BookCoverImage 
                        src={selectedBook.coverUrl || selectedBook.coverImage} 
                        title={selectedBook.title} 
                        className="w-[120px] h-[180px] rounded-xl shadow-md border border-slate-200" 
                     />
                  </div>

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
                           <span className="text-xs font-mono text-slate-700 font-semibold">{selectedBook.isbn || 'N/A'}</span>
                        </div>
                        <div>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Thể loại</span>
                           <span className="text-xs text-slate-700 font-semibold">{selectedBook.category || 'N/A'}</span>
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
                           <span className="text-xs font-bold text-slate-800 mt-1 block">{selectedBook.availableCopies} / {selectedBook.totalCopies || selectedBook.availableCopies || 0}</span>
                        </div>
                     </div>

                     {currentRole === 'member' && (
                        <div className="pt-2">
                           <Button
                              className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-sm"
                              onClick={() => {
                                 toast.info("Sách còn bản khả dụng, vui lòng đến quầy thư viện để mượn");
                              }}
                           >
                              Đến quầy mượn
                           </Button>
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

import React, { useState, useMemo } from 'react';
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
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  Loader2, 
  Info, 
  Filter, 
  X, 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  ArrowUpDown, 
  RefreshCw,
  Library,
  BookMarked,
  Layers
} from 'lucide-react';
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
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'copies'>('title');

  const currentRole = useRoleStore(state => state.currentRole);
  const queryClient = useQueryClient();

  // Standard search - always enabled so books load immediately by default or whenever query changes
  const { data: standardResults, isLoading: isSearchLoading, isError: isSearchError, refetch } = useQuery({
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
      aiSearchMutation.mutate(query.trim());
    }
  };

  const handleResetFilters = () => {
    setQuery('');
    setAvailabilityFilter('all');
    setSelectedCategory('all');
    setSortBy('title');
    aiSearchMutation.reset();
  };

  // Extract unique categories from actual book data
  const categories = useMemo(() => {
    if (!standardResults || !Array.isArray(standardResults)) return [];
    const set = new Set<string>();
    standardResults.forEach((b: any) => {
      if (b.category && typeof b.category === 'string') {
        set.add(b.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [standardResults]);

  // Client-side availability counts
  const counts = useMemo(() => {
    if (!standardResults || !Array.isArray(standardResults)) {
      return { total: 0, available: 0, unavailable: 0 };
    }
    const available = standardResults.filter((b: any) => (b.availableCopies || 0) > 0).length;
    return {
      total: standardResults.length,
      available,
      unavailable: standardResults.length - available
    };
  }, [standardResults]);

  // Filter and sort books based on active user filters
  const displayedBooks = useMemo(() => {
    if (!standardResults || !Array.isArray(standardResults)) return [];
    let list = [...standardResults];

    // Filter by availability
    if (availabilityFilter === 'available') {
      list = list.filter((b: any) => (b.availableCopies || 0) > 0);
    } else if (availabilityFilter === 'unavailable') {
      list = list.filter((b: any) => (b.availableCopies || 0) === 0);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      list = list.filter((b: any) => b.category === selectedCategory);
    }

    // Sort
    list.sort((a: any, b: any) => {
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '', 'vi');
      }
      if (sortBy === 'author') {
        return (a.author || '').localeCompare(b.author || '', 'vi');
      }
      if (sortBy === 'copies') {
        return (b.availableCopies || 0) - (a.availableCopies || 0);
      }
      return 0;
    });

    return list;
  }, [standardResults, availabilityFilter, selectedCategory, sortBy]);

  const hasStandardResults = displayedBooks.length > 0;
  const hasAiResults = aiSearchMutation.isSuccess && aiSearchMutation.data && aiSearchMutation.data.length > 0;
  const isTyping = query !== debouncedQuery;
  const standardLoading = isSearchLoading || isTyping;

  const hasActiveFilters = query.trim().length > 0 || availabilityFilter !== 'all' || selectedCategory !== 'all' || sortBy !== 'title';

  return (
    <div className="w-full flex flex-col bg-slate-50 min-h-full overflow-x-hidden">
      {/* 1. HERO SEARCH BANNER (Harmonized with LandingPage Slate/Teal aesthetic) */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-7 lg:p-8 border border-white/10 shadow-xl overflow-hidden">
          {/* Decorative Teal glow aura */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

          <div className="relative z-10 max-w-4xl">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-teal-300 text-xs sm:text-sm font-semibold mb-3.5 shadow-xs">
              <Sparkles size={14} className="text-teal-400" />
              <span>Nền Tảng Thư Viện Số TBD • Tra Cứu Học Liệu</span>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight mb-2">
              Kho Tri Thức &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-400">Tài Liệu Số</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mb-6">
              Tra cứu nhanh hàng ngàn đầu sách chuyên ngành, giáo trình, ấn phẩm nghiên cứu hoặc tìm kiếm nâng cao bằng trí tuệ nhân tạo.
            </p>

            {/* Unified Search Input Container */}
            <div className="w-full max-w-3xl">
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl sm:rounded-full border border-white/20 shadow-2xl p-1.5 sm:p-2 gap-2 text-left transition-all focus-within:ring-2 focus-within:ring-teal-400">
                <div className="relative flex-1 flex items-center min-w-0">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none shrink-0"
                  />
                  <Input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (aiSearchMutation.isSuccess) {
                        aiSearchMutation.reset();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && query.trim().length > 2) {
                        handleAiSearch();
                      }
                    }}
                    placeholder={t('book.search.placeholder', 'Tìm theo tên sách, tác giả, ISBN, thể loại...')}
                    className="w-full h-11 sm:h-12 pl-12 pr-10 bg-transparent text-slate-900 placeholder:text-slate-400 border-none shadow-none text-sm sm:text-base font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        aiSearchMutation.reset();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                      title="Xóa tìm kiếm"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Search action button group */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    onClick={handleAiSearch}
                    disabled={aiSearchMutation.isPending || query.trim().length < 3}
                    title={query.trim().length < 3 ? 'Nhập từ 3 ký tự để tìm kiếm AI' : 'Tìm kiếm theo ngữ nghĩa với AI'}
                    className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl sm:rounded-full text-xs sm:text-sm transition-all shadow-md shadow-teal-950/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {aiSearchMutation.isPending ? (
                      <Loader2 className="animate-spin text-white" size={16} />
                    ) : (
                      <Sparkles size={16} className="text-teal-200" />
                    )}
                    <span>{t('book.search.ai_search_button', 'AI Ngữ nghĩa')}</span>
                  </Button>
                </div>
              </div>

              {/* Helper text below search input */}
              <div className="flex items-center justify-between mt-2.5 px-2 text-[11px] sm:text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={13} className="text-teal-400" />
                  Hệ thống tự động tra cứu khi nhập từ khóa
                </span>
                {query.trim().length > 0 && query.trim().length < 3 && (
                  <span className="text-amber-400 font-medium">Nhập thêm ký tự để kích hoạt AI</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SORT CONTROL BAR */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs space-y-3">
          {/* Top row: Availability Status Chips & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline-flex items-center gap-1">
                <Filter size={12} className="text-teal-600" /> Lọc:
              </span>

              <button
                type="button"
                onClick={() => setAvailabilityFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  availabilityFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Tất cả ({counts.total})
              </button>

              <button
                type="button"
                onClick={() => setAvailabilityFilter('available')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  availabilityFilter === 'available'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${availabilityFilter === 'available' ? 'bg-white' : 'bg-emerald-500'}`} />
                Còn sách ({counts.available})
              </button>

              <button
                type="button"
                onClick={() => setAvailabilityFilter('unavailable')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  availabilityFilter === 'unavailable'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${availabilityFilter === 'unavailable' ? 'bg-white' : 'bg-rose-500'}`} />
                Hết sách ({counts.unavailable})
              </button>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                title="Khôi phục trạng thái bộ lọc mặc định"
              >
                <RefreshCw size={12} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {/* Bottom row: Category filter & Sorting */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category selection */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Layers size={12} className="text-teal-600" /> Thể loại:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-teal-600 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort selection */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpDown size={12} className="text-slate-400" /> Sắp xếp:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="title">Tên sách (A - Z)</option>
                <option value="author">Tác giả</option>
                <option value="copies">Số bản khả dụng</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH RESULTS & CONTENT AREA */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-16">
        {/* Loading State */}
        {standardLoading && !aiSearchMutation.isSuccess && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3.5 border border-teal-100">
              <Loader2 className="animate-spin text-teal-600" size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-800">Đang tìm kiếm sách...</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">
              Hệ thống đang đối chiếu dữ liệu kho sách và cập nhật tình trạng tài liệu.
            </p>
          </div>
        )}

        {/* Error State */}
        {isSearchError && !standardLoading && !aiSearchMutation.isSuccess && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center shadow-xs flex flex-col items-center justify-center">
            <XCircle className="text-rose-500 mb-2" size={32} />
            <h3 className="text-base font-bold text-rose-900">Không thể kết nối danh mục sách</h3>
            <p className="text-xs sm:text-sm text-rose-700 mt-1 max-w-md">
              Đã xảy ra sự cố khi tải danh mục sách. Vui lòng kiểm tra lại kết nối mạng hoặc thử tải lại.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-4 border-rose-300 text-rose-700 hover:bg-rose-100 font-semibold"
            >
              <RefreshCw size={14} className="mr-1.5" /> Thử lại
            </Button>
          </div>
        )}

        {/* AI Results Section */}
        {aiSearchMutation.isSuccess && hasAiResults && (
          <div className="space-y-4 mb-8">
            <div className="bg-teal-50/50 border border-teal-200 rounded-3xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-teal-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      Kết quả tìm kiếm ngữ nghĩa bằng AI
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tìm thấy {aiSearchMutation.data.length} gợi ý phù hợp với từ khóa "{query}"
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => aiSearchMutation.reset()}
                  className="border-teal-200 hover:bg-teal-100 text-teal-800 text-xs font-semibold self-start sm:self-auto"
                >
                  <X size={14} className="mr-1.5" /> Trở về tra cứu tiêu chuẩn
                </Button>
              </div>

              {/* AI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiSearchMutation.data.map((result) => {
                  const isAvailable = (result.book.availableCopies || 0) > 0;
                  const isHolding = holdMutation.isPending && (holdMutation.variables as unknown as string) === result.book.id;

                  return (
                    <div
                      key={result.book.id}
                      onClick={() => setSelectedBook(result.book)}
                      className="bg-white border border-teal-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-teal-400 transition-all flex flex-col justify-between cursor-pointer group"
                    >
                      {/* Top book info */}
                      <div>
                        <div className="flex gap-3.5 mb-3">
                          <BookCoverImage
                            src={result.book.coverUrl}
                            title={result.book.title}
                            className="w-18 h-24 sm:w-20 sm:h-28 rounded-xl shadow-xs border border-slate-100 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-teal-700 transition-colors line-clamp-2 mb-1">
                              {result.book.title}
                            </h4>
                            <p className="text-xs font-medium text-slate-500 truncate mb-2">
                              {result.book.author}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px] text-slate-500 bg-slate-50 border-slate-200"
                              >
                                {result.book.isbn}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold text-teal-700 bg-teal-50 border-teal-200/70"
                              >
                                {result.book.category}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* AI Match Reason Box */}
                        <div className="bg-teal-50/70 rounded-xl p-3 border border-teal-100/80 mb-3.5">
                          <p className="text-[11px] font-bold text-teal-900 mb-1 flex items-center gap-1">
                            <Sparkles size={12} className="text-teal-600" />
                            {t('book.search.match_reason', 'Lý do phù hợp (AI)')}
                          </p>
                          <p className="text-xs text-slate-700 italic leading-relaxed line-clamp-3">
                            "{result.matchReason}"
                          </p>
                        </div>
                      </div>

                      {/* Bottom status & action buttons */}
                      <div
                        className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Status Badge */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-rose-50 text-rose-700 border-rose-200/80'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>
                            {isAvailable
                              ? `Còn sách (${result.book.availableCopies}/${result.book.totalCopies})`
                              : `Hết sách (0/${result.book.totalCopies})`}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {currentRole === 'member' && (
                            isAvailable ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs h-8 px-2.5 rounded-xl cursor-pointer"
                                onClick={() => {
                                  toast.info('Sách còn bản khả dụng, bạn đọc vui lòng đến quầy thư viện để mượn trực tiếp.');
                                }}
                              >
                                Đến quầy mượn
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={isHolding}
                                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-8 px-3 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                                onClick={() => holdMutation.mutate(result.book.id)}
                              >
                                {isHolding ? (
                                  <Loader2 size={13} className="animate-spin mr-1" />
                                ) : (
                                  <Bookmark size={13} className="mr-1" />
                                )}
                                Đặt giữ
                              </Button>
                            )
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-600 hover:text-teal-700 hover:bg-teal-50 font-semibold text-xs h-8 px-2 rounded-xl cursor-pointer"
                            onClick={() => setSelectedBook(result.book)}
                          >
                            <Info size={13} className="mr-1" /> Chi tiết
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Standard Book Results Grid */}
        {!aiSearchMutation.isSuccess && !standardLoading && !isSearchError && hasStandardResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-700 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                <BookMarked size={16} className="text-teal-600" />
                {query.trim().length > 0
                  ? `Kết quả tìm kiếm cho "${query}" (${displayedBooks.length} cuốn)`
                  : `Danh mục học liệu (${displayedBooks.length} cuốn)`}
              </h3>
              <span className="text-xs text-slate-400">
                Hiển thị {displayedBooks.length} kết quả
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {displayedBooks.map((book: any) => {
                const isAvailable = (book.availableCopies || 0) > 0;
                const isHolding = holdMutation.isPending && (holdMutation.variables as unknown as string) === book.id;

                return (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    {/* Top book content */}
                    <div>
                      <div className="flex gap-3.5 mb-3.5">
                        <BookCoverImage
                          src={book.coverUrl}
                          title={book.title}
                          className="w-18 h-24 sm:w-20 sm:h-28 rounded-xl shadow-xs border border-slate-100 shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-teal-700 transition-colors line-clamp-2 mb-1">
                            {book.title}
                          </h4>
                          <p className="text-xs font-medium text-slate-500 truncate mb-2">
                            {book.author}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] text-slate-500 bg-slate-50 border-slate-200"
                            >
                              {book.isbn}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold text-teal-700 bg-teal-50 border-teal-200/70"
                            >
                              {book.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status & Action Buttons */}
                    <div
                      className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Availability status badge */}
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-rose-50 text-rose-700 border-rose-200/80'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>
                          {isAvailable
                            ? `Còn ${book.availableCopies} / ${book.totalCopies} bản`
                            : `Hết sách (0/${book.totalCopies})`}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        {currentRole === 'member' && (
                          isAvailable ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs h-8 px-2.5 rounded-xl cursor-pointer"
                              onClick={() => {
                                toast.info('Sách còn bản khả dụng, bạn đọc vui lòng đến quầy thư viện để mượn trực tiếp.');
                              }}
                            >
                              Đến quầy mượn
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={isHolding}
                              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-8 px-3 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                              onClick={() => holdMutation.mutate(book.id)}
                            >
                              {isHolding ? (
                                <Loader2 size={13} className="animate-spin mr-1" />
                              ) : (
                                <Bookmark size={13} className="mr-1" />
                              )}
                              Đặt giữ
                            </Button>
                          )
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-teal-700 hover:bg-teal-50 font-semibold text-xs h-8 px-2 rounded-xl cursor-pointer"
                          onClick={() => setSelectedBook(book)}
                        >
                          <Info size={13} className="mr-1" /> Chi tiết
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State: No Books Found */}
        {!aiSearchMutation.isSuccess && !standardLoading && !isSearchError && !hasStandardResults && (
          <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-10 sm:p-14 text-center shadow-xs flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3.5">
              <Search size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {query.trim().length > 0 ? 'Không tìm thấy tài liệu phù hợp' : 'Chưa có tài liệu nào'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
              {query.trim().length > 0
                ? 'Vui lòng kiểm tra lại chính tả hoặc thử chuyển sang tính năng AI Ngữ nghĩa để tìm gợi ý liên quan.'
                : 'Hiện tại hệ thống chưa có sách theo các tiêu chí bộ lọc bạn đã chọn.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  <RefreshCw size={14} className="mr-1.5" /> Xóa bộ lọc
                </Button>
              )}
              {query.trim().length > 2 && (
                <Button
                  size="sm"
                  onClick={handleAiSearch}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  <Sparkles size={14} className="mr-1.5 text-teal-200" /> Thử tìm với AI
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. BOOK DETAILS DIALOG (Slate / Teal theme) */}
      {selectedBook && (
        <Dialog open={selectedBook !== null} onOpenChange={() => setSelectedBook(null)}>
          <DialogContent className="max-w-lg rounded-3xl p-5 sm:p-6 bg-white border border-slate-200 shadow-2xl">
            <DialogHeader className="pb-2 border-b border-slate-100">
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                Thông tin chi tiết tài liệu
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Chi tiết thông tin xuất bản và số lượng bản sao hiện có
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col sm:flex-row gap-5 mt-3">
              {/* Cover Image */}
              <div className="flex justify-center shrink-0">
                <BookCoverImage
                  src={selectedBook.coverUrl}
                  title={selectedBook.title}
                  className="w-28 h-40 sm:w-32 sm:h-44 rounded-2xl shadow-md border border-slate-200 object-cover"
                />
              </div>

              {/* Text content details */}
              <div className="flex-1 space-y-3.5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedBook.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-teal-700 mt-1">
                    Tác giả: {selectedBook.author}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Mã ISBN
                    </span>
                    <span className="text-xs font-mono text-slate-800 font-bold">
                      {selectedBook.isbn}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Thể loại
                    </span>
                    <span className="text-xs text-slate-800 font-bold">
                      {selectedBook.category}
                    </span>
                  </div>
                </div>

                {/* Status bar */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Tình trạng
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          (selectedBook.availableCopies || 0) > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span
                        className={`text-xs font-bold ${
                          (selectedBook.availableCopies || 0) > 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {(selectedBook.availableCopies || 0) > 0 ? 'Còn sách' : 'Hết sách'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Khả dụng / Tổng số
                    </span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block font-mono">
                      {selectedBook.availableCopies || 0} / {selectedBook.totalCopies || 0} bản
                    </span>
                  </div>
                </div>

                {/* Member action button inside dialog */}
                {currentRole === 'member' && (
                  <div className="pt-1">
                    {(selectedBook.availableCopies || 0) > 0 ? (
                      <Button
                        className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-xs sm:text-sm h-10 cursor-pointer"
                        onClick={() => {
                          toast.info('Sách còn bản khả dụng, bạn đọc vui lòng đến quầy thư viện để mượn trực tiếp.');
                        }}
                      >
                        Đến quầy mượn trực tiếp
                      </Button>
                    ) : (
                      <Button
                        disabled={holdMutation.isPending}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm h-10 gap-2 cursor-pointer shadow-xs"
                        onClick={() => holdMutation.mutate(selectedBook.id)}
                      >
                        {holdMutation.isPending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Bookmark size={16} />
                        )}
                        Đặt giữ sách này
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <Button
                onClick={() => setSelectedBook(null)}
                variant="outline"
                className="w-full sm:w-auto border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
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


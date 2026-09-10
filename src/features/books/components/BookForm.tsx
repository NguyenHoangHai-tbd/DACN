import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';

import { bookSchema, BookFormData } from '../schemas';
import { bookService } from '../services/bookService';
import { Book } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { parseFriendlyError } from '../../../shared/utils/errorParser';

interface BookFormProps {
  book?: Book | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const BookForm: React.FC<BookFormProps> = ({ book, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      isbn: book?.isbn || '',
      title: book?.title || '',
      author: book?.author || '',
      category: book?.category || '',
      publisher: book?.publisher || '',
      shelf: book?.shelf || '',
      copies: book ? book.totalCopies : 1,
      availableCopies: book ? book.availableCopies : 1,
      description: book?.description || '',
      coverUrl: book?.coverUrl || '',
      barcode: book?.barcode || ''
    }
  });

  const watchIsbn = watch('isbn');
  const watchTitle = watch('title');
  const watchCoverUrl = watch('coverUrl');

  const createMutation = useMutation({
    mutationFn: bookService.createBook,
    onSuccess: () => {
      toast.success(t('book.create.success', 'Thêm sách mới thành công'));
      queryClient.invalidateQueries({ queryKey: ['books'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Thêm sách không thành công. Vui lòng thử lại.'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: BookFormData }) => bookService.updateBook(id, data),
    onSuccess: () => {
      toast.success(t('book.update.success', 'Cập nhật sách thành công'));
      queryClient.invalidateQueries({ queryKey: ['books'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Cập nhật sách không thành công. Vui lòng thử lại.'));
    }
  });

  const enrichMutation = useMutation({
    mutationFn: bookService.aiEnrichBook,
    onSuccess: (data) => {
      setValue('description', data.description || '');
      setValue('category', data.suggestedCategories?.[0] || '');
      if (data.coverUrl) {
        setValue('coverUrl', data.coverUrl);
      }
      toast.success('Đã tự động điền thông tin chi tiết bằng AI thành công!');
    },
    onError: (error: any) => {
      toast.error(parseFriendlyError(error, 'Không thể truy xuất thông tin từ AI Copilot.'));
    }
  });

  const onSubmit = (data: BookFormData) => {
    if (book) {
      updateMutation.mutate({ id: book.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEnrich = () => {
    if (!watchIsbn) {
      toast.error('Vui lòng điền mã ISBN trước khi gửi yêu cầu AI Copilot.');
      return;
    }
    enrichMutation.mutate({ isbn: watchIsbn, title: watchTitle });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="space-y-1 flex-1">
          <Label htmlFor="isbn" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            {t('book.isbn')}
          </Label>
          <Input 
            id="isbn" 
            {...register('isbn')} 
            className={`h-11 rounded-xl bg-slate-50 ${errors.isbn ? 'border-red-500' : ''}`}
          />
        </div>
        <Button 
          type="button" 
          variant="outline" 
          className="h-11 rounded-xl text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center sm:min-w-[140px] w-full sm:w-auto shrink-0"
          onClick={handleEnrich}
          disabled={enrichMutation.isPending}
        >
          {enrichMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
             <>
               <Sparkles className="w-4 h-4 mr-2" />
               {t('book.enrich_ai')}
             </>
          )}
        </Button>
      </div>
      {errors.isbn && <p className="text-xs text-red-500">{t(errors.isbn.message as string)}</p>}

      <div className="space-y-1">
        <Label htmlFor="barcode" className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mã barcode / QR</Label>
        <Input id="barcode" {...register('barcode')} placeholder="Để trống để tự động tạo (e.g. BOOK-1718...)" className="h-11 rounded-xl bg-slate-50 focus-visible:ring-indigo-500" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="title" className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t('book.title')}</Label>
        <Input id="title" {...register('title')} className={`h-11 rounded-xl bg-slate-50 ${errors.title ? 'border-red-500' : ''}`} />
        {errors.title && <p className="text-xs text-red-500">{t(errors.title.message as string)}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="author" className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t('book.author')}</Label>
          <Input id="author" {...register('author')} className={`h-11 rounded-xl bg-slate-50 ${errors.author ? 'border-red-500' : ''}`} />
          {errors.author && <p className="text-xs text-red-500">{t(errors.author.message as string)}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="category" className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t('book.category')}</Label>
          <Input id="category" {...register('category')} className={`h-11 rounded-xl bg-slate-50 ${errors.category ? 'border-red-500' : ''}`} />
          {errors.category && <p className="text-xs text-red-500">{t(errors.category.message as string)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="publisher" className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t('book.publisher', 'Nhà xuất bản')}</Label>
          <Input id="publisher" {...register('publisher')} className="h-11 rounded-xl bg-slate-50" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="shelf" className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t('book.shelf', 'Vị trí/Kệ sách')}</Label>
          <Input id="shelf" {...register('shelf')} className="h-11 rounded-xl bg-slate-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="copies" className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t('book.total_copies', 'Tổng số bản')}</Label>
          <Input id="copies" type="number" {...register('copies')} className={`h-11 rounded-xl bg-slate-50 ${errors.copies ? 'border-red-500' : ''}`} />
          {errors.copies && <p className="text-xs text-red-500">{t(errors.copies.message as string)}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="availableCopies" className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t('book.available_copies', 'Số bản khả dụng')}</Label>
          <Input id="availableCopies" type="number" {...register('availableCopies')} className={`h-11 rounded-xl bg-slate-50 ${errors.availableCopies ? 'border-red-500' : ''}`} />
          {errors.availableCopies && <p className="text-xs text-red-500">{t(errors.availableCopies.message as string)}</p>}
        </div>
      </div>

      <div className="space-y-1 relative">
        <Label htmlFor="description" className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t('book.description')}</Label>
        <Textarea id="description" {...register('description')} className="min-h-[100px] rounded-xl bg-slate-50 focus-visible:ring-indigo-500 resize-none" />
        {enrichMutation.isSuccess && (
          <div className="absolute top-0 right-0 flex items-center text-[10px] uppercase font-bold tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
            <Sparkles className="w-3 h-3 mr-1" />
            AI tạo
          </div>
        )}
      </div>

      <div className="space-y-2 border border-slate-100 p-4 rounded-xl bg-slate-50/50">
        <Label htmlFor="coverUrl" className="text-xs font-bold text-slate-600 uppercase tracking-wide">URL Ảnh bìa</Label>
        <div className="flex gap-4 items-start">
          <div className="flex-1 space-y-1">
            <Input 
              id="coverUrl" 
              placeholder="Nhập đường dẫn URL ảnh (https://...)" 
              {...register('coverUrl')} 
              className="h-11 rounded-xl bg-white focus-visible:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400">
              Nhập link ảnh từ Internet. Nếu bỏ trống, hệ thống sẽ sử dụng ảnh bìa placeholder với ký tự viết tắt của tên sách.
            </p>
          </div>
          <div className="w-14 h-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
            {watchCoverUrl ? (
              <img 
                src={watchCoverUrl} 
                alt="Xem trước ảnh bìa" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"><rect width="100" height="150" fill="%23f1f5f9"/><text x="50" y="75" font-family="system-ui,sans-serif" font-size="32" font-weight="bold" fill="%2394a3b8" text-anchor="middle" dominant-baseline="middle">?</text></svg>`;
                }}
              />
            ) : (
              <div className="text-[10px] text-slate-400 font-bold text-center p-1 uppercase tracking-wider">No Cover</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl h-11" disabled={createMutation.isPending || updateMutation.isPending}>
            {t('common.button.cancel')}
          </Button>
        )}
        <Button type="submit" className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200" disabled={createMutation.isPending || updateMutation.isPending}>
          {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t('common.button.save')}
        </Button>
      </div>
    </form>
  );
};

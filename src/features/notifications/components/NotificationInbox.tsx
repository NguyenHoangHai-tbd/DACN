import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { notificationService } from '../services/notificationService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, Settings, BookOpen, AlertCircle, Info, TicketCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export const NotificationBadge: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
    refetchInterval: 30000
  });

  const { data: preferences } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: notificationService.getPreferences,
    enabled: isPreferencesOpen
  });

  const readMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const readAllMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const prefMutation = useMutation({
    mutationFn: notificationService.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      setIsPreferencesOpen(false);
    }
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handlePrefSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    prefMutation.mutate({
      email: formData.get('email') === 'on',
      push: formData.get('push') === 'on',
      inApp: formData.get('inApp') === 'on',
      reminderDays: Number(formData.get('reminderDays'))
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Warning': return <AlertCircle className="text-amber-500" size={16} />;
      case 'Alert': return <AlertCircle className="text-red-500" size={16} />;
      case 'Success': return <TicketCheck className="text-emerald-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="relative">
      <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
        <Popover>
          <PopoverTrigger render={<Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100" />}>
            <Bell className="text-slate-600" size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-4 mt-2 rounded-2xl shadow-xl overflow-hidden" align="end">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{t('notification.inbox_title', 'Thông báo')}</h3>
              <div className="flex gap-1">
                {unreadCount > 0 && (
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 focus:outline-none" onClick={() => readAllMutation.mutate()} title={t('notification.mark_all_read', 'Đánh dấu đã đọc tất cả')}>
                     <CheckCheck size={16} />
                   </Button>
                )}
                <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 focus:outline-none" />}>
                  <Settings size={16} />
                </DialogTrigger>
              </div>
            </div>
            
            <ScrollArea className="h-80">
              {isLoading ? (
                 <div className="p-8 text-center text-sm text-slate-500">{t('common.state.loading', 'Đang tải...')}</div>
              ) : !notifications || notifications.length === 0 ? (
                 <div className="p-8 text-center flex flex-col items-center text-slate-400">
                   <Bell size={32} className="mb-2 opacity-20" />
                   <span className="text-sm">{t('notification.empty', 'Không có thông báo mới')}</span>
                 </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-4 border-b border-slate-50 flex gap-3 transition-colors ${n.isRead ? 'bg-white opacity-70' : 'bg-indigo-50/30 cursor-pointer hover:bg-indigo-50/50'}`}
                      onClick={() => !n.isRead && readMutation.mutate(n.id)}
                    >
                      <div className="shrink-0 mt-0.5">
                        {getTypeIcon(n.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                           <h4 className={`text-sm ${n.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{n.title}</h4>
                           <span className="text-[10px] text-slate-400 whitespace-nowrap">
                             {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                           </span>
                        </div>
                        <p className={`text-xs ${n.isRead ? 'text-slate-500' : 'text-slate-700'}`}>{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('notification.preferences_title', 'Tùy chọn Thông báo')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePrefSubmit} className="space-y-6 pt-4">
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">{t('notification.in_app_label', 'Thông báo Trong ứng dụng')}</Label>
                    <p className="text-xs text-slate-500">{t('notification.in_app_desc', 'Nhận thông báo khi đang mở ứng dụng')}</p>
                  </div>
                  <Switch name="inApp" defaultChecked={preferences?.inApp ?? true} />
               </div>
               <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email</Label>
                    <p className="text-xs text-slate-500">{t('notification.email_desc', 'Nhận thông báo qua địa chỉ Email')}</p>
                  </div>
                  <Switch name="email" defaultChecked={preferences?.email ?? true} />
               </div>
               <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-xs text-slate-500">{t('notification.push_desc', 'Nhận thông báo đẩy trên điện thoại')}</p>
                  </div>
                  <Switch name="push" defaultChecked={preferences?.push ?? false} />
               </div>
               <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-sm">{t('notification.reminder_label', 'Nhắc trả sách trước (ngày)')}</Label>
                    <p className="text-xs text-slate-500">{t('notification.reminder_desc', 'Thời gian lý tưởng để báo trước hạn trả')}</p>
                  </div>
                  <Input name="reminderDays" type="number" min={1} max={7} defaultValue={preferences?.reminderDays ?? 2} className="w-20 text-center font-mono" />
               </div>
             </div>
             <div className="flex justify-end gap-2 pt-2">
               <Button type="button" variant="outline" onClick={() => setIsPreferencesOpen(false)}>{t('common.button.cancel', 'Hủy')}</Button>
               <Button type="submit" disabled={prefMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">{t('common.button.save_changes', 'Lưu thay đổi')}</Button>
             </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { useSignalRStore } from '../signalrStore';
import { toast } from 'sonner';

export const GlobalRealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connectionState, triggerEvent } = useSignalRStore();
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (connectionState === 'Connected') {
      // Simulate real-time mock events arriving from SignalR
      mockIntervalRef.current = setInterval(() => {
        const rand = Math.random();
        
        if (rand < 0.1) {
          triggerEvent('loan.created', { messageKey: 'loan.notification.new_loan', variables: { title: 'Sách mới mượn', user: 'Nguyễn Văn A' } });
          // toast.info('Vừa có độc giả mượn sách mới');
        } else if (rand > 0.1 && rand < 0.2) {
          triggerEvent('inventory.progress', { messageKey: 'inventory.notification.scan_update', variables: { count: 120 } });
          // toast.info('Tiến độ kiểm kê vừa cập nhật');
        } else if (rand > 0.95) {
          // AI Realtime Alert scenario
          triggerEvent('ai.alert', { 
            severity: 'high', 
            messageKey: 'ai.alert.overdue_spike',
            variables: {}
          });
          toast.error('AI cảnh báo: Phát hiện sự gia tăng đột ngột 50% số lượng sách mượn quá hạn trong 2 giờ qua tại Chi nhánh Thủ Đức.', {
            duration: 5000,
            icon: '🤖'
          });
        }
      }, 15000); // Trigger every 15s for the demo naturally

    } else {
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
      }
    }

    return () => {
      if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
    };
  }, [connectionState, triggerEvent]);

  return <>{children}</>;
};

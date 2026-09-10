import React, { useEffect, useState } from 'react';
import { useSignalRStore } from '../signalrStore';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const SignalRIndicator: React.FC = () => {
  const { connectionState, connect, simulateReconnect } = useSignalRStore();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (connectionState === 'Retrying') {
      toast.error('Mất kết nối thời gian thực...', { id: 'signalr-toast', duration: Infinity });
    } else if (connectionState === 'Connected') {
      toast.success('Đã kết nối thời gian thực', { id: 'signalr-toast', duration: 3000 });
    } else if (connectionState === 'Disconnected') {
      toast.dismiss('signalr-toast');
    }
  }, [connectionState]);

  const getStatusConfig = () => {
    switch (connectionState) {
      case 'Connected':
        return { icon: Wifi, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'Live' };
      case 'Connecting':
        return { icon: Loader2, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'Đang kết nối' };
      case 'Retrying':
        return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', text: 'Đang thử lại' };
      case 'Disconnected':
      default:
        return { icon: WifiOff, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', text: 'Đã ngắt kết nối' };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div 
      className={`relative flex items-center justify-center p-2 rounded-full border cursor-pointer transition-colors ${config.bg} ${config.border}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={simulateReconnect}
      title="Nhấp để giả lập mất kết nối & thử lại"
    >
      <Icon size={16} className={`${config.color} ${connectionState === 'Connecting' ? 'animate-spin' : ''}`} />
      
      {/* Badge dot */}
      {connectionState === 'Connected' && (
        <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      )}
      
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute top-10 right-0 w-max bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95">
          {config.text} - Bấm để test Reconnect
        </div>
      )}
    </div>
  );
};

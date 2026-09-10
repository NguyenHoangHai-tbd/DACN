import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export const NetworkStatus: React.FC = () => {
   const [isOnline, setIsOnline] = useState(navigator.onLine);

   useEffect(() => {
     const handleOnline = () => { 
        setIsOnline(true); 
        toast.success("Đã khôi phục kết nối mạng"); 
     };
     const handleOffline = () => { 
        setIsOnline(false); 
        toast.warning("Mất kết nối mạng. Một số chức năng có thể tạm thời không đồng bộ."); 
     };

     window.addEventListener('online', handleOnline);
     window.addEventListener('offline', handleOffline);
     return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
     };
   }, []);

   if (isOnline) {
      return (
         <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 hidden md:flex">
            <Wifi size={14} /> Trực tuyến
         </div>
      );
   }

   return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-200 animate-pulse">
         <WifiOff size={14} /> Mất kết nối
      </div>
   );
};

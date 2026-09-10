import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useSignalRListener = (eventKey: string, callback?: (payload: any) => void, queryKeysToInvalidate?: string[][]) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const payload = customEvent.detail;
      
      // Allow custom callback execution
      if (callback) {
        callback(payload);
      }

      // Automatically invalidate specified React Query keys
      if (queryKeysToInvalidate) {
        queryKeysToInvalidate.forEach(keys => {
          queryClient.invalidateQueries({ queryKey: keys });
        });
      }
    };

    const eventName = 'signalr:' + eventKey;
    window.addEventListener(eventName, handleEvent);

    return () => {
      window.removeEventListener(eventName, handleEvent);
    };
  }, [eventKey, callback, queryKeysToInvalidate, queryClient]);
};

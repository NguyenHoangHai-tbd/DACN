import { create } from 'zustand';

export type ConnectionState = 'Disconnected' | 'Connecting' | 'Connected' | 'Retrying';

interface SignalRState {
  connectionState: ConnectionState;
  connect: () => void;
  disconnect: () => void;
  simulateReconnect: () => void;
  triggerEvent: (eventKey: string, payload: any) => void;
}

export const useSignalRStore = create<SignalRState>((set) => ({
  connectionState: 'Disconnected',
  connect: () => {
    set({ connectionState: 'Connecting' });
    setTimeout(() => {
      set({ connectionState: 'Connected' });
    }, 1500);
  },
  disconnect: () => {
    set({ connectionState: 'Disconnected' });
  },
  simulateReconnect: () => {
    set({ connectionState: 'Retrying' });
    setTimeout(() => {
      set({ connectionState: 'Connected' });
    }, 2000);
  },
  triggerEvent: (eventKey, payload) => {
    // We emit events via standard browser CustomEvent, so any component can listen to it
    const event = new CustomEvent('signalr:' + eventKey, { detail: payload });
    window.dispatchEvent(event);
  }
}));

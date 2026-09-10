import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '../../features/auth/store/authStore';
import { toast } from 'sonner';

class HubManager {
  private securityHub: signalR.HubConnection | null = null;
  private url = '/hubs/security';

  startSecurityHub() {
    const { accessToken, tenantCode } = useAuthStore.getState();

    if (!accessToken) return;

    this.securityHub = new signalR.HubConnectionBuilder()
      .withUrl(this.url, {
        accessTokenFactory: () => accessToken,
        headers: { 'X-Tenant-Code': tenantCode || '' }
      })
      .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect()
      .build();

    this.securityHub.start()
      .then(() => {
        console.log('SecurityHub connected');
        this.registerEvents();
      })
      .catch((err) => {
        // Silently fail in mock environment to avoid dev console spam
        if (process.env.NODE_ENV === 'development') {
          console.log('SignalR mock: Note - SecurityHub was not connected.');
        } else {
          console.error('Error connecting to SecurityHub: ', err);
        }
      });
  }

  stopSecurityHub() {
    if (this.securityHub) {
      this.securityHub.stop();
      this.securityHub = null;
    }
  }

  private registerEvents() {
    if (!this.securityHub) return;

    // AI risk hint real-time event
    this.securityHub.on('security.loginSuspicious', (messageKey: string, variables: any) => {
      // Typically we'd use i18n to translate this key if it's dynamic
      toast.warning('Phát hiện hoạt động bất thường', { 
        description: 'Vui lòng kiểm tra lại các phiên hoạt động.' 
      });
    });

    this.securityHub.on('user.sessionRevoked', () => {
      toast.error('Phiên đăng nhập đã bị quản trị viên thu hồi');
      useAuthStore.getState().logout();
    });
  }
}

export const hubManager = new HubManager();

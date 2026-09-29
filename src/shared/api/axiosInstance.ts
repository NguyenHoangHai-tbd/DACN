import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useRoleStore } from '../store/roleStore';
import { toast } from 'sonner';

const getBaseUrl = (): string => {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  let url = env?.VITE_API_BASE_URL;

  if (!url) {
    url = '/api';
  }

  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }

  return url;
};

export const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

axiosInstance.interceptors.request.use((config) => {
  config.headers['ngrok-skip-browser-warning'] = 'true';
  const { accessToken, tenantCode, user } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (tenantCode) {
    config.headers['X-Tenant-Code'] = tenantCode;
  }
  
  const currentRole = useRoleStore.getState().currentRole;
  config.headers['X-Current-Role'] = currentRole;
  
  if (user?.id) {
    config.headers['X-Current-User-Id'] = user.id;
  }
  
  return config;
});

// A flag to prevent multiple refresh calls simultaneously
let isRefreshing = false;
let failedQueue: Array<any> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isLoginRequest = originalRequest.url && (originalRequest.url.includes('/api/auth/login') || originalRequest.url.includes('auth/login'));

    // Handle transient server errors (503 Service Unavailable, 502 Bad Gateway, 504 Gateway Timeout, ECONNABORTED timeout)
    const isTransientError =
      (error.response && [502, 503, 504].includes(error.response.status)) ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout') ||
      error.code === 'ERR_NETWORK';

    if (isTransientError && !isLoginRequest) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      if (originalRequest._retryCount < 2) {
        originalRequest._retryCount += 1;
        const delay = originalRequest._retryCount * 800;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return axiosInstance(originalRequest);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, logout, setTokens } = useAuthStore.getState();
      
      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${getBaseUrl()}/auth/refresh`,
          { refreshToken },
          { headers: { 'ngrok-skip-browser-warning': 'true' } }
        );
        if (data?.success) {
          setTokens(data.data.accessToken, data.data.refreshToken);
          axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + data.data.accessToken;
          originalRequest.headers.Authorization = 'Bearer ' + data.data.accessToken;
          processQueue(null, data.data.accessToken);
          return axiosInstance(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        logout();
        // Optionially alert the user
        // toast.error('Session expired, please login again');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

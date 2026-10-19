import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

export const TOKEN_STORAGE_KEY = 'catfinance_access_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ field?: string; message: string }>;
  };
}

// Response Interceptor: Global Error Toast Handler
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const errorData = error.response?.data?.error;
    const message =
      errorData?.message ||
      (error.response?.data as any)?.message ||
      'Ocorreu um erro inesperado. Tente novamente.';

    // Show toast unless the request specifically asked to skip it
    if (!error.config?.headers?.['X-Skip-Toast']) {
      toast.error(message);
    }

    // Auto logout on 401 when token was present
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem(TOKEN_STORAGE_KEY);
      if (hadToken && !window.location.pathname.includes('/login')) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

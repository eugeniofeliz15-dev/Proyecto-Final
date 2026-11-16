import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function getApiAssetUrl(path: string | null): string | null {
  if (!path) return null;
  const baseURL = api.defaults.baseURL;
  if (!baseURL) {
    throw new Error('Configura VITE_API_URL para cargar imágenes de productos.');
  }
  return new URL(path, baseURL).toString();
}

api.interceptors.request.use((config) => {
  if (!config.baseURL) {
    throw new Error('Configura VITE_API_URL para conectar con la API.');
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }

  const token = useAuthStore.getState().token;
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  },
);

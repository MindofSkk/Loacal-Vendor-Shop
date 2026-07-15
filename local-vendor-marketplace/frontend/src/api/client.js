import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://loacal-vendor-shop.onrender.com/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lvm_token');

  // Centralizes JWT attachment so feature pages do not repeat auth header logic.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Broadcast 401s so all protected UI can return to login consistently.
    if (error.response?.status === 401) {
      localStorage.removeItem('lvm_token');
      localStorage.removeItem('lvm_user');
      window.dispatchEvent(new Event('lvm:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export const getApiError = (error) =>
  error.response?.data?.message || error.response?.data?.details?.[0]?.msg || error.message || 'Something went wrong';

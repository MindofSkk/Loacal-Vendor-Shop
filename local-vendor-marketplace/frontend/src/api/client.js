import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lvm_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
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

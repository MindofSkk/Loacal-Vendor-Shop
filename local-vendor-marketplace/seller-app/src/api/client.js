import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_LOCAL_IP:5000/api'
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('lvm_seller_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['lvm_seller_token', 'lvm_seller_user']);
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export const getApiError = (error) =>
  error.response?.data?.message || error.response?.data?.details?.[0]?.msg || error.message || 'Something went wrong';

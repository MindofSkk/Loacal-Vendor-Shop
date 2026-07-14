import { api } from './client';

export const authApi = {
  register: (payload) => api.post('/auth/register', { ...payload, role: 'seller' }),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me')
};

export const categoryApi = {
  list: () => api.get('/categories')
};

export const shopApi = {
  myShop: () => api.get('/shops/seller/me'),
  saveMyShop: (payload) => api.post('/shops/seller/me', payload),
  uploadLogo: (payload) => api.post('/shops/seller/logo', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSettings: () => api.get('/shops/seller/settings'),
  updateSettings: (payload) => api.patch('/shops/seller/settings', payload)
};

export const productApi = {
  sellerList: () => api.get('/products/seller/me'),
  create: (payload) => api.post('/products', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, payload) => api.patch(`/products/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/products/${id}`)
};

export const orderApi = {
  sellerOrders: () => api.get('/orders/seller'),
  updateSellerStatus: (id, payload) => api.patch(`/orders/seller/${id}/status`, payload)
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  registerToken: (payload) => api.post('/notifications/register-token', payload),
  unregisterToken: (payload) => api.delete('/notifications/unregister-token', { data: payload })
};

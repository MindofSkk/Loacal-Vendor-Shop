import { api } from './client';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me')
};

export const categoryApi = {
  list: () => api.get('/categories'),
  create: (payload) => api.post('/categories', payload),
  update: (id, payload) => api.patch(`/categories/${id}`, payload),
  remove: (id) => api.delete(`/categories/${id}`)
};

export const shopApi = {
  list: (params) => api.get('/shops', { params }),
  get: (id) => api.get(`/shops/${id}`),
  adminList: (params) => api.get('/shops/admin/all', { params }),
  myShop: () => api.get('/shops/seller/me'),
  saveMyShop: (payload) => api.post('/shops/seller/me', payload),
  uploadLogo: (payload) =>
    api.post('/shops/seller/logo', payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getSettings: () => api.get('/shops/seller/settings'),
  updateSettings: (payload) => api.patch('/shops/seller/settings', payload),
  updateStatus: (id, payload) => api.patch(`/shops/admin/${id}/status`, payload)
};

export const productApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  sellerList: () => api.get('/products/seller/me'),
  create: (payload) =>
    api.post('/products', payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  update: (id, payload) =>
    api.patch(`/products/${id}`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  remove: (id) => api.delete(`/products/${id}`)
};

export const orderApi = {
  create: (payload) => api.post('/orders', payload),
  myOrders: () => api.get('/orders/my'),
  cancel: (id, payload) => api.patch(`/orders/${id}/cancel`, payload),
  sellerOrders: () => api.get('/orders/seller'),
  updateSellerStatus: (id, payload) => api.patch(`/orders/seller/${id}/status`, payload),
  adminList: (params) => api.get('/orders/admin/all', { params })
};

export const userApi = {
  list: (params) => api.get('/users', { params }),
  updateStatus: (id, payload) => api.patch(`/users/${id}/status`, payload)
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`)
};

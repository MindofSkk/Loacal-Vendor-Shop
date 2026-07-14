import { api } from './client';

export const authApi = {
  register: (payload) => api.post('/auth/register', { ...payload, role: 'customer' }),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me')
};

export const categoryApi = {
  list: () => api.get('/categories')
};

export const shopApi = {
  list: (params) => api.get('/shops', { params }),
  get: (id) => api.get(`/shops/${id}`)
};

export const productApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`)
};

export const orderApi = {
  create: (payload) => api.post('/orders', payload),
  myOrders: () => api.get('/orders/my'),
  active: () => api.get('/orders/customer/active'),
  get: (id) => api.get(`/orders/${id}`),
  cancel: (id, payload) => api.patch(`/orders/${id}/cancel`, payload)
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  registerToken: (payload) => api.post('/notifications/register-token', payload),
  unregisterToken: (payload) => api.delete('/notifications/unregister-token', { data: payload })
};

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
  cancel: (id, payload) => api.patch(`/orders/${id}/cancel`, payload)
};

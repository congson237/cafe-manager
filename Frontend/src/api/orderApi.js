import api from './axios'

export const getOrders = (params) => api.get('/orders', { params })
export const getOpenOrdersByTable = (tableId) =>
  api.get(`/orders/table/${tableId}/open`)
export const createOrder = (data) => api.post('/orders', data)
export const updateOrderStatus = (id, data) =>
  api.patch(`/orders/${id}/status`, data)
export const deleteOrder = (id) => api.delete(`/orders/${id}`)
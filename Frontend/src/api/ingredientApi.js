import api from './axios'

export const getIngredients = () => api.get('/ingredients')
export const createIngredient = (data) => api.post('/ingredients', data)
export const updateIngredient = (id, data) => api.put(`/ingredients/${id}`, data)
export const adjustStock = (id, data) => api.patch(`/ingredients/${id}/stock`, data)
export const deleteIngredient = (id) => api.delete(`/ingredients/${id}`)
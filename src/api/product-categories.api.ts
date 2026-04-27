import api from "./axios";

export const getCategories = (params?: {
    page?: number
    search?: string
    limit?: number
}) => api.get('product-categories', {params})

// export const deleteCategory = (id: number) => api.delete('/product-categories/${id}')
export const deleteCategory = (id: number) => api.delete(`/product-categories/${id}`)


import api from "./axios";

export const getTransactions = (params?: {
    page?: number
    search?: string
    limit?: number
}) => api.get('transactions', {params})

export const getTransaction = (id: number) => api.get(`/transactions/${id}`)

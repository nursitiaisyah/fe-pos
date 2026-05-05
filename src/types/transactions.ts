import type { Product } from "./products"

export interface TransactionItem {
    id: number
    product_id: number
    product_name: string
    quantity: number
    price: number
    subtotal: number
}

export interface Transaction {
    id: number
    code: string
    customer_id: number | null
    subtotal: number
    tax: number
    total: number
    created_at: string
    customer?: {
        id: number
        name: string
    } | null
    items?: TransactionItem[]
}

export interface CartItem {
    product: Product
    quantity: number
}

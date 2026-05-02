export interface Product {
    id: number
    product_category_id: number
    name: string
    image?: string | null
    price: number
    stock: number
    category?: {
        id: number
        name: string
    } | null
}

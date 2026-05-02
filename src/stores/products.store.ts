import { getProducts } from "@/api/products.api";
import type { Product } from "@/types/products";
import { defineStore } from "pinia";

export const useProductStore = defineStore('product', {
    state: () => ({
        items: [] as Product[],

        pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
            from: 0,
            to: 0,
        },

        page: 1,
        limit: 10,
        search: '',
        product_category_id: null as number | null,
        loading: false,
    }),

    getters: {
        currentPage: (state) => state.pagination.current_page || 1,
        totalPages: (state) => state.pagination.last_page || 1
    },

    actions: {
        async fetch() {
            this.loading = true

            try {
                const res = await getProducts({
                    page: this.page,
                    search: this.search,
                    limit: this.limit,
                    product_category_id: this.product_category_id
                })

                this.items = res.data.data.items
                this.pagination = res.data.data.pagination
            } catch (error) {
                console.error('Failed to fetch products:', error)
            } finally {
                this.loading = false
            }
        },

        setPage(page: number) {
            this.page = page
            this.fetch()
        },

        setLimit(limit: number) {
            this.limit = limit
            this.page = 1
            this.fetch()
        },

        setCategoryFilter(categoryId: number | null) {
            this.product_category_id = categoryId
            this.page = 1
            this.fetch()
        },

        nextPage() {
            if (this.pagination.current_page < this.pagination.last_page) {
                this.page = this.pagination.current_page + 1
                this.fetch()
            }
        },

        privPage() {
            if (this.pagination.current_page > 1) {
                this.page = this.pagination.current_page - 1
                this.fetch()
            }
        },
    }
})

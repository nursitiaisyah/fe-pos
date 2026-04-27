//import function API untuk ambil data kategori dari backend
import { getCategories } from "@/api/product-categories.api";

// import tipe data ProductCategory (agar TypeScript tahu struktur datanya)
import type { ProductCategory } from "@/types/product-categories";

//import defineStore dari pinia (untuk membuat store/state global)
import { defineStore } from "pinia";

// membuat store dengan nama 'productCategory'
export const useProductCategoryStore = defineStore('productCategory', {
    // STATE = tempat menyimpan data (seperti variabel global)
    state: ()=>({
        // array untuk menyimpan data kategori product
        items: [] as ProductCategory [] ,

        // data pagination dari API (halaman, total, dll)
        pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
            from: 0,
            to: 0,
        },
        // halaman aktif saat ini
        page: 1,

        // jumlah data perhalaman
        limit: 10,

        // keyword pencarian
        search: '',

        // status loading (true saat ambil data)
        loading: false,
    }),

    getters: {
        // Menghitung/mengambil nomor halaman yang sedang aktif saat ini
        // Jika data dari API belum ada (null/undefined), maka otomatis dianggap halaman 1.
        currentPage: (state) => state.pagination.current_page || 1,

        // Menghitung / mengambil total seluruh halaman yang tersedia dari API
        // Digunakan untuk tahu kapan tombol "Next" harus mati (disabled)
        // Jika data belum ada, dianggap totalnya 1 halaman saja
        totalPages: (state) => state.pagination.last_page || 1
    },

    // ACTIONS = tempat fungsi (logic)
    actions: {

        // function untuk mengambil data dari API
       async fetch() {

        // set loading true (biasanya untuk tampilkan spinner)
            this.loading = true

            try {
                // panggil API dengan parameter page, search, dan limit
                const res = await getCategories({
                    page: this.page,
                    search: this.search,
                    limit: this.limit
                })

                // simpan data kategori ke state items
                this.items = res.data.data.items

                // simpan data pagination ke state
                this.pagination = res.data.data.pagination
            }catch (error) {
                // jika error, tampilkan di console
                console.error('Failed to fetch categories:', error)
            }finally{
                // apapun hasilnya, loading dimatikan
                this.loading = false
            }
        },

        setPage(page: number) {
            this.page = page
            this.fetch()
        },

        setLimit(limit: number){
            this.limit = limit
            this.page = 1
            this.fetch()
        },

        nextPage(){
            if(this.pagination.current_page < this.pagination.last_page) {
                this.page = this.pagination.current_page + 1
                this.fetch()
            }
        },

        privPage(){
            if(this.pagination.current_page > 1) {
                this.page = this.pagination.current_page - 1
                this.fetch()
            }
        },
    }
})

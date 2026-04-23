import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        Accept: 'application/json'
    }
})

// Menyiapkan "Satpam Otomatis" (Interceptor) untuk setiap request yang keluar
api.interceptors.request.use(config => {

    // 1. Ambil "Kunci Akses" (token) yang sebelumnya disimpan di laci browser (LocalStorage)
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Mengekspor instance 'api' agar bisa diimpor dan digunakan di file lain
// (Misalnya digunakan di halaman Login, Dashboard, dll)
export default api

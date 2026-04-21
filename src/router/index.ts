import AppLayout from '@/layout/AppLayout.vue'
import Dashboard from '@/pages/Dashboard.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
        path: '/',
        component: AppLayout,
        children:[
            {
                path: '',
                name: 'dashboard',
                component: Dashboard
            }
        ]
    }
  ],
})

export default router

<script setup lang="ts">
import { getTransaction } from '@/api/transactions.api';
import { Button, Column, DataTable } from 'primevue';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Transaction } from '@/types/transactions';

const route = useRoute()

const loading = ref(false)
const transaction = ref<Transaction | null>(null)

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value)
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

onMounted(async () => {
    loading.value = true

    try {
        const res = await getTransaction(Number(route.params.id))
        transaction.value = res.data.data
    } catch (error) {
        console.error('Failed to fetch transaction:', error)
    } finally {
        loading.value = false
    }
})

</script>

<template>
    <div class="min-h-screen bg-surface-50 font-sans text-surface-900">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-2xl font-bold text-surface-900 mb-1">
                    Transaction Detail
                </h1>
                <p class="text-surface-500 text-sm">
                    View transaction information
                </p>
            </div>

            <Button asChild v-slot="slotProps">
                <RouterLink :to="{ name: 'transactions' }" :class="slotProps.class">
                    <i class="pi pi-arrow-left"></i>
                    Back
                </RouterLink>
            </Button>
        </div>

        <div v-if="loading" class="flex justify-center py-20">
            <i class="pi pi-spin pi-spinner text-4xl text-surface-400"></i>
        </div>

        <div v-else-if="transaction" class="flex flex-col gap-6">
            <!-- Transaction Info -->
            <div class="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                <div class="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                    <div class="flex flex-col gap-1">
                        <span class="text-sm text-surface-500">Code</span>
                        <span class="font-semibold text-surface-900">{{ transaction.code }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-sm text-surface-500">Customer</span>
                        <span class="font-semibold text-surface-900">{{ transaction.customer?.name ?? '-' }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-sm text-surface-500">Date</span>
                        <span class="font-semibold text-surface-900">{{ formatDate(transaction.created_at) }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-sm text-surface-500">Total</span>
                        <span class="font-semibold text-primary-600 text-lg">{{ formatCurrency(transaction.total) }}</span>
                    </div>
                </div>
            </div>

            <!-- Items Table -->
            <div class="bg-white rounded-2xl border border-surface-200 overflow-hidden p-2">
                <div class="px-4 py-4">
                    <h2 class="text-lg font-semibold text-surface-900">Items</h2>
                </div>
                <DataTable :value="transaction.items" dataKey="id" class="clean-table" :rowHover="true">
                    <Column field="product_name" header="Product">
                        <template #body="{ data }">
                            <span class="font-semibold text-surface-900">{{ data.product.name }}</span>
                        </template>
                    </Column>
                    <Column field="price" header="Price">
                        <template #body="{ data }">
                            {{ formatCurrency(data.price) }}
                        </template>
                    </Column>
                    <Column field="quantity" header="Qty"></Column>
                    <Column field="subtotal" header="Subtotal">
                        <template #body="{ data }">
                            {{ formatCurrency(data.subtotal) }}
                        </template>
                    </Column>
                </DataTable>

                <!-- Summary -->
                <div class="border-t border-surface-100 px-6 py-4">
                    <div class="flex flex-col items-end gap-2">
                        <div class="flex justify-between w-full max-w-xs">
                            <span class="text-surface-500">Subtotal</span>
                            <span class="font-medium text-surface-900">{{ formatCurrency(transaction.subtotal) }}</span>
                        </div>
                        <div class="flex justify-between w-full max-w-xs">
                            <span class="text-surface-500">Tax</span>
                            <span class="font-medium text-surface-900">{{ formatCurrency(transaction.tax) }}</span>
                        </div>
                        <div class="flex justify-between w-full max-w-xs border-t border-surface-200 pt-2 mt-1">
                            <span class="font-semibold text-surface-900">Total</span>
                            <span class="font-bold text-primary-600 text-lg">{{ formatCurrency(transaction.total) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

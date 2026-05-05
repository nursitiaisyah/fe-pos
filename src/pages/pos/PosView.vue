<script setup lang="ts">
import { getProducts } from '@/api/products.api';
import { getCustomers, createCustomer } from '@/api/customers.api';
import { usePosStore } from '@/stores/pos.store';
import type { Product } from '@/types/products';
import type { Customer } from '@/types/customers';
import { storeToRefs } from 'pinia';

import { IconField, InputIcon, InputText, Button, InputNumber, Select, Dialog, Message, useToast } from 'primevue';
import { onMounted, ref } from 'vue';

const toast = useToast()

const products = ref<Product[]>([]);
const productsLoading = ref(false)
const productSearch = ref('')
const paymentAmount = ref(0)

// Customer state
const customers = ref<Customer[]>([])
const selectedCustomer = ref<Customer | null>(null)
const customersLoading = ref(false)
const showCustomerModal = ref(false)
const customerFormLoading = ref(false)
const customerErrors = ref<Record<string, string[]>>({})
const customerForm = ref({
    name: '',
    phone: ''
})

// Receipt Modal
const showReceiptModal = ref(false)
const receiptData = ref<{
    date: string;
    code: string;
    customer: Customer;
    items: {
        name: string,
        quantity: string,
        price: number,
        subtotal: number
    }[],
    subtotal: number,
    tax: number,
    total: number,
    payment: number,
    change: number,
} | null>(null)

const posStore = usePosStore()
const { cart, subtotal, tax, total, customerId } = storeToRefs(posStore)
const {addToCart, removeFromCart, updateQuantity, clearCart, setCustomer, checkout  } = posStore

const loadProducts = async (search?: string) => {
    productsLoading.value = true

    try {
        const res = await getProducts({
            page: 1,
            search: search || undefined,
            limit: 10,
        })

        products.value = res.data.data.items ?? []
    } catch (error) {
        console.log(error)
    } finally {
        productsLoading.value = false
    }
}

const handleSearch = () => {
    loadProducts(productSearch.value)
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value)
}

// Customer functions
const loadCustomers = async (search?: string) => {
    customersLoading.value = true
    try {
        const res = await getCustomers({
            page: 1,
            search: search || undefined,
            limit: 50,
        })
        customers.value = res.data.data.items ?? []
    } catch (error) {
        console.log(error)
    } finally {
        customersLoading.value = false
    }
}

const openCustomerModal = () => {
    customerForm.value = { name: '', phone: '' }
    customerErrors.value = {}
    showCustomerModal.value = true
}

const submitCustomer = async () => {
    customerFormLoading.value = true
    customerErrors.value = {}

    try {
        const payload = {
            name: customerForm.value.name,
            phone: customerForm.value.phone
        }

        const res = await createCustomer(payload)
        const newCustomer = res.data.data

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Customer created successfully',
            life: 3000
        })

        // Reload customers and auto-select the new one
        await loadCustomers()
        selectedCustomer.value = customers.value.find(c => c.id === newCustomer.id) || null
        posStore.customerId = newCustomer.id
        showCustomerModal.value = false
    } catch (error: any) {
        if (error.response?.status === 422) {
            customerErrors.value = error.response?.data.errors ?? {}
            return
        }

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Failed to create customer',
            life: 3000
        })
    } finally {
        customerFormLoading.value = false
    }
}

const onCustomerChange = () => {
    posStore.customerId = selectedCustomer.value?.id ?? null
}

const handleCheckout = async () => {
    if(!customerId.value) {
        toast.add({
            severity: "warn",
            summary: "Warning",
            detail: "Please select a customer",
            life: 3000
        })

        return
    }

    if(cart.value.length === 0) {
        toast.add({
            severity: "warn",
            summary: "Warning",
            detail: "Please add at least one item to the cart",
            life: 3000
        })

        return
    }

    if(paymentAmount.value < total.value) {
        toast.add({
            severity: "warn",
            summary: "Warning",
            detail: "Payment amout is less than the total",
            life: 3000
        })

        return
    }

    try {
        const res = await checkout()

        receiptData.value = {
            code: res.code,
            customer: res.customer,
            date: res.created_at,
            items: res.items,
            subtotal: res.subtotal,
            tax: res.tax,
            total: res.total,
            payment: paymentAmount.value,
            change: paymentAmount.value - res.total
        }

        showReceiptModal.value = true

    }catch (error:any) {
        toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message ?? "An error occured",
            life: 3000
        })

    }
}

const closeReceipt = () => {
    showReceiptModal.value = false
    receiptData.value = null
    selectedCustomer.value = null
    paymentAmount.value = 0

    loadProducts()
    loadCustomers()
}

onMounted(() => {
    loadProducts()
    loadCustomers()
})
</script>

<template>
    <div class="min-h-screen bg-surface-50 font-sans text-surface-900">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-surface-900 mb-1">
                    POS
                </h1>
                <p class="text-surface-500 text-sm">
                    Create a new transaction
                </p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2">
                <div class="bg-white rounded-2xl border border-surface-200 p-4">
                    <IconField iconPosition="left" class="mb-4">
                        <InputIcon class="pi pi-search text-surface-400"/>
                        <InputText
                            v-model="productSearch"
                            @input="handleSearch"
                            placeholder="Search"
                            class="w-full bg-surface-200 focus:bg-white focus:border-primary-500"
                        />
                    </IconField>

                    <!-- Product -->
                    <div v-if="productsLoading" class="text-center py-12 text-surface-500">
                        Loading Product ...
                    </div>

                    <div v-else-if="products.length === 0" class="text-center py-12 text-surface-500">
                        No products found.
                    </div>

                    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        <button @click="addToCart(product)" v-for="product in products" :key="product.id"
                            class="group p-3 rounded-xl border border-surface-200 hover:border-primary-500 hover:shadow-md transition-all text-left bg-white"
                            :disabled="product.stock === 0"
                            :class="product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''">
                            <div class="aspect-square rounded-lg bg-surface-100 mb-2 overflow-hidden">
                                <img v-if="product.image" :src="product.image" :alt="product.name" class="w-full h-full object-cover" />

                                <div v-else class="w-full h-full flex items-center justify-center">
                                    <span class="text-surface-500 text-sm">No Image</span>
                                </div>
                            </div>
                            <div class="text-sm font-medium text-surface-900 truncate">
                                {{ product.name }}
                            </div>

                            <div class="text-sm text-primary-500">
                                {{ formatCurrency(product.price) }}
                            </div>

                            <div class="text-sm text-surface-900">
                                Stock: {{ product.stock }}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-1">
                <div class="bg-white rounded-2xl border border-surface-200 p-4 sticky top-4">
                    <h2 class="text-lg font-semibold text-surface-500 mb-4">Cart</h2>

                    <!-- Customer Select -->
                    <div class="mb-4">
                        <label class="text-sm font-medium text-surface-700 mb-2 block">Customer</label>
                        <div class="flex gap-2">
                            <Select
                                v-model="selectedCustomer"
                                :options="customers"
                                optionLabel="name"
                                placeholder="Select Customer"
                                filter
                                :loading="customersLoading"
                                @change="onCustomerChange"
                                class="flex-1"
                                showClear
                            >
                                <template #option="slotProps">
                                    <div class="flex flex-col">
                                        <span class="font-medium">{{ slotProps.option.name }}</span>
                                        <span class="text-xs text-surface-500">{{ slotProps.option.phone }}</span>
                                    </div>
                                </template>
                                <template #value="slotProps">
                                    <div v-if="slotProps.value" class="flex items-center gap-2">
                                        <span>{{ slotProps.value.name }}</span>
                                    </div>
                                    <span v-else class="text-surface-400">Select Customer</span>
                                </template>
                            </Select>
                            <Button
                                icon="pi pi-plus"
                                severity="secondary"
                                outlined
                                class="flex-shrink-0"
                                @click="openCustomerModal"
                                v-tooltip.top="'Add New Customer'"
                            />
                        </div>
                    </div>

                    <div v-if="cart.length === 0" class="text-center py-8 text-surface-400">
                        <i class="pi pi-shopping-cart text-3xl mb-2"></i>
                        <p class="text-sm">Cart is empty</p>
                    </div>

                    <div v-else ref="cartContainer" class="space-y-2 mb-4 max-4 max-h-50 overflow-y-auto">
                        <div v-for="item in cart" :key="item.product.id" class="p-3 rounded-lg bg-surface-50">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-surface-200 overflow-hidden flex-shrink-0">
                                    <img v-if="item.product.image" :src="item.product.image" class="w-full h-full object-cover">

                                    <div v-else class="w-full h-full flex items-center justify-center">
                                        <span class="text-surface-500 text-sm">No Image</span>
                                    </div>
                                </div>

                                <div class="flex-1 min-w-0">
                                    <div class="text-sm font-medium text-surface-900 truncate">
                                        {{ item.product.name }}
                                    </div>
                                    <div class="text-sm text-primary-500">
                                        {{ formatCurrency(item.product.price) }}
                                    </div>
                                </div>

                                <Button icon="pi pi-trash" text-rounded size="small" severity="danger" class="w-7 h-7 flex-shrink-0" @click="removeFromCart(item.product.id)" />
                            </div>

                            <div class="flex items-center justify-between mt-2 pt-2 border-t border-surface-200">
                                <div class="flex items-center gap-1">
                                    <Button icon="pi pi-minus" text rounded size="small" severity="secondary" class="w-7 h-7" @click="updateQuantity(item.product.id, item.quantity - 1)"/>
                                    <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>

                                    <Button icon="pi pi-plus" text rounded size="small" severity="secondary" class="w-7 h-7" @click="updateQuantity(item.product.id, item.quantity + 1)"/>
                                </div>
                                <div class="text-sm font-semibold text-surface-900">
                                    {{ formatCurrency(item.product.price * item.quantity) }}
                                </div>
                            </div>

                        </div>
                    </div>

                    <div v-if="cart.length > 0"  class="border-t border-surface-900 pt-4 space-y-2">
                        <div class="flex justify-between text-sm text-surface-600">
                            <span>Subtotal</span>
                            <span>{{ formatCurrency(subtotal)}}</span>
                        </div>
                        <div class="flex justify-between text-sm text-surface-600">
                            <span>Tax (11%)</span>
                            <span>{{ formatCurrency(tax)}}</span>
                        </div>
                        <div class="flex justify-between text-lg font-bold text-surface-900 border-t border-surface-200 pt-2 ">
                            <span>Total</span>
                            <span>{{ formatCurrency(total)}}</span>
                        </div>

                        <div class="pt-3 border-t border-surface-100">
                            <label class="text-sm font-medium text-surface-700 mb-2 block">Payment Amount</label>
                            <InputNumber v-model="paymentAmount" mode="currency" currency="IDR" locale="id-ID" placeholder="Enter ammout" class="w-full"/>
                        </div>
                    </div>

                    <div class="mt-4 space-y-2">
                        <Button label="Checkout" icon="pi pi-check" class="w-full" @click="handleCheckout"/>
                        <Button label="Clear chart" icon="pi pi-trash" class="w-full" severity="secondary" :disabled="cart.length === 0" @click="clearCart"/>
                    </div>
                </div>
            </div>
        </div>
        <Dialog v-model:visible="showCustomerModal" modal header="Create Customer" :style="{ width: '28rem' }">
        <form @submit.prevent="submitCustomer" class="flex flex-col gap-5 pt-2">
            <!-- Name -->
            <div class="flex flex-col gap-2">
                <label for="customer-name" class="font-medium text-surface-900">
                    Name <span class="text-red-600">*</span>
                </label>
                <InputText id="customer-name"
                    v-model="customerForm.name"
                    type="text"
                    placeholder="Customer name.."
                    fluid
                    class="bg-surface-50! focus:bg-white! border-surface-200"
                    :invalid="!!customerErrors.name"
                />
                <Message v-if="customerErrors.name" severity="error" size="small" variant="simple">
                    {{ customerErrors.name[0] }}
                </Message>
            </div>

            <!-- Phone -->
            <div class="flex flex-col gap-2">
                <label for="customer-phone" class="font-medium text-surface-900">
                    Phone <span class="text-red-600">*</span>
                </label>
                <InputText id="customer-phone"
                    v-model="customerForm.phone"
                    type="text"
                    placeholder="08xxxxxxxxxx"
                    fluid
                    class="bg-surface-50! focus:bg-white! border-surface-200"
                    :invalid="!!customerErrors.phone"
                />
                <Message v-if="customerErrors.phone" severity="error" size="small" variant="simple">
                    {{ customerErrors.phone[0] }}
                </Message>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-2 border-t border-surface-100">
                <Button label="Cancel" severity="secondary" text @click="showCustomerModal = false" />
                <Button type="submit" label="Save Customer" icon="pi pi-check" :loading="customerFormLoading" />
            </div>
        </form>
    </Dialog>

    <Dialog modal header="Transaction Receipt" :style="{ width: '28 rem'}" :closable="false" v-model:visible="showReceiptModal"  >
        <div v-if="receiptData" class="text-sm">
            <!-- Header -->
            <div class="text-center mb-4 pb-3 border-b border-dashed border-surface-300">
                <div class="text-base font-semibold">BWAPOS</div>
                <div class="text-xs text-surface-600">{{receiptData.date}}</div>
            </div>

            <!-- Transaction Info -->
            <div class="mb-3 space-y-1">
                <div class="flex justify-between">
                    <span class="text-surface-500">Transaction Code: </span>
                    <span class="font-mono font-semibold">{{ receiptData.code}}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-surface-500">Customer: </span>
                    <span class="font-mono font-medium">{{ receiptData.customer?.name}}</span>
                </div>
            </div>

            <!-- Items -->
            <div class="border-t border dashed border-surface-300 py-3 space-y-2">
                <div v-for="(item, idx) in receiptData.items" :key="idx" class="flex justify-between">
                    <div class="flex-1">
                        <div class="font-medium">{{ item.name }}</div>
                        <div class="text-xs text-surface-500">
                            {{ item.quantity }} x {{ formatCurrency(item.price) }}
                        </div>
                    </div>
                    <div>
                        {{ formatCurrency(item.subtotal) }}
                    </div>
                </div>
            </div>

            <!-- Totals -->
            <div class="border-t border-dashed border-surface-300 pt-3 space-y-1">
                <div class="flex justify-between text-surface-600">
                    <span>Subtotal</span>
                    <span>{{ formatCurrency(receiptData.subtotal)}}</span>
                </div>
                <div class="flex justify-between text-surface-600">
                    <span>Tax (11%)</span>
                    <span>{{ formatCurrency(receiptData.tax)}}</span>
                </div>
                <div class="flex justify-between text-surface-600">
                    <span>Total</span>
                    <span>{{ formatCurrency(receiptData.total)}}</span>
                </div>
                <div class="flex justify-between text-surface-600">
                    <span>Payment</span>
                    <span>{{ formatCurrency(receiptData.payment)}}</span>
                </div>
                <div class="flex justify-between text-surface-600">
                    <span>Change</span>
                    <span>{{ formatCurrency(receiptData.change)}}</span>
                </div>

            </div>

            <!-- Footer -->
            <div class="text-center mt-4 pt-3 border-t border-dashed border-surface-300">
                <div class="text-sm text-surface-400">Thank you for shopping with us!</div>
            </div>
        </div>

        <div class="flex justify-end gap-2 mt-4 pt-4 border-t border-surface-200">
            <Button label="Print Receipt" icon="pi pi-print" severity="secondary" outlined />
            <Button label="OK" icon="pi pi-check" @click="closeReceipt" />
        </div>
    </Dialog>
    </div>
</template>

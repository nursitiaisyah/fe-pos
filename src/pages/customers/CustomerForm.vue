<script setup lang="ts">
import { createCustomer, getCustomer, updateCustomer } from '@/api/customers.api';
import { Button, InputText, Message, useToast } from 'primevue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const errors = ref<Record<string, string[]>>({})

const form = ref({
    id: 0,
    name: "",
    phone: ""
})

const customerId = computed<number | null>(() =>
    route.params.id ? Number(route.params.id) : null
)

const isEdit = computed(() => !!customerId.value)

const submit = async () => {
    loading.value = true

    try {

        const payload = {
            name: form.value.name,
            phone: form.value.phone
        }

        if (isEdit.value) {
            await updateCustomer(form.value.id, payload)
        } else {
            const res = await createCustomer(payload)
            form.value.id = res.data.data.id
        }

        toast.add({
            severity: "success",
            summary: "Success",
            detail: isEdit.value ? "Customer updated successfully" : "Customer created successfully",
            life: 3000
        })

        router.push("/customers")
    } catch (error: any) {
        if (error.response?.status === 422) {
            errors.value = error.response?.data.errors ?? {}
            return
        }

        toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message,
            life: 3000
        })
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    if (!isEdit.value) return

    loading.value = true

    try {
        const res = await getCustomer(customerId.value!)
        const data = res.data.data

        form.value.id = data.id
        form.value.name = data.name
        form.value.phone = data.phone
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load customer",
            life: 3000
        })
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
                    <span v-if="isEdit">
                        Edit Customer
                    </span>
                    <span v-else>
                        Create Customer
                    </span>
                </h1>
                <p class="text-surface-500 text-sm">
                    <span v-if="isEdit">
                        Update customer detail
                    </span>
                    <span v-else>
                        Add a new customer
                    </span>
                </p>
            </div>

            <Button asChild v-slot="slotProps">
                <RouterLink :to="{ name: 'customers' }" :class="slotProps.class">
                    <i class="pi pi-arrow-left"></i>
                    Back
                </RouterLink>
            </Button>
        </div>

        <div class="bg-white rounded-2xl border border-surface-200 overflow-hidden">
            <form @submit.prevent="submit">
                <div class="p-6 md:p-8 flex flex-col gap-6 max-w-2xl">

                    <!-- Name -->
                    <div class="flex flex-col gap-2">
                        <label for="name" class="font-medium text-surface-900">
                            Name <span class="text-red-600">*</span>
                        </label>
                        <InputText id="name"
                            v-model="form.name"
                            type="text"
                            placeholder="Customer name.."
                            fluid
                            class="bg-surface-50! focus:bg-white! border-surface-200" :invalid="!!errors.name" />
                        <Message v-if="errors.name" severity="error" size="small" variant="simple">
                            {{ errors.name[0] }}
                        </Message>
                    </div>

                    <!-- Phone -->
                    <div class="flex flex-col gap-2">
                        <label for="phone" class="font-medium text-surface-900">
                            Phone <span class="text-red-600">*</span>
                        </label>
                        <InputText id="phone"
                            v-model="form.phone"
                            type="text"
                            placeholder="08xxxxxxxxxx"
                            fluid
                            class="bg-surface-50! focus:bg-white! border-surface-200" :invalid="!!errors.phone" />
                        <Message v-if="errors.phone" severity="error" size="small" variant="simple">
                            {{ errors.phone[0] }}
                        </Message>
                    </div>

                    <!-- Tombol -->
                    <div class="flex justify-end pt-4 mt-auto border-t border-surface-100">
                        <div class="flex gap-3">
                            <Button label="Cancel" severity="secondary" text @click="router.back()"></Button>
                            <Button type="submit" label="Save Customer" icon="pi pi-check"></Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

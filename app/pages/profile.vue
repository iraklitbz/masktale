<script setup lang="ts">
import type { Order } from '~/types/checkout'

definePageMeta({
  middleware: 'auth',
  ssr: false,
})

const { user, logout } = useAuth()
const { orders, isLoadingOrders, getUserOrders } = useOrders()
const router = useRouter()
const toast = useToast()

// Delete account state
const showDeleteConfirm = ref(false)
const deleteLoading = ref(false)
const confirmText = ref('')

// Order details modal
const selectedOrder = ref<Order | null>(null)
const showOrderDetails = ref(false)

// Load orders on mount
onMounted(async () => {
  await getUserOrders()
})

// Get last 3 orders
const recentOrders = computed(() => {
  return orders.value.slice(0, 3)
})

// View order details
const viewDetails = (order: Order) => {
  selectedOrder.value = order
  showOrderDetails.value = true
}

// Close details modal
const closeDetails = () => {
  showOrderDetails.value = false
  setTimeout(() => {
    selectedOrder.value = null
  }, 300)
}

// Block body scroll when modal is open
watch(showOrderDetails, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Also handle delete modal scroll blocking
watch(showDeleteConfirm, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Handle delete account
const handleDeleteAccount = async () => {
  if (confirmText.value !== user.value?.username) {
    toast.error('Error', 'El nombre de usuario no coincide')
    return
  }

  deleteLoading.value = true

  try {
    const client = useStrapiClient()

    // Delete user account
    await client(`/users/${user.value?.id}`, {
      method: 'DELETE',
    })

    toast.success('Cuenta eliminada', 'Tu cuenta ha sido eliminada correctamente')

    // Logout and redirect
    await logout()
    router.push('/')
  } catch (error: any) {
    console.error('[Profile] Delete account error:', error)
    toast.error('Error', 'No se pudo eliminar la cuenta')
  } finally {
    deleteLoading.value = false
  }
}

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format price
const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

// Get state configuration
const getStateConfig = (state: string) => {
  const configs = {
    completed: {
      label: 'Completado',
      color: 'bg-green-100 text-green-700',
    },
    processing: {
      label: 'En proceso',
      color: 'bg-blue-100 text-blue-700',
    },
    pending: {
      label: 'Pendiente',
      color: 'bg-yellow-100 text-yellow-700',
    },
    failed: {
      label: 'Fallido',
      color: 'bg-red-100 text-red-700',
    },
  }

  return configs[state as keyof typeof configs] || configs.pending
}
</script>

<template>
  <ClientOnly>
    <div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Mi Perfil
        </h1>
        <p class="text-gray-600">
          Administra tu información personal y configuración de cuenta
        </p>
      </div>

      <!-- Profile Card -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
        <!-- Avatar Section -->
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-12 text-center">
          <div class="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-bold mb-4">
            {{ user?.username.charAt(0).toUpperCase() }}
          </div>
          <h2 class="text-2xl font-bold text-white mb-1">
            {{ user?.username }}
          </h2>
          <p class="text-purple-100">
            {{ user?.email }}
          </p>
        </div>

        <!-- Info Section -->
        <div class="px-8 py-6 space-y-6">
          <!-- Username -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Nombre de usuario
            </label>
            <div class="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <p class="text-gray-900">{{ user?.username }}</p>
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Correo electrónico
            </label>
            <div class="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
              <p class="text-gray-900">{{ user?.email }}</p>
              <span v-if="user?.confirmed" class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Verificado
              </span>
            </div>
          </div>

          <!-- Account Created -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Cuenta creada
            </label>
            <div class="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <p class="text-gray-900">{{ formatDate(user?.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div class="px-8 py-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900">
                  Mis Pedidos Recientes
                </h3>
                <p class="text-sm text-gray-600">
                  Últimas compras realizadas
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="px-8 py-6">
          <!-- Loading -->
          <div v-if="isLoadingOrders" class="flex items-center justify-center py-12">
            <div class="flex flex-col items-center gap-3">
              <div class="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p class="text-sm text-gray-600">Cargando pedidos...</p>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="recentOrders.length === 0" class="text-center py-12">
            <div class="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h4 class="text-lg font-semibold text-gray-900 mb-2">
              No tienes pedidos aún
            </h4>
            <p class="text-sm text-gray-600 mb-4">
              Cuando realices tu primera compra, aparecerá aquí
            </p>
            <NuxtLink
              to="/"
              class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Crear mi primer libro
            </NuxtLink>
          </div>

          <!-- Orders List -->
          <div v-else class="space-y-4">
            <div
              v-for="order in recentOrders"
              :key="order.id"
              class="border-2 border-purple-100 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
              @click="viewDetails(order)"
            >
              <div class="flex items-start justify-between gap-4 mb-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <code class="text-xs font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      {{ order.orderNumber }}
                    </code>
                    <span :class="['inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full', getStateConfig(order.state).color]">
                      {{ getStateConfig(order.state).label }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(order.createdAt) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    {{ formatPrice(order.totalAmount) }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ order.items.length }} {{ order.items.length === 1 ? 'libro' : 'libros' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 text-sm text-gray-700">
                <svg class="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span class="truncate">
                  {{ order.items.map(item => item.bookTitle).join(', ') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-red-200">
        <div class="px-8 py-6 bg-red-50">
          <h3 class="text-lg font-bold text-red-900 mb-1">
            Zona de peligro
          </h3>
          <p class="text-sm text-red-700">
            Las acciones aquí son permanentes e irreversibles
          </p>
        </div>

        <div class="px-8 py-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-gray-900 mb-1">
                Eliminar cuenta
              </h4>
              <p class="text-sm text-gray-600">
                Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, ten seguridad.
              </p>
            </div>
            <button
              class="ml-4 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
              @click="showDeleteConfirm = true"
            >
              Eliminar cuenta
            </button>
          </div>
        </div>
      </div>

      <!-- Back to Home -->
      <div class="mt-6 text-center">
        <NuxtLink
          to="/"
          class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Volver al inicio
        </NuxtLink>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Transition name="modal">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        @click.self="showDeleteConfirm = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">
              ¿Estás seguro?
            </h3>
            <p class="text-gray-600">
              Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos.
            </p>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Escribe <span class="text-red-600">{{ user?.username }}</span> para confirmar
            </label>
            <input
              v-model="confirmText"
              type="text"
              class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-red-500 focus:outline-none transition-colors"
              :placeholder="user?.username"
            >
          </div>

          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              @click="showDeleteConfirm = false; confirmText = ''"
              :disabled="deleteLoading"
            >
              Cancelar
            </button>
            <button
              class="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleDeleteAccount"
              :disabled="deleteLoading || confirmText !== user?.username"
            >
              <span v-if="deleteLoading" class="flex items-center justify-center gap-2">
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Eliminando...
              </span>
              <span v-else>Eliminar definitivamente</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Order Details Modal -->
    <Transition name="modal">
      <div
        v-if="showOrderDetails && selectedOrder"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
        @click.self="closeDetails"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8">
          <!-- Header -->
          <div class="sticky top-0 bg-white px-8 py-6 border-b border-purple-100 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">
                Detalles del Pedido
              </h2>
              <code class="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                {{ selectedOrder.orderNumber }}
              </code>
            </div>
            <button
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              @click="closeDetails"
            >
              <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="px-8 py-6 space-y-6">
            <!-- Status -->
            <div :class="['p-4 rounded-xl', getStateConfig(selectedOrder.state).color]">
              <p class="font-semibold text-lg">
                Estado: {{ getStateConfig(selectedOrder.state).label }}
              </p>
            </div>

            <!-- Order Info -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600 mb-1">Fecha</p>
                <p class="font-semibold">{{ formatDate(selectedOrder.createdAt) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">Total</p>
                <p class="font-semibold text-lg text-purple-600">{{ formatPrice(selectedOrder.totalAmount) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">Cliente</p>
                <p class="font-semibold">{{ selectedOrder.customerName }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">Email</p>
                <p class="font-semibold">{{ selectedOrder.customerEmail }}</p>
              </div>
            </div>

            <!-- Items -->
            <div>
              <h3 class="text-lg font-bold text-gray-900 mb-4">Libros</h3>
              <div class="space-y-3">
                <div
                  v-for="item in selectedOrder.items"
                  :key="item.id"
                  class="bg-purple-50 border-2 border-purple-100 rounded-xl p-4"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                      <h4 class="font-semibold text-gray-900 mb-1">{{ item.bookTitle }}</h4>
                      <p class="text-sm text-gray-600">Para: <strong>{{ item.childName }}</strong></p>
                      <p class="text-sm text-gray-600 mt-1">
                        {{ formatPrice(item.unitPrice) }} × {{ item.quantity }}
                      </p>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                      <p class="font-bold text-gray-900">{{ formatPrice(item.subtotal) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Addresses -->
            <div v-if="selectedOrder.billingAddress || selectedOrder.shippingAddress" class="grid md:grid-cols-2 gap-4">
              <!-- Billing Address -->
              <div v-if="selectedOrder.billingAddress" class="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Facturación
                </h3>
                <div class="text-sm space-y-1">
                  <p>{{ selectedOrder.billingAddress.firstName }} {{ selectedOrder.billingAddress.lastName }}</p>
                  <p>{{ selectedOrder.billingAddress.street }}</p>
                  <p v-if="selectedOrder.billingAddress.streetLine2">{{ selectedOrder.billingAddress.streetLine2 }}</p>
                  <p>{{ selectedOrder.billingAddress.postalCode }} {{ selectedOrder.billingAddress.city }}</p>
                  <p>{{ selectedOrder.billingAddress.country }}</p>
                  <p v-if="selectedOrder.billingAddress.phone">Tel: {{ selectedOrder.billingAddress.phone }}</p>
                </div>
              </div>

              <!-- Shipping Address -->
              <div v-if="selectedOrder.shippingAddress" class="bg-green-50 border border-green-100 rounded-xl p-4">
                <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  Envío
                </h3>
                <div class="text-sm space-y-1">
                  <p>{{ selectedOrder.shippingAddress.firstName }} {{ selectedOrder.shippingAddress.lastName }}</p>
                  <p>{{ selectedOrder.shippingAddress.street }}</p>
                  <p v-if="selectedOrder.shippingAddress.streetLine2">{{ selectedOrder.shippingAddress.streetLine2 }}</p>
                  <p>{{ selectedOrder.shippingAddress.postalCode }} {{ selectedOrder.shippingAddress.city }}</p>
                  <p>{{ selectedOrder.shippingAddress.country }}</p>
                  <p v-if="selectedOrder.shippingAddress.phone">Tel: {{ selectedOrder.shippingAddress.phone }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="sticky bottom-0 bg-gray-50 px-8 py-4 border-t border-gray-200">
            <button
              class="w-full px-4 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors"
              @click="closeDetails"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Transition>
    </div>
  </ClientOnly>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.9);
}
</style>

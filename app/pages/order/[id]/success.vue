<script setup lang="ts">
import { formatPrice } from '~/config/products'
import type { Order } from '~/types/checkout'

const route = useRoute()
const router = useRouter()
const { clearCart } = useCart()
const { user, isAuthenticated } = useAuth()
const toast = useToast()

// Get Order ID from route
const orderId = computed(() => route.params.id as string)

// Meta tags
useHead({
  title: 'Pedido completado | Mask',
  meta: [
    { name: 'description', content: 'Tu pedido ha sido procesado exitosamente' },
  ],
})

// State
const isLoadingOrder = ref(true)
const orderData = ref<Order | null>(null)
const loadError = ref<string | null>(null)

// Animation state
const showSuccess = ref(false)

onMounted(async () => {
  // Show success animation
  setTimeout(() => {
    showSuccess.value = true
  }, 100)

  // Fetch order details from API
  try {
    isLoadingOrder.value = true

    const result = await $fetch(`/api/orders/${orderId.value}`)

    if (!result.success || !result.order) {
      throw new Error('No se pudo obtener la orden')
    }

    orderData.value = result.order
    console.log('[Success] Orden cargada:', orderData.value)

    // Clear cart after successfully loading the order
    setTimeout(() => {
      clearCart()
    }, 1000)

  } catch (error: any) {
    console.error('[Success] Error al cargar orden:', error)
    loadError.value = error.message || 'No se pudo cargar la orden'
    toast.error('Error', 'No se pudo cargar los detalles de la orden')
  } finally {
    isLoadingOrder.value = false
  }
})

const goToOrders = () => {
  if (isAuthenticated.value) {
    router.push('/profile')
  } else {
    router.push('/order/track')
  }
}
</script>

<template>
  <div class="success-page">
    <div class="container">
      <div class="success-card">
        <!-- Success Animation -->
        <Transition name="scale">
          <div
            v-if="showSuccess"
            class="success-icon-container"
          >
            <div class="success-icon">
              <svg
                class="checkmark"
                viewBox="0 0 52 52"
              >
                <circle
                  class="checkmark-circle"
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                />
                <path
                  class="checkmark-check"
                  fill="none"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>
          </div>
        </Transition>

        <!-- Success Message -->
        <div class="success-content">
          <h1 class="success-title">
            ¡Pago completado!
          </h1>
          <p class="success-subtitle">
            Tu pedido ha sido procesado exitosamente
          </p>

          <!-- Order ID -->
          <div
            v-if="orderData"
            class="order-id-section"
          >
            <p class="order-id-label">
              Número de pedido
            </p>
            <code class="order-id-code">{{ orderData.orderNumber }}</code>
          </div>

          <!-- Loading State -->
          <div
            v-else-if="isLoadingOrder"
            class="loading-state"
          >
            <div class="spinner" />
            <p>Cargando detalles de la orden...</p>
          </div>

          <!-- Order Summary -->
          <div
            v-if="orderData"
            class="order-summary"
          >
            <h2 class="summary-title">
              Resumen del pedido
            </h2>

            <div class="order-items">
              <div
                v-for="item in orderData.items"
                :key="item.sessionId"
                class="order-item"
              >
                <div class="item-info">
                  <p class="item-title">
                    {{ item.bookTitle }}
                  </p>
                  <p class="item-subtitle">
                    Para: <strong>{{ item.childName }}</strong>
                  </p>
                  <p class="item-quantity">
                    Cantidad: {{ item.quantity }}
                  </p>
                </div>
                <div class="item-price">
                  {{ formatPrice(item.price * item.quantity) }}
                </div>
              </div>
            </div>

            <div class="total-section">
              <span class="total-label">Total pagado</span>
              <span class="total-amount">{{ formatPrice(orderData.total) }}</span>
            </div>
          </div>

          <!-- Next Steps -->
          <div class="next-steps">
            <h3 class="steps-title">
              ¿Qué sigue?
            </h3>
            <ul class="steps-list">
              <li class="step-item">
                <svg
                  class="step-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Recibirás un email de confirmación en breve</span>
              </li>
              <li class="step-item">
                <svg
                  class="step-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span>Tus libros personalizados se están procesando</span>
              </li>
              <li class="step-item">
                <svg
                  class="step-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <span>Prepararemos tu pedido para el envío</span>
              </li>
            </ul>
          </div>

          <!-- Actions -->
          <div class="action-buttons">
            <button
              class="btn-primary"
              @click="goToOrders"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Ver mis pedidos
            </button>

            <NuxtLink
              to="/"
              class="btn-secondary"
            >
              Volver al inicio
            </NuxtLink>
          </div>

          <!-- Support Info -->
          <div class="support-section">
            <p class="support-text">
              ¿Necesitas ayuda?
              <a
                href="mailto:soporte@mask.com"
                class="support-link"
              >
                Contáctanos
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.success-page {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #faf5ff, #fce7f3, #eff6ff);
  padding: 2rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 48rem;
  width: 100%;
  margin: 0 auto;
}

.success-card {
  background-color: white;
  border-radius: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

/* Success Icon Animation */
.success-icon-container {
  padding: 3rem 2rem 2rem;
  display: flex;
  justify-content: center;
  background: linear-gradient(to bottom, #faf5ff, white);
}

.success-icon {
  width: 100px;
  height: 100px;
}

.checkmark {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: #10b981;
  stroke-miterlimit: 10;
}

.checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke: #10b981;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark-check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  stroke: #10b981;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

/* Success Content */
.success-content {
  padding: 2rem;
}

@media (min-width: 640px) {
  .success-content {
    padding: 3rem;
  }
}

.success-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(to right, #10b981, #059669);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 0.5rem;
}

.success-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;
}

/* Order ID Section */
.order-id-section {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.order-id-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.order-id-code {
  display: inline-block;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  color: #111827;
  word-break: break-all;
}

/* Order Summary */
.order-summary {
  border: 2px solid #e9d5ff;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  background-color: #faf5ff;
}

.summary-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e9d5ff;
}

.item-info {
  flex: 1;
}

.item-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.item-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.item-quantity {
  font-size: 0.75rem;
  color: #9333ea;
  font-weight: 500;
}

.item-price {
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  margin-left: 1rem;
}

.total-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 2px solid #e9d5ff;
  margin-top: 1rem;
}

.total-label {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.total-amount {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #9333ea, #db2777);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

/* Next Steps */
.next-steps {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.steps-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.step-item {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
}

.step-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #3b82f6;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 640px) {
  .action-buttons {
    flex-direction: row;
  }
}

.btn-primary,
.btn-secondary,
.btn-tertiary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  text-decoration: none;
  flex: 1;
}

.btn-primary {
  background: linear-gradient(to right, #9333ea, #db2777);
  color: white;
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(147, 51, 234, 0.4);
}

.btn-secondary {
  background-color: white;
  color: #9333ea;
  border: 2px solid #9333ea;
}

.btn-secondary:hover {
  background-color: #faf5ff;
  transform: translateY(-2px);
}

.btn-tertiary {
  background-color: #f3f4f6;
  color: #4b5563;
}

.btn-tertiary:hover {
  background-color: #e5e7eb;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: #6b7280;
}

.loading-state .spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top-color: #9333ea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Support Section */
.support-section {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.support-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.support-link {
  color: #9333ea;
  text-decoration: underline;
  font-weight: 500;
  margin-left: 0.25rem;
}

.support-link:hover {
  color: #7e22ce;
}

/* Transitions */
.scale-enter-active {
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0);
}

.scale-enter-to {
  opacity: 1;
  transform: scale(1);
}
</style>

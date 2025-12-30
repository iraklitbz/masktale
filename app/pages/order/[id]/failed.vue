<script setup lang="ts">
const route = useRoute()
const router = useRouter()

// Get Payment Intent ID and error from route
const paymentIntentId = computed(() => route.params.id as string)
const errorMessage = computed(() => route.query.error as string || 'Error desconocido')
const errorCode = computed(() => route.query.code as string)

// Meta tags
useHead({
  title: 'Pago fallido | Mask',
  meta: [
    { name: 'description', content: 'Hubo un problema al procesar tu pago' },
  ],
})

// Animation state
const showError = ref(false)

onMounted(() => {
  setTimeout(() => {
    showError.value = true
  }, 100)
})

const retryPayment = () => {
  router.push('/checkout')
}

const contactSupport = () => {
  window.location.href = `mailto:soporte@mask.com?subject=Error en pago ${paymentIntentId.value}&body=Error: ${errorMessage.value}`
}

// Get user-friendly error message
const getUserFriendlyError = (error: string, code?: string): { title: string; description: string; action: string } => {
  // Common Stripe error codes
  if (code === 'card_declined') {
    return {
      title: 'Tarjeta rechazada',
      description: 'Tu banco ha rechazado la transacción. Por favor, verifica con tu banco o intenta con otra tarjeta.',
      action: 'Intentar con otra tarjeta',
    }
  }

  if (code === 'insufficient_funds') {
    return {
      title: 'Fondos insuficientes',
      description: 'No hay suficientes fondos en tu tarjeta. Por favor, verifica tu saldo o intenta con otra tarjeta.',
      action: 'Intentar con otra tarjeta',
    }
  }

  if (code === 'expired_card') {
    return {
      title: 'Tarjeta expirada',
      description: 'La tarjeta que intentaste usar ha expirado. Por favor, usa otra tarjeta.',
      action: 'Intentar con otra tarjeta',
    }
  }

  if (code === 'incorrect_cvc') {
    return {
      title: 'CVC incorrecto',
      description: 'El código de seguridad (CVC) es incorrecto. Por favor, verifica los datos de tu tarjeta.',
      action: 'Reintentar',
    }
  }

  if (code === 'processing_error') {
    return {
      title: 'Error al procesar',
      description: 'Hubo un error temporal al procesar el pago. Por favor, intenta de nuevo.',
      action: 'Reintentar',
    }
  }

  if (error.toLowerCase().includes('network') || error.toLowerCase().includes('conexión')) {
    return {
      title: 'Error de conexión',
      description: 'Hubo un problema de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.',
      action: 'Reintentar',
    }
  }

  // Generic error
  return {
    title: 'No se pudo completar el pago',
    description: error || 'Ocurrió un error inesperado al procesar tu pago. Por favor, intenta de nuevo o contacta con soporte.',
    action: 'Reintentar',
  }
}

const errorInfo = computed(() => getUserFriendlyError(errorMessage.value, errorCode.value))
</script>

<template>
  <div class="error-page">
    <div class="container">
      <div class="error-card">
        <!-- Error Animation -->
        <Transition name="scale">
          <div
            v-if="showError"
            class="error-icon-container"
          >
            <div class="error-icon">
              <svg
                class="error-mark"
                viewBox="0 0 52 52"
              >
                <circle
                  class="error-circle"
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                />
                <path
                  class="error-cross"
                  fill="none"
                  d="M16 16 l20 20 M36 16 l-20 20"
                />
              </svg>
            </div>
          </div>
        </Transition>

        <!-- Error Content -->
        <div class="error-content">
          <h1 class="error-title">
            {{ errorInfo.title }}
          </h1>
          <p class="error-subtitle">
            {{ errorInfo.description }}
          </p>

          <!-- Error Details (Collapsible) -->
          <details class="error-details">
            <summary class="details-summary">
              Ver detalles técnicos
            </summary>
            <div class="details-content">
              <div
                v-if="paymentIntentId"
                class="detail-item"
              >
                <span class="detail-label">ID de pago:</span>
                <code class="detail-value">{{ paymentIntentId }}</code>
              </div>
              <div
                v-if="errorCode"
                class="detail-item"
              >
                <span class="detail-label">Código de error:</span>
                <code class="detail-value">{{ errorCode }}</code>
              </div>
              <div class="detail-item">
                <span class="detail-label">Mensaje:</span>
                <code class="detail-value">{{ errorMessage }}</code>
              </div>
            </div>
          </details>

          <!-- What happened section -->
          <div class="info-section">
            <h3 class="info-title">
              ¿Qué pasó?
            </h3>
            <ul class="info-list">
              <li class="info-item">
                <svg
                  class="info-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>No se realizó ningún cargo a tu tarjeta</span>
              </li>
              <li class="info-item">
                <svg
                  class="info-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Tus datos de carrito se han guardado</span>
              </li>
              <li class="info-item">
                <svg
                  class="info-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Puedes intentar nuevamente cuando quieras</span>
              </li>
            </ul>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button
              class="btn-primary"
              @click="retryPayment"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {{ errorInfo.action }}
            </button>

            <button
              class="btn-secondary"
              @click="contactSupport"
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
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Contactar soporte
            </button>

            <NuxtLink
              to="/cart"
              class="btn-tertiary"
            >
              Volver al carrito
            </NuxtLink>
          </div>

          <!-- Help Section -->
          <div class="help-section">
            <h3 class="help-title">
              ¿Necesitas ayuda?
            </h3>
            <p class="help-text">
              Si el problema persiste, puedes:
            </p>
            <ul class="help-list">
              <li>Verificar que los datos de tu tarjeta sean correctos</li>
              <li>Contactar con tu banco para verificar que permiten pagos online</li>
              <li>Intentar con otro método de pago</li>
              <li>
                <a
                  href="mailto:soporte@mask.com"
                  class="help-link"
                >
                  Contactarnos directamente
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #fef2f2, #fee2e2, #fce7f3);
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

.error-card {
  background-color: white;
  border-radius: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

/* Error Icon Animation */
.error-icon-container {
  padding: 3rem 2rem 2rem;
  display: flex;
  justify-content: center;
  background: linear-gradient(to bottom, #fef2f2, white);
}

.error-icon {
  width: 100px;
  height: 100px;
}

.error-mark {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: #dc2626;
  stroke-miterlimit: 10;
}

.error-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke: #dc2626;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.error-cross {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  stroke: #dc2626;
  stroke-width: 2;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

/* Error Content */
.error-content {
  padding: 2rem;
}

@media (min-width: 640px) {
  .error-content {
    padding: 3rem;
  }
}

.error-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.error-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* Error Details */
.error-details {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 2rem;
}

.details-summary {
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  list-style: none;
}

.details-summary::-webkit-details-marker {
  display: none;
}

.details-summary::before {
  content: '▶ ';
  display: inline-block;
  margin-right: 0.5rem;
  transition: transform 0.2s;
}

.error-details[open] .details-summary::before {
  transform: rotate(90deg);
}

.details-content {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  padding: 0.5rem;
  color: #111827;
  word-break: break-all;
}

/* Info Section */
.info-section {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.info-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
}

.info-icon {
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
  background: linear-gradient(to right, #dc2626, #b91c1c);
  color: white;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
}

.btn-secondary {
  background-color: white;
  color: #dc2626;
  border: 2px solid #dc2626;
}

.btn-secondary:hover {
  background-color: #fef2f2;
  transform: translateY(-2px);
}

.btn-tertiary {
  background-color: #f3f4f6;
  color: #4b5563;
}

.btn-tertiary:hover {
  background-color: #e5e7eb;
}

/* Help Section */
.help-section {
  background-color: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 1rem;
  padding: 1.5rem;
}

.help-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
}

.help-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.help-list {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.help-link {
  color: #9333ea;
  text-decoration: underline;
  font-weight: 500;
}

.help-link:hover {
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
